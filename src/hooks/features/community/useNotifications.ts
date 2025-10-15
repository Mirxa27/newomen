import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationService, Notification } from '@/services/features/community/NotificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user ID
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await notificationService.getNotifications(user.id, 50, 0);
      if (response.success) {
        setNotifications(response.data);
        
        // Count unread notifications
        const unread = response.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        setError(response.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    fetchNotifications();

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new notifications
      const unsubscribe = notificationService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      );

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    setupRealtimeSubscription().then(fn => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? {
                  ...n,
                  is_read: true,
                  read_at: new Date().toISOString(),
                }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await notificationService.markAllAsRead(user.id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
