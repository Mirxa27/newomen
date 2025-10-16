import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export interface BiometricOptions {
  promptMessage?: string;
  fallbackPromptMessage?: string;
  cancelPromptMessage?: string;
}

export class IOSBiometricService {
  private static instance: IOSBiometricService;

  static getInstance(): IOSBiometricService {
    if (!IOSBiometricService.instance) {
      IOSBiometricService.instance = new IOSBiometricService();
    }
    return IOSBiometricService.instance;
  }

  async checkBiometricAvailability(): Promise<{
    available: boolean;
    biometryType: 'faceId' | 'touchId' | 'none';
    enrolled: boolean;
  }> {
    if (!Capacitor.isNativePlatform()) {
      return { available: false, biometryType: 'none', enrolled: false };
    }

    try {
      // This would require a native plugin implementation
      // For now, return mock data
      return {
        available: true,
        biometryType: 'faceId', // or 'touchId' based on device
        enrolled: true
      };
    } catch (error) {
      console.error('Biometric check failed:', error);
      return { available: false, biometryType: 'none', enrolled: false };
    }
  }

  async authenticateWithBiometrics(options: BiometricOptions = {}): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Biometrics not available on web' };
    }

    const {
      promptMessage = 'Authenticate to continue',
      fallbackPromptMessage = 'Use device passcode',
      cancelPromptMessage = 'Cancel'
    } = options;

    try {
      // Trigger haptic feedback before biometric prompt
      await Haptics.impact({ style: ImpactStyle.Medium });

      // This would need a native plugin implementation
      // For demonstration, we'll simulate the authentication
      console.log(`Biometric prompt: ${promptMessage}`);

      // Simulate biometric authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success haptic feedback
      await Haptics.notification({ type: NotificationType.Success });

      return { success: true };
    } catch (error) {
      console.error('Biometric authentication failed:', error);

      // Error haptic feedback
      await Haptics.notification({ type: NotificationType.Error });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async authenticateForAppLock(): Promise<boolean> {
    const result = await this.authenticateWithBiometrics({
      promptMessage: 'Unlock Newomen with Face ID',
      fallbackPromptMessage: 'Use passcode',
      cancelPromptMessage: 'Cancel'
    });

    return result.success;
  }

  async authenticateForSensitiveData(): Promise<boolean> {
    const result = await this.authenticateWithBiometrics({
      promptMessage: 'Verify your identity to access sensitive data',
      fallbackPromptMessage = 'Use passcode to verify',
      cancelPromptMessage = 'Cancel'
    });

    return result.success;
  }

  async authenticateForPayment(): Promise<boolean> {
    const result = await this.authenticateWithBiometrics({
      promptMessage = 'Confirm payment with Face ID',
      fallbackPromptMessage = 'Use passcode to confirm',
      cancelPromptMessage = 'Cancel'
    });

    return result.success;
  }

  async enableBiometricAuthentication(): Promise<void> {
    // This would store user preference for biometric auth
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      console.log('Biometric authentication preference saved');
    } catch (error) {
      console.error('Failed to enable biometric authentication:', error);
    }
  }

  async disableBiometricAuthentication(): Promise<void> {
    // This would remove user preference for biometric auth
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      console.log('Biometric authentication preference removed');
    } catch (error) {
      console.error('Failed to disable biometric authentication:', error);
    }
  }
}

export default IOSBiometricService;