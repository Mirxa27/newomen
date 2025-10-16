import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticIntensity = 'light' | 'medium' | 'heavy';
export type HapticNotification = 'success' | 'warning' | 'error';

export class IOSHapticsService {
  private static instance: IOSHapticsService;

  static getInstance(): IOSHapticsService {
    if (!IOSHapticsService.instance) {
      IOSHapticsService.instance = new IOSHapticsService();
    }
    return IOSHapticsService.instance;
  }

  async impact(intensity: HapticIntensity = 'medium'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log(`Haptic impact (${intensity}) - not available on web`);
      return;
    }

    try {
      const styleMap: Record<HapticIntensity, ImpactStyle> = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };

      await Haptics.impact({ style: styleMap[intensity] });
    } catch (error) {
      console.error('Haptic impact failed:', error);
    }
  }

  async notification(type: HapticNotification): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log(`Haptic notification (${type}) - not available on web`);
      return;
    }

    try {
      const typeMap: Record<HapticNotification, NotificationType> = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      };

      await Haptics.notification({ type: typeMap[type] });
    } catch (error) {
      console.error('Haptic notification failed:', error);
    }
  }

  async selection(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Haptic selection - not available on web');
      return;
    }

    try {
      await Haptics.selection();
    } catch (error) {
      console.error('Haptic selection failed:', error);
    }
  }

  async vibratePattern(pattern: number[]): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log(`Vibrate pattern ${JSON.stringify(pattern)} - not available on web`);
      return;
    }

    try {
      // iOS doesn't support custom vibration patterns like Android
      // We'll simulate with impact haptics
      for (let i = 0; i < pattern.length; i++) {
        if (i % 2 === 0) {
          // Vibration
          await this.impact('medium');
        }
        // Wait time
        await new Promise(resolve => setTimeout(resolve, pattern[i]));
      }
    } catch (error) {
      console.error('Vibration pattern failed:', error);
    }
  }

  // Wellness-specific haptic feedback
  async wellnessCheckIn(): Promise<void> {
    // Gentle feedback for wellness check-ins
    await this.selection();
    await new Promise(resolve => setTimeout(resolve, 100));
    await this.impact('light');
  }

  async couplesChallengeComplete(): Promise<void> {
    // Celebratory haptic for completing challenges
    await this.impact('medium');
    await new Promise(resolve => setTimeout(resolve, 200));
    await this.notification('success');
  }

  async aiResponseReady(): Promise<void> {
    // Subtle haptic for AI responses
    await this.selection();
  }

  async heartRateSync(): Promise<void> {
    // Rhythmic haptic for health data sync
    await this.impact('light');
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.impact('light');
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.impact('light');
  }

  async meditationBreath(): Promise<void> {
    // Gentle breathing haptic pattern
    await this.impact('light');
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4 seconds inhale
    await this.impact('light');
    await new Promise(resolve => setTimeout(resolve, 4000)); // 4 seconds exhale
  }

  async errorOccured(): Promise<void> {
    // Error feedback
    await this.notification('error');
  }

  async achievementUnlocked(): Promise<void> {
    // Achievement celebration
    await this.impact('heavy');
    await new Promise(resolve => setTimeout(resolve, 150));
    await this.impact('medium');
    await new Promise(resolve => setTimeout(resolve, 150));
    await this.notification('success');
  }

  async buttonPress(): Promise<void> {
    // Standard button press feedback
    await this.selection();
  }

  async navigationTransition(): Promise<void> {
    // Navigation feedback
    await this.impact('light');
  }

  async longPressComplete(): Promise<void> {
    // Long press completion
    await this.notification('success');
  }

  async swipeComplete(): Promise<void> {
    // Swipe gesture completion
    await this.selection();
  }

  async enableHaptics(): Promise<void> {
    // Enable haptic feedback preference
    try {
      localStorage.setItem('haptics-enabled', 'true');
      await this.impact('medium'); // Confirmation
    } catch (error) {
      console.error('Failed to enable haptics:', error);
    }
  }

  async disableHaptics(): Promise<void> {
    // Disable haptic feedback preference
    try {
      localStorage.setItem('haptics-enabled', 'false');
      await this.selection(); // Light confirmation
    } catch (error) {
      console.error('Failed to disable haptics:', error);
    }
  }

  isHapticsEnabled(): boolean {
    try {
      return localStorage.getItem('haptics-enabled') !== 'false';
    } catch {
      return true; // Default to enabled
    }
  }
}

export default IOSHapticsService;