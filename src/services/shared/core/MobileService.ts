// Comprehensive mobile service for Newomen platform
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SplashScreen } from '@capacitor/splash-screen';

export interface MobileConfig {
  enableHaptics: boolean;
  enableNotifications: boolean;
  statusBarStyle: 'light' | 'dark';
  keyboardResize: 'body' | 'ionic' | 'native' | 'none';
  splashScreenTimeout: number;
}

export interface DeviceInfo {
  platform: string;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'pan';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  velocity?: number;
  duration?: number;
}

export class MobileService {
  private static instance: MobileService;
  private config: MobileConfig;
  private deviceInfo: DeviceInfo | null = null;
  private gestureHandlers: Map<string, (gesture: TouchGesture) => void> = new Map();

  private constructor() {
    this.config = {
      enableHaptics: true,
      enableNotifications: true,
      statusBarStyle: 'dark',
      keyboardResize: 'body',
      splashScreenTimeout: 3000,
    };
  }

  public static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService();
    }
    return MobileService.instance;
  }

  // Initialize mobile service
  public async initialize(): Promise<void> {
    try {
      this.deviceInfo = await this.getDeviceInfo();
      await this.configureStatusBar();
      await this.configureKeyboard();
      await this.setupGestureHandlers();
      await this.requestPermissions();
      
      console.log('✅ Mobile service initialized', this.deviceInfo);
    } catch (error) {
      console.error('❌ Mobile service initialization failed:', error);
    }
  }

  // Get device information
  private async getDeviceInfo(): Promise<DeviceInfo> {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    
    return {
      platform,
      isNative,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    };
  }

  // Configure status bar
  private async configureStatusBar(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    try {
      await StatusBar.setStyle({ 
        style: this.config.statusBarStyle === 'light' ? Style.Light : Style.Dark 
      });
      await StatusBar.setBackgroundColor({ color: '#1a1428' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (error) {
      console.error('Status bar configuration failed:', error);
    }
  }

  // Configure keyboard
  private async configureKeyboard(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    try {
      const resizeMode = this.getKeyboardResizeMode();
      await Keyboard.setResizeMode({ mode: resizeMode });
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      await Keyboard.setScroll({ isDisabled: false });
    } catch (error) {
      console.error('Keyboard configuration failed:', error);
    }
  }

  // Get keyboard resize mode
  private getKeyboardResizeMode(): KeyboardResize {
    switch (this.config.keyboardResize) {
      case 'body': return KeyboardResize.Body;
      case 'ionic': return KeyboardResize.Ionic;
      case 'native': return KeyboardResize.Native;
      case 'none': return KeyboardResize.None;
      default: return KeyboardResize.Body;
    }
  }

  // Setup gesture handlers
  private async setupGestureHandlers(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    // Add touch event listeners for gesture recognition
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  // Touch gesture handling
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchCurrentX = 0;
  private touchCurrentY = 0;

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchCurrentX = touch.clientX;
    this.touchCurrentY = touch.clientY;
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    this.touchCurrentX = touch.clientX;
    this.touchCurrentY = touch.clientY;
  }

  private handleTouchEnd(event: TouchEvent): void {
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / touchDuration;

    // Determine gesture type
    let gesture: TouchGesture;
    
    if (distance < 10) {
      gesture = { type: 'tap', duration: touchDuration };
    } else if (distance > 50) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      gesture = { 
        type: 'swipe', 
        direction, 
        distance, 
        velocity, 
        duration: touchDuration 
      };
    } else {
      return; // Ignore small movements
    }

    // Trigger haptic feedback
    if (this.config.enableHaptics) {
      this.triggerHaptic('light');
    }

    // Call gesture handlers
    this.gestureHandlers.forEach(handler => handler(gesture));
  }

  // Get swipe direction
  private getSwipeDirection(deltaX: number, deltaY: number): 'up' | 'down' | 'left' | 'right' {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  // Request permissions
  private async requestPermissions(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    try {
      if (this.config.enableNotifications) {
        await LocalNotifications.requestPermissions();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  // Haptic feedback
  public async triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this.config.enableHaptics || !this.deviceInfo?.isNative) return;

    try {
      const style = type === 'light' ? ImpactStyle.Light : 
                   type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  // Show notification
  public async showNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    if (!this.config.enableNotifications || !this.deviceInfo?.isNative) return;

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: data,
        }]
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  // Hide splash screen
  public async hideSplashScreen(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('Splash screen hide failed:', error);
    }
  }

  // Show/hide keyboard
  public async showKeyboard(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    try {
      await Keyboard.show();
    } catch (error) {
      console.error('Show keyboard failed:', error);
    }
  }

  public async hideKeyboard(): Promise<void> {
    if (!this.deviceInfo?.isNative) return;

    try {
      await Keyboard.hide();
    } catch (error) {
      console.error('Hide keyboard failed:', error);
    }
  }

  // Register gesture handler
  public onGesture(gestureType: string, handler: (gesture: TouchGesture) => void): void {
    this.gestureHandlers.set(gestureType, handler);
  }

  // Remove gesture handler
  public offGesture(gestureType: string): void {
    this.gestureHandlers.delete(gestureType);
  }

  // Update configuration
  public updateConfig(newConfig: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  public getConfig(): MobileConfig {
    return { ...this.config };
  }

  // Get device info
  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  // Check if feature is supported
  public isFeatureSupported(feature: 'haptics' | 'notifications' | 'keyboard' | 'statusbar'): boolean {
    if (!this.deviceInfo?.isNative) return false;

    switch (feature) {
      case 'haptics':
        return this.deviceInfo.isIOS || this.deviceInfo.isAndroid;
      case 'notifications':
        return this.deviceInfo.isIOS || this.deviceInfo.isAndroid;
      case 'keyboard':
        return this.deviceInfo.isIOS || this.deviceInfo.isAndroid;
      case 'statusbar':
        return this.deviceInfo.isIOS || this.deviceInfo.isAndroid;
      default:
        return false;
    }
  }

  // Handle orientation change
  public onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): void {
    window.addEventListener('orientationchange', () => {
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      callback(orientation);
    });
  }

  // Handle app state changes
  public onAppStateChange(callback: (state: 'active' | 'background' | 'inactive') => void): void {
    document.addEventListener('visibilitychange', () => {
      const state = document.hidden ? 'background' : 'active';
      callback(state);
    });
  }

  // Cleanup
  public cleanup(): void {
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    this.gestureHandlers.clear();
  }
}

// Export singleton instance
export const mobileService = MobileService.getInstance();
