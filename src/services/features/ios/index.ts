// iOS-specific services for Newomen app
export { default as IOSNotificationService } from './NotificationService';
export { default as IOSBiometricService } from './BiometricService';
export { default as IOSHapticsService } from './HapticsService';
export { default as IOSHealthKitService } from './HealthKitService';

export type { NotificationSchedule } from './NotificationService';
export type { BiometricOptions } from './BiometricService';
export type { HapticIntensity, HapticNotification } from './HapticsService';
export type { HealthData, HealthKitPermission } from './HealthKitService';

// Unified iOS service manager
export class IOSServiceManager {
  private static instance: IOSServiceManager;

  static getInstance(): IOSServiceManager {
    if (!IOSServiceManager.instance) {
      IOSServiceManager.instance = new IOSServiceManager();
    }
    return IOSServiceManager.instance;
  }

  // Service instances
  public readonly notifications = IOSNotificationService.getInstance();
  public readonly biometrics = IOSBiometricService.getInstance();
  public readonly haptics = IOSHapticsService.getInstance();
  public readonly healthKit = IOSHealthKitService.getInstance();

  // Initialization method
  async initialize(): Promise<void> {
    try {
      // Initialize notifications
      await this.notifications.requestPermissions();
      await this.notifications.createNotificationChannel();
      await this.notifications.updateStatusBar();

      // Check biometric availability
      await this.biometrics.checkBiometricAvailability();

      // Check HealthKit availability
      await this.healthKit.isHealthKitAvailable();

      console.log('iOS services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize iOS services:', error);
    }
  }

  // Wellness-specific integration
  async setupWellnessFeatures(): Promise<void> {
    try {
      // Request necessary permissions
      await this.notifications.requestPermissions();
      await this.healthKit.requestAuthorization();

      // Setup wellness reminders
      await this.scheduleWellnessNotifications();

      console.log('Wellness features setup complete');
    } catch (error) {
      console.error('Failed to setup wellness features:', error);
    }
  }

  private async scheduleWellnessNotifications(): Promise<void> {
    const now = new Date();

    // Morning wellness check-in
    const morningCheckIn = new Date(now);
    morningCheckIn.setHours(9, 0, 0, 0);
    if (morningCheckIn < now) {
      morningCheckIn.setDate(morningCheckIn.getDate() + 1);
    }

    await this.notifications.scheduleWellnessReminder(
      'Daily Check-in',
      'Start your day with a quick wellness check-in',
      morningCheckIn
    );

    // Evening reflection
    const eveningReflection = new Date(now);
    eveningReflection.setHours(20, 0, 0, 0);
    if (eveningReflection < now) {
      eveningReflection.setDate(eveningReflection.getDate() + 1);
    }

    await this.notifications.scheduleWellnessReminder(
      'Evening Reflection',
      'Take a moment to reflect on your day',
      eveningReflection
    );
  }

  // Security integration
  async setupSecurityFeatures(): Promise<void> {
    try {
      const biometricStatus = await this.biometrics.checkBiometricAvailability();

      if (biometricStatus.available && biometricStatus.enrolled) {
        console.log('Biometric authentication available');
        // You could enable biometric auth by default here
      }

      console.log('Security features setup complete');
    } catch (error) {
      console.error('Failed to setup security features:', error);
    }
  }

  // App lifecycle integration
  async onAppResume(): Promise<void> {
    try {
      // Refresh notifications
      await this.notifications.updateStatusBar();

      // Provide haptic feedback for app resume
      if (this.haptics.isHapticsEnabled()) {
        await this.haptics.impact('light');
      }
    } catch (error) {
      console.error('Failed to handle app resume:', error);
    }
  }

  async onAppPause(): Promise<void> {
    try {
      // Cancel any pending notifications that shouldn't fire when app is paused
      // This could be expanded based on specific requirements
    } catch (error) {
      console.error('Failed to handle app pause:', error);
    }
  }
}

export default IOSServiceManager;