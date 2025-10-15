import { useState, useEffect, useCallback } from 'react';
import { mobileOptimization } from '@/services/MobileOptimizationService';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isKeyboardOpen: boolean;
  prefersReducedMotion: boolean;
}

export interface ResponsiveConfig<T> {
  mobile: T;
  tablet?: T;
  desktop?: T;
}

export function useMobileOptimization() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenWidth: 1024,
        screenHeight: 768,
        orientation: 'landscape',
        isKeyboardOpen: false,
        prefersReducedMotion: false
      };
    }

    return {
      isMobile: mobileOptimization.isMobile(),
      isTablet: mobileOptimization.isTablet(),
      isDesktop: mobileOptimization.isDesktop(),
      isTouchDevice: mobileOptimization.isTouchDevice(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isKeyboardOpen: false,
      prefersReducedMotion: mobileOptimization.prefersReducedMotion()
    };
  });

  const updateDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const newDeviceInfo: DeviceInfo = {
      isMobile: mobileOptimization.isMobile(),
      isTablet: mobileOptimization.isTablet(),
      isDesktop: mobileOptimization.isDesktop(),
      isTouchDevice: mobileOptimization.isTouchDevice(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      isKeyboardOpen: document.body.classList.contains('keyboard-open'),
      prefersReducedMotion: mobileOptimization.prefersReducedMotion()
    };

    setDeviceInfo(newDeviceInfo);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update on resize
    window.addEventListener('resize', updateDeviceInfo);
    
    // Update on orientation change
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    // Update on keyboard open/close
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateDeviceInfo();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
      observer.disconnect();
    };
  }, [updateDeviceInfo]);

  // Helper function to get responsive value based on current device
  const getResponsiveValue = useCallback(<T>(config: ResponsiveConfig<T>): T => {
    if (deviceInfo.isMobile) {
      return config.mobile;
    }
    if (deviceInfo.isTablet && config.tablet !== undefined) {
      return config.tablet;
    }
    if (deviceInfo.isDesktop && config.desktop !== undefined) {
      return config.desktop;
    }
    
    // Fallback logic
    return config.tablet || config.desktop || config.mobile;
  }, [deviceInfo]);

  // Helper function to get responsive classes
  const getResponsiveClasses = useCallback((config: ResponsiveConfig<string>): string => {
    return mobileOptimization.getResponsiveClasses({
      base: config.mobile,
      tablet: config.tablet,
      desktop: config.desktop
    });
  }, []);

  // Helper function to get container classes
  const getContainerClasses = useCallback((type?: 'page' | 'card' | 'modal' | 'form'): string => {
    return mobileOptimization.getContainerClasses(type);
  }, []);

  // Helper function to get touch-optimized classes
  const getTouchOptimizedClasses = useCallback((): string => {
    return deviceInfo.isTouchDevice ? mobileOptimization.getTouchOptimizedClasses() : '';
  }, [deviceInfo.isTouchDevice]);

  // Helper function for conditional rendering based on device
  const renderForDevice = useCallback(<T>(config: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
  }): T | null => {
    if (deviceInfo.isMobile && config.mobile !== undefined) {
      return config.mobile;
    }
    if (deviceInfo.isTablet && config.tablet !== undefined) {
      return config.tablet;
    }
    if (deviceInfo.isDesktop && config.desktop !== undefined) {
      return config.desktop;
    }
    return null;
  }, [deviceInfo]);

  // Mobile-specific layout helpers
  const getMobileLayoutClasses = useCallback(() => {
    if (!deviceInfo.isMobile) return '';
    
    return [
      mobileOptimization.getSafeAreaClasses(),
      mobileOptimization.getMobileScrollClasses(),
      deviceInfo.isKeyboardOpen ? mobileOptimization.getKeyboardSafeClasses() : ''
    ].filter(Boolean).join(' ');
  }, [deviceInfo.isMobile, deviceInfo.isKeyboardOpen]);

  // Performance optimization classes
  const getPerformanceClasses = useCallback(() => {
    if (!deviceInfo.isMobile) return '';
    return mobileOptimization.getMobilePerformanceClasses();
  }, [deviceInfo.isMobile]);

  // Animation classes with reduced motion support
  const getAnimationClasses = useCallback((type?: 'slide' | 'fade' | 'scale') => {
    if (deviceInfo.prefersReducedMotion) {
      return 'transition-none'; // Disable animations for reduced motion
    }
    return mobileOptimization.getMobileAnimationClasses(type);
  }, [deviceInfo.prefersReducedMotion]);

  // Grid classes for responsive layouts
  const getGridClasses = useCallback((columns: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  }) => {
    return mobileOptimization.getGridClasses(columns);
  }, []);

  // Text size classes for responsive typography
  const getTextClasses = useCallback((sizes: {
    mobile: string;
    tablet?: string;
    desktop?: string;
  }) => {
    return mobileOptimization.getTextClasses(sizes);
  }, []);

  // Focus classes for accessibility
  const getFocusClasses = useCallback(() => {
    return mobileOptimization.getFocusClasses();
  }, []);

  return {
    // Device information
    deviceInfo,
    
    // Convenience getters
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    isTouchDevice: deviceInfo.isTouchDevice,
    isKeyboardOpen: deviceInfo.isKeyboardOpen,
    orientation: deviceInfo.orientation,
    screenWidth: deviceInfo.screenWidth,
    screenHeight: deviceInfo.screenHeight,
    
    // Helper functions
    getResponsiveValue,
    getResponsiveClasses,
    getContainerClasses,
    getTouchOptimizedClasses,
    renderForDevice,
    getMobileLayoutClasses,
    getPerformanceClasses,
    getAnimationClasses,
    getGridClasses,
    getTextClasses,
    getFocusClasses,
    
    // Service instance for advanced usage
    mobileOptimization
  };
}

