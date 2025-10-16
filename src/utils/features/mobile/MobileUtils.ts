// Mobile-specific utilities for enhanced mobile experience

export class MobileUtils {
  // Detect if device is mobile
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Detect if device is iOS
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Detect if device is Android
  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // Get device type for responsive design
  static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Check if device supports haptic feedback
  static supportsHaptics(): boolean {
    return 'vibrate' in navigator;
  }

  // Trigger haptic feedback
  static triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (this.supportsHaptics()) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type]);
    }
  }

  // Check if device is in landscape mode
  static isLandscape(): boolean {
    return window.innerWidth > window.innerHeight;
  }

  // Get safe area insets (for iOS devices with notch)
  static getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
    };
  }

  // Prevent zoom on input focus (iOS)
  static preventZoomOnFocus(): void {
    if (this.isIOS()) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.getAttribute('content');
        
        const handleFocusIn = () => {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        };
        
        const handleFocusOut = () => {
          viewport.setAttribute('content', originalContent || 'width=device-width, initial-scale=1.0');
        };
        
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
      }
    }
  }

  // Add touch-friendly classes to elements
  static addTouchClasses(element: HTMLElement): void {
    element.classList.add('touch-optimized', 'touch-target');
  }

  // Check if device supports WebRTC
  static supportsWebRTC(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Check if device supports WebSocket
  static supportsWebSocket(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  // Get device pixel ratio
  static getPixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  // Check if device is in dark mode
  static isDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Listen for orientation changes
  static onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
    const handleOrientationChange = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      callback(orientation);
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }

  // Optimize images for mobile
  static optimizeImageForMobile(src: string, width?: number, quality: number = 0.8): string {
    if (this.isMobile() && width) {
      // Add query parameters for image optimization
      const url = new URL(src);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('f', 'auto'); // Auto format
      return url.toString();
    }
    return src;
  }

  // Check if device is low-end (for performance optimization)
  static isLowEndDevice(): boolean {
    const connection = (navigator as { connection?: { effectiveType: string } }).connection;
    if (connection) {
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
    return false;
  }

  // Get network information
  static getNetworkInfo(): {
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null {
    const connection = (navigator as { connection?: { effectiveType: string; downlink: number; rtt: number } }).connection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }
    return null;
  }

  // Add mobile-specific meta tags
  static addMobileMetaTags(): void {
    const head = document.head;
    
    // Viewport meta tag
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      head.appendChild(viewport);
    }

    // Theme color
    if (!document.querySelector('meta[name="theme-color"]')) {
      const themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#9b87f5';
      head.appendChild(themeColor);
    }

    // Apple mobile web app
    if (this.isIOS()) {
      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const appleCapable = document.createElement('meta');
        appleCapable.name = 'apple-mobile-web-app-capable';
        appleCapable.content = 'yes';
        head.appendChild(appleCapable);
      }

      if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
        const appleStatusBar = document.createElement('meta');
        appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
        appleStatusBar.content = 'black-translucent';
        head.appendChild(appleStatusBar);
      }
    }
  }

  // Initialize mobile optimizations
  static initialize(): void {
    this.addMobileMetaTags();
    this.preventZoomOnFocus();
    
    // Add mobile class to body
    if (this.isMobile()) {
      document.body.classList.add('mobile-device');
    }
    
    // Add device-specific classes
    document.body.classList.add(`device-${this.getDeviceType()}`);
    
    if (this.isIOS()) {
      document.body.classList.add('ios-device');
    }
    
    if (this.isAndroid()) {
      document.body.classList.add('android-device');
    }
  }
}
