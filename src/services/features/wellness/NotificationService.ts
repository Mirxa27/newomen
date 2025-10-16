import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'meditation' | 'affirmation' | 'habit' | 'social' | 'promotion' | 'alert' | 'reminder';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  user_id: string;
  notification_type: string;
  channel: 'push' | 'email' | 'in_app';
  enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

interface ScheduledNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: Notification['type'];
  scheduled_time: string;
  status: 'pending' | 'sent' | 'failed';
}

class NotificationService {
  /**
   * Send in-app notification
   */
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    priority: Notification['priority'] = 'normal',
    relatedId?: string
  ): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          priority,
          related_id: relatedId,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Notification sent to user ${userId}: ${title}`);
      return data;
    } catch (error) {
      logError("Error sending notification", error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Check if user has push notifications enabled
      const { data: preference } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .eq("channel", "push")
        .single();

      if (!preference?.enabled) return;

      // Get user's device tokens
      const { data: devices } = await supabase
        .from("user_devices")
        .select("push_token")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (!devices || devices.length === 0) return;

      // Send push to each device
      for (const device of devices) {
        if (device.push_token) {
          await this.sendPushToDevice(device.push_token, title, message, payload);
        }
      }

      logInfo(`Push notification sent to user ${userId}`);
    } catch (error) {
      logError("Error sending push notification", error);
    }
  }

  /**
   * Send push to specific device (integration with push service)
   */
  private async sendPushToDevice(
    token: string,
    title: string,
    message: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    try {
      // This would integrate with your push notification service (Firebase Cloud Messaging, OneSignal, etc.)
      // Implementation depends on your chosen push service
      console.log(`Sending push to token ${token}:`, { title, message, payload });
      
      // Example with Supabase edge function
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          token,
          title,
          message,
          payload
        })
      });

      if (!response.ok) throw new Error('Failed to send push notification');
    } catch (error) {
      logError("Error sending push to device", error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    userId: string,
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<void> {
    try {
      // Get user email
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user?.user?.email) throw new Error('User email not found');

      // Check notification preference
      const { data: preference } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .eq("channel", "email")
        .single();

      if (!preference?.enabled) return;

      // Send via Supabase edge function or email service
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: user.user.email,
          subject,
          html: htmlContent,
          text: textContent
        })
      });

      if (!response.ok) throw new Error('Failed to send email');

      logInfo(`Email notification sent to ${user.user.email}`);
    } catch (error) {
      logError("Error sending email notification", error);
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    scheduledTime: Date
  ): Promise<ScheduledNotification | null> {
    try {
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .insert({
          user_id: userId,
          title,
          message,
          notification_type: type,
          scheduled_time: scheduledTime.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Notification scheduled for user ${userId} at ${scheduledTime}`);
      return data;
    } catch (error) {
      logError("Error scheduling notification", error);
      throw error;
    }
  }

  /**
   * Send daily affirmation notification
   */
  async sendDailyAffirmation(userId: string): Promise<void> {
    try {
      // Get user's preferred affirmation categories
      const { data: settings } = await supabase
        .from("user_affirmation_settings")
        .select("selected_categories")
        .eq("user_id", userId)
        .single();

      const categories = settings?.selected_categories || ['motivation'];

      // Get random affirmation from selected categories
      const { data: affirmations } = await supabase
        .from("daily_affirmations")
        .select("*")
        .in("category", categories)
        .eq("is_active", true)
        .limit(1)
        .order('id', { ascending: false });

      if (!affirmations || affirmations.length === 0) return;

      const affirmation = affirmations[0];
      await this.sendNotification(userId, "Daily Affirmation", affirmation.content, 'affirmation');
      await this.sendPushNotification(userId, "Your Daily Affirmation", affirmation.content);
    } catch (error) {
      logError(`Error sending daily affirmation to user ${userId}`, error);
    }
  }

  /**
   * Send meditation reminder
   */
  async sendMeditationReminder(userId: string): Promise<void> {
    try {
      await this.sendNotification(
        userId,
        "Time to Meditate",
        "Take a moment for yourself. Start your meditation practice now.",
        'meditation'
      );
      await this.sendPushNotification(
        userId,
        "Time to Meditate",
        "Start your meditation practice now"
      );
    } catch (error) {
      logError(`Error sending meditation reminder to user ${userId}`, error);
    }
  }

  /**
   * Send habit check-in reminder
   */
  async sendHabitReminder(userId: string, habitTitle: string, habitId: string): Promise<void> {
    try {
      await this.sendNotification(
        userId,
        "Habit Check-in",
        `Don't forget to check in on "${habitTitle}"!`,
        'reminder',
        'normal',
        habitId
      );
      await this.sendPushNotification(
        userId,
        "Habit Check-in",
        `Don't forget to check in on "${habitTitle}"!`
      );
    } catch (error) {
      logError(`Error sending habit reminder to user ${userId}`, error);
    }
  }

  /**
   * Get user's notifications
   */
  async getNotifications(userId: string, limit: number = 50, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching notifications for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      logInfo(`Notification ${notificationId} marked as read`);
    } catch (error) {
      logError("Error marking notification as read", error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      logInfo(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logError("Error marking all notifications as read", error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      logInfo(`Notification ${notificationId} deleted`);
    } catch (error) {
      logError("Error deleting notification", error);
    }
  }

  /**
   * Set notification preferences
   */
  async setNotificationPreference(
    userId: string,
    notificationType: string,
    channel: 'push' | 'email' | 'in_app',
    enabled: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          notification_type: notificationType,
          channel,
          enabled
        });

      if (error) throw error;

      logInfo(`Notification preference updated for user ${userId}`);
    } catch (error) {
      logError("Error setting notification preference", error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching notification preferences for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logError(`Error fetching unread count for user ${userId}`, error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