// Hook for responsive design patterns
export function useResponsiveLayout() {
  const { deviceInfo, getContainerClasses, getGridClasses, getTextClasses } = useMobileOptimization();

  // Common responsive patterns
  const layouts = {
    // Sidebar layout that collapses to mobile
    sidebar: {
      container: deviceInfo.isMobile 
        ? 'flex flex-col min-h-screen' 
        : 'flex min-h-screen',
      sidebar: deviceInfo.isMobile 
        ? 'hidden' // Hidden on mobile, shown via overlay/drawer
        : 'w-64 bg-gray-50 border-r flex-shrink-0',
      main: deviceInfo.isMobile 
        ? 'flex-1 p-4' 
        : 'flex-1 p-6',
      content: getContainerClasses('page')
    },

    // Card grid layout
    cardGrid: {
      container: getContainerClasses('page'),
      grid: getGridClasses({
        mobile: 1,
        tablet: 2,
        desktop: 3
      }),
      card: 'bg-white rounded-lg shadow-sm border p-4'
    },

    // Form layout
    form: {
      container: getContainerClasses('form'),
      fieldset: 'space-y-4',
      field: 'space-y-2',
      input: deviceInfo.isMobile 
        ? 'w-full px-4 py-3 text-base' // Larger on mobile
        : 'w-full px-3 py-2 text-sm',
      button: deviceInfo.isMobile 
        ? 'w-full py-3 text-base font-medium' // Full width on mobile
        : 'px-4 py-2 text-sm'
    },

    // Navigation layout
    navigation: {
      header: deviceInfo.isMobile 
        ? 'h-16 px-4 flex items-center justify-between' 
        : 'h-20 px-6 flex items-center justify-between',
      nav: deviceInfo.isMobile 
        ? 'fixed bottom-0 left-0 right-0 bg-white border-t z-50' 
        : 'flex space-x-8',
      navItem: deviceInfo.isMobile 
        ? 'flex-1 py-2 text-center text-sm' 
        : 'px-3 py-2 text-sm font-medium'
    }
  };

  return {
    deviceInfo,
    layouts,
    getContainerClasses,
    getGridClasses,
    getTextClasses
  };
}

// Hook for touch interactions
export function useTouchInteractions() {
  const { deviceInfo, getTouchOptimizedClasses } = useMobileOptimization();
  const [touchState, setTouchState] = useState({
    isPressed: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!deviceInfo.isTouchDevice) return;
    
    const touch = event.touches[0];
    setTouchState({
      isPressed: true,
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY }
    });
  }, [deviceInfo.isTouchDevice]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!deviceInfo.isTouchDevice || !touchState.isPressed) return;
    
    const touch = event.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentPosition: { x: touch.clientX, y: touch.clientY }
    }));
  }, [deviceInfo.isTouchDevice, touchState.isPressed]);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      isPressed: false
    }));
  }, []);

  // Calculate swipe direction and distance
  const getSwipeData = useCallback(() => {
    const deltaX = touchState.currentPosition.x - touchState.startPosition.x;
    const deltaY = touchState.currentPosition.y - touchState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    
    if (distance > 50) { // Minimum swipe distance
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }
    
    return { direction, distance, deltaX, deltaY };
  }, [touchState]);

  return {
    touchState,
    isTouchDevice: deviceInfo.isTouchDevice,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    getSwipeData,
    getTouchOptimizedClasses
  };
}
