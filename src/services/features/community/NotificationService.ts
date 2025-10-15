import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: 'post' | 'comment' | 'like' | 'challenge' | 'announcement' | 'message';
  related_entity_type: 'post' | 'comment' | 'challenge' | 'announcement';
  related_entity_id: string;
  actor_id?: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: data as Notification[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        data: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      };
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return {
        success: true,
        unreadCount: count || 0,
      };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return {
        success: false,
        unreadCount: 0,
        error: error instanceof Error ? error.message : 'Failed to get unread count',
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark as read',
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark all as read',
      };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  async deleteOldNotifications(userId: string, daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_read', true);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete old notifications',
      };
    }
  }
}

export const notificationService = NotificationService.getInstance();
