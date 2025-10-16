import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface NotificationSchedule {
  id: number;
  title: string;
  body: string;
  schedule: {
    at: Date;
    allowWhileIdle?: boolean;
  };
  sound?: string;
  attachments?: {
    id: string;
    url: string;
    options?: {
      thumbnailClippingRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
  }[];
}

export class IOSNotificationService {
  private static instance: IOSNotificationService;

  static getInstance(): IOSNotificationService {
    if (!IOSNotificationService.instance) {
      IOSNotificationService.instance = new IOSNotificationService();
    }
    return IOSNotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const result = await LocalNotifications.requestPermissions();
    return result.granted;
  }

  async scheduleNotification(notification: NotificationSchedule): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications not available on web');
      return;
    }

    await LocalNotifications.schedule({
      notifications: [notification]
    });

    // Trigger haptic feedback
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async scheduleWellnessReminder(title: string, message: string, time: Date): Promise<void> {
    const notification: NotificationSchedule = {
      id: Date.now(),
      title: `🌟 Newomen Wellness - ${title}`,
      body: message,
      schedule: {
        at: time,
        allowWhileIdle: true
      },
      sound: 'beep.wav'
    };

    await this.scheduleNotification(notification);
  }

  async scheduleCouplesChallenge(
    challengeName: string,
    partnerName: string,
    time: Date
  ): Promise<void> {
    const notification: NotificationSchedule = {
      id: Date.now(),
      title: `💑 Couples Challenge`,
      body: `${partnerName} wants to start "${challengeName}"!`,
      schedule: {
        at: time,
        allowWhileIdle: true
      },
      sound: 'beep.wav'
    };

    await this.scheduleNotification(notification);
  }

  async scheduleAISessionReminder(time: Date): Promise<void> {
    const notification: NotificationSchedule = {
      id: Date.now(),
      title: `🤖 AI Companion Session`,
      body: 'Your AI companion is ready for your daily check-in!',
      schedule: {
        at: time,
        allowWhileIdle: true
      },
      sound: 'beep.wav'
    };

    await this.scheduleNotification(notification);
  }

  async cancelNotification(id: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await LocalNotifications.cancel({
      notifications: [{ id }]
    });
  }

  async clearAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await LocalNotifications.cancel({
      notifications: [] // Cancels all
    });
  }

  async getPendingNotifications(): Promise<any[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    const result = await LocalNotifications.getPending();
    return result.notifications || [];
  }

  async createNotificationChannel(): Promise<void> {
    // iOS doesn't use notification channels like Android, but this
    // method exists for consistency across platforms
    console.log('iOS notification channels not required');
  }

  async updateStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Set status bar style for iOS
    await StatusBar.setStyle({ style: Style.Light });
  }
}

export default IOSNotificationService;