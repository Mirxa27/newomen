// Capacitor utilities for enhanced mobile experience

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class CapacitorUtils {
  // Initialize Capacitor plugins
  static async initialize() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1a1428' });
        
        // Configure keyboard
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
        
        // Hide splash screen when app is ready
        await this.hideSplashScreen();
        
        console.log('✅ Capacitor plugins initialized');
      } catch (error) {
        console.error('❌ Error initializing Capacitor plugins:', error);
      }
    }
  }

  // Hide splash screen properly
  static async hideSplashScreen() {
    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.hide();
        console.log('✅ Splash screen hidden');
      } catch (error) {
        console.error('❌ Error hiding splash screen:', error);
      }
    }
  }

  // Trigger haptic feedback
  static async triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (Capacitor.isNativePlatform()) {
      try {
        const style = type === 'light' ? ImpactStyle.Light : 
                     type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
        await Haptics.impact({ style });
      } catch (error) {
        console.error('❌ Error triggering haptic:', error);
      }
    }
  }

  // Check if running on native platform
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Get platform name
  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Check if running on iOS
  static isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  // Check if running on Android
  static isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  // Configure keyboard for mobile
  static async configureKeyboard() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
        await Keyboard.setScroll({ isDisabled: false });
      } catch (error) {
        console.error('❌ Error configuring keyboard:', error);
      }
    }
  }

  // Show/hide keyboard
  static async showKeyboard() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.show();
      } catch (error) {
        console.error('❌ Error showing keyboard:', error);
      }
    }
  }

  static async hideKeyboard() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide();
      } catch (error) {
        console.error('❌ Error hiding keyboard:', error);
      }
    }
  }

  // Configure status bar
  static async configureStatusBar() {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1a1428' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (error) {
        console.error('❌ Error configuring status bar:', error);
      }
    }
  }

  // Add keyboard event listeners with custom event dispatching
  static addKeyboardListeners() {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('🎹 Keyboard will show with height:', info.keyboardHeight);
        // Dispatch custom event for React components
        window.dispatchEvent(new CustomEvent('keyboard-show', { 
          detail: { height: info.keyboardHeight } 
        }));
        // Add keyboard-open class to body for CSS targeting
        document.body.classList.add('keyboard-open');
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      Keyboard.addListener('keyboardDidShow', (info) => {
        console.log('🎹 Keyboard fully visible with height:', info.keyboardHeight);
        window.dispatchEvent(new CustomEvent('keyboard-did-show', { 
          detail: { height: info.keyboardHeight } 
        }));
      });

      Keyboard.addListener('keyboardWillHide', () => {
        console.log('🎹 Keyboard will hide');
        // Dispatch custom event for React components
        window.dispatchEvent(new CustomEvent('keyboard-hide'));
        // Remove keyboard-open class from body
        document.body.classList.remove('keyboard-open');
        document.body.style.setProperty('--keyboard-height', '0px');
      });

      Keyboard.addListener('keyboardDidHide', () => {
        console.log('🎹 Keyboard fully hidden');
        window.dispatchEvent(new CustomEvent('keyboard-did-hide'));
      });
    }
  }

  // Remove keyboard event listeners
  static removeKeyboardListeners() {
    if (Capacitor.isNativePlatform()) {
      Keyboard.removeAllListeners();
      document.body.classList.remove('keyboard-open');
      document.body.style.removeProperty('--keyboard-height');
    }
  }
}
