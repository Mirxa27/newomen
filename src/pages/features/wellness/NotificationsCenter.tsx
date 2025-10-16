'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import { Switch } from '@/components/shared/ui/switch';
import { notificationService } from '@/services/features/wellness/NotificationService';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { toast } from 'sonner';

type NotificationTab = 'inbox' | 'preferences';
type NotificationChannel = 'push' | 'email' | 'in_app';

export default function NotificationsCenter() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<NotificationTab>('inbox');

  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => user?.id ? notificationService.getNotifications(user.id, 50) : Promise.resolve([]),
    enabled: !!user?.id
  });

  // Fetch notification preferences
  const { data: preferences = [] } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: () => user?.id ? notificationService.getNotificationPreferences(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: () => user?.id ? notificationService.getUnreadCount(user.id) : Promise.resolve(0),
    enabled: !!user?.id
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      refetchNotifications();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllNotificationsAsRead(user.id);
      refetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      refetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handlePreferenceChange = async (notificationType: string, channel: NotificationChannel, enabled: boolean) => {
    if (!user?.id) return;
    try {
      await notificationService.setNotificationPreference(user.id, notificationType, channel, enabled);
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'meditation': '🧘',
      'affirmation': '✨',
      'habit': '🎯',
      'social': '👥',
      'promotion': '🎁',
      'alert': '⚠️',
      'reminder': '⏰'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'meditation': 'bg-purple-100 text-purple-800 border-purple-300',
      'affirmation': 'bg-pink-100 text-pink-800 border-pink-300',
      'habit': 'bg-blue-100 text-blue-800 border-blue-300',
      'social': 'bg-green-100 text-green-800 border-green-300',
      'promotion': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'alert': 'bg-red-100 text-red-800 border-red-300',
      'reminder': 'bg-indigo-100 text-indigo-800 border-indigo-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-10 h-10" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full font-semibold">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage your notifications and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'inbox', label: 'Inbox' },
            { id: 'preferences', label: 'Preferences' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as NotificationTab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inbox Tab */}
        {selectedTab === 'inbox' && (
          <div className="space-y-4">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="w-full"
              >
                Mark All as Read
              </Button>
            )}

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map(notification => (
                  <Card
                    key={notification.id}
                    className={`p-6 transition-all ${
                      !notification.is_read
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                        : 'bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`text-3xl p-3 rounded-lg ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                            )}
                          </div>

                          <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-4 mt-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                              notification.priority === 'high' || notification.priority === 'urgent'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.priority}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            onClick={() => handleMarkAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            title="Mark as read"
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          title="Delete notification"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No notifications yet</p>
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {selectedTab === 'preferences' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <SettingsIcon className="w-6 h-6" />
                Notification Preferences
              </h2>

              <div className="space-y-6">
                {[
                  { type: 'meditation', label: 'Meditation Reminders' },
                  { type: 'affirmation', label: 'Daily Affirmations' },
                  { type: 'habit', label: 'Habit Reminders' },
                  { type: 'social', label: 'Social Notifications' },
                  { type: 'promotion', label: 'Promotional Offers' }
                ].map(notifType => (
                  <div key={notifType.type} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{notifType.label}</h3>

                    <div className="space-y-3">
                      {[
                        { channel: 'push', label: 'Push Notifications' },
                        { channel: 'email', label: 'Email Notifications' },
                        { channel: 'in_app', label: 'In-App Notifications' }
                      ].map(ch => {
                        const pref = preferences.find(p => p.notification_type === notifType.type && p.channel === ch.channel);
                        return (
                          <div key={ch.channel} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <label className="text-gray-700 dark:text-gray-300 font-medium">{ch.label}</label>
                            <Switch
                              checked={pref?.enabled ?? true}
                              onCheckedChange={(checked) => handlePreferenceChange(notifType.type, ch.channel as NotificationChannel, checked)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">💡 Tip</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                You can customize when and how you receive notifications. Adjust these settings to create your perfect notification experience.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
