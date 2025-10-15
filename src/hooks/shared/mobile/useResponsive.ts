import { useState, useEffect } from 'react';
import { MobileUtils } from '@/utils/features/mobile/MobileUtils';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveState {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Hook for handling responsive design and device detection
 * Provides real-time updates on breakpoint changes and device capabilities
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => ({
    deviceType: MobileUtils.getDeviceType(),
    isMobile: MobileUtils.isMobile(),
    isTablet: MobileUtils.getDeviceType() === 'tablet',
    isDesktop: MobileUtils.getDeviceType() === 'desktop',
    isLandscape: MobileUtils.isLandscape(),
    isPortrait: !MobileUtils.isLandscape(),
    isIOS: MobileUtils.isIOS(),
    isAndroid: MobileUtils.isAndroid(),
    safeAreaInsets: MobileUtils.getSafeAreaInsets(),
  }));

  useEffect(() => {
    const updateResponsiveState = () => {
      setState({
        deviceType: MobileUtils.getDeviceType(),
        isMobile: MobileUtils.isMobile(),
        isTablet: MobileUtils.getDeviceType() === 'tablet',
        isDesktop: MobileUtils.getDeviceType() === 'desktop',
        isLandscape: MobileUtils.isLandscape(),
        isPortrait: !MobileUtils.isLandscape(),
        isIOS: MobileUtils.isIOS(),
        isAndroid: MobileUtils.isAndroid(),
        safeAreaInsets: MobileUtils.getSafeAreaInsets(),
      });
    };

    // Listen to resize and orientation changes
    window.addEventListener('resize', updateResponsiveState);
    window.addEventListener('orientationchange', updateResponsiveState);

    return () => {
      window.removeEventListener('resize', updateResponsiveState);
      window.removeEventListener('orientationchange', updateResponsiveState);
    };
  }, []);

  return state;
}

/**
 * Hook for listening to orientation changes
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(
    MobileUtils.isLandscape() ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const unsubscribe = MobileUtils.onOrientationChange((newOrientation) => {
      setOrientation(newOrientation);
    });

    return unsubscribe;
  }, []);

  return orientation;
}

/**
 * Hook for keyboard visibility (mobile)
 */
export function useKeyboardVisible() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleKeyboardShow = (event: any) => {
      setIsKeyboardOpen(true);
      setKeyboardHeight(event.detail?.height || 0);
    };

    const handleKeyboardHide = () => {
      setIsKeyboardOpen(false);
      setKeyboardHeight(0);
    };

    window.addEventListener('keyboard-show', handleKeyboardShow);
    window.addEventListener('keyboard-hide', handleKeyboardHide);

    return () => {
      window.removeEventListener('keyboard-show', handleKeyboardShow);
      window.removeEventListener('keyboard-hide', handleKeyboardHide);
    };
  }, []);

  return { isKeyboardOpen, keyboardHeight };
}

/**
 * Hook for haptic feedback with type support
 */
export function useHaptic() {
  const trigger = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (MobileUtils.supportsHaptics()) {
      MobileUtils.triggerHaptic(type);
    }
  };

  return { trigger, supportsHaptics: MobileUtils.supportsHaptics() };
}

/**
 * Hook for safe area insets (iOS notch handling)
 */
export function useSafeArea() {
  const [safeAreaInsets, setSafeAreaInsets] = useState(
    MobileUtils.getSafeAreaInsets()
  );

  useEffect(() => {
    const handleResize = () => {
      setSafeAreaInsets(MobileUtils.getSafeAreaInsets());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return safeAreaInsets;
}

/**
 * Hook for dark mode preference
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(MobileUtils.isDarkMode());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isDark;
}

/**
 * Hook for network information
 */
export function useNetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState(() =>
    MobileUtils.getNetworkInfo()
  );

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const handleChange = () => {
      setNetworkInfo(MobileUtils.getNetworkInfo());
    };

    connection.addEventListener('change', handleChange);
    return () => connection.removeEventListener('change', handleChange);
  }, []);

  return {
    ...networkInfo,
    isSlowConnection: networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g',
    isFastConnection: networkInfo?.effectiveType === '4g',
  };
}

/**
 * Hook for breakpoint checking (Tailwind breakpoints)
 */
export function useBreakpoint() {
  const responsive = useResponsive();

  return {
    // Tailwind breakpoints
    isSm: true, // Always true (base is sm)
    isMd: responsive.deviceType === 'tablet' || responsive.deviceType === 'desktop',
    isLg: responsive.deviceType === 'desktop' && window.innerWidth >= 1024,
    isXl: responsive.deviceType === 'desktop' && window.innerWidth >= 1280,
    is2Xl: responsive.deviceType === 'desktop' && window.innerWidth >= 1536,
    
    // Custom checks
    isSmallPhone: responsive.isMobile && window.innerWidth < 375,
    isLargePhone: responsive.isMobile && window.innerWidth >= 375,
    isSmallTablet: responsive.isTablet && window.innerWidth < 900,
    isLargeTablet: responsive.isTablet && window.innerWidth >= 900,
  };
}

/**
 * Hook for scroll position and direction
 */
export function useScrollDirection() {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);
          setDirection(currentScrollY > lastScrollY ? 'down' : 'up');
          setIsScrolling(currentScrollY > 10);
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollY, direction, isScrolling };
}

/**
 * Hook to detect if element is in viewport
 */
export function useInViewport(ref: React.RefObject<HTMLElement>) {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(entry.isIntersecting);
    }, { threshold: 0.1 });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return isInViewport;
}

/**
 * Hook for touch events
 */
export function useTouchEvents(ref: React.RefObject<HTMLElement>) {
  const [isTouching, setIsTouching] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const handleTouchStart = (e: TouchEvent) => {
      setIsTouching(true);
      const touch = e.touches[0];
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = () => {
      setIsTouching(false);
    };

    const element = ref.current;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref]);

  return { isTouching, touchPosition };
}
