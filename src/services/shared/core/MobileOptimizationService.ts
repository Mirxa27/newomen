/**
 * Mobile Optimization Service
 * Provides mobile-first responsive design utilities and touch optimizations
 */

export class MobileOptimizationService {
  private static instance: MobileOptimizationService;

  static getInstance(): MobileOptimizationService {
    if (!this.instance) {
      this.instance = new MobileOptimizationService();
    }
    return this.instance;
  }

  // Responsive breakpoints (mobile-first approach)
  readonly breakpoints = {
    xs: '0px',     // Extra small devices (portrait phones)
    sm: '640px',   // Small devices (landscape phones)
    md: '768px',   // Medium devices (tablets)
    lg: '1024px',  // Large devices (laptops)
    xl: '1280px',  // Extra large devices (desktops)
    '2xl': '1536px' // 2X Extra large devices (large desktops)
  } as const;

  // Touch-friendly dimensions
  readonly touchTargets = {
    minimum: '44px',    // iOS minimum touch target
    optimal: '48px',    // Material Design optimal
    comfortable: '56px' // Extra comfortable for accessibility
  } as const;

  // Mobile-optimized spacing
  readonly mobileSpacing = {
    xs: '0.125rem',  // 2px
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem'    // 48px
  } as const;

  // Device detection utilities
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < parseInt(this.breakpoints.md);
  }

  isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= parseInt(this.breakpoints.md) && width < parseInt(this.breakpoints.lg);
  }

  isDesktop(): boolean {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= parseInt(this.breakpoints.lg);
  }

  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Get responsive classes for components
  getResponsiveClasses(config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    base?: string;
  }): string {
    const { base = '', mobile = '', tablet = '', desktop = '' } = config;
    
    return [
      base,
      mobile,
      tablet ? `md:${tablet}` : '',
      desktop ? `lg:${desktop}` : ''
    ].filter(Boolean).join(' ');
  }

  // Generate grid classes for responsive layouts
  getGridClasses(columns: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  }): string {
    const { mobile, tablet, desktop } = columns;
    
    return [
      `grid-cols-${mobile}`,
      tablet ? `md:grid-cols-${tablet}` : '',
      desktop ? `lg:grid-cols-${desktop}` : ''
    ].filter(Boolean).join(' ');
  }

  // Generate spacing classes for responsive padding/margin
  getSpacingClasses(type: 'p' | 'm', spacing: {
    mobile: keyof typeof this.mobileSpacing;
    tablet?: keyof typeof this.mobileSpacing;
    desktop?: keyof typeof this.mobileSpacing;
  }): string {
    const { mobile, tablet, desktop } = spacing;
    
    return [
      `${type}-${mobile}`,
      tablet ? `md:${type}-${tablet}` : '',
      desktop ? `lg:${type}-${desktop}` : ''
    ].filter(Boolean).join(' ');
  }

  // Get text size classes for responsive typography
  getTextClasses(sizes: {
    mobile: string;
    tablet?: string;
    desktop?: string;
  }): string {
    const { mobile, tablet, desktop } = sizes;
    
    return [
      mobile,
      tablet ? `md:${tablet}` : '',
      desktop ? `lg:${desktop}` : ''
    ].filter(Boolean).join(' ');
  }

  // Touch optimization utilities
  getTouchOptimizedClasses(): string {
    return [
      `min-h-[${this.touchTargets.optimal}]`,
      `min-w-[${this.touchTargets.optimal}]`,
      'touch-manipulation', // Optimize touch interactions
      'select-none',        // Prevent text selection on touch
      'tap-highlight-transparent' // Remove tap highlights
    ].join(' ');
  }

  // Get container classes for different content types
  getContainerClasses(type: 'page' | 'card' | 'modal' | 'form' = 'page'): string {
    const baseClasses = 'w-full mx-auto';
    
    switch (type) {
      case 'page':
        return `${baseClasses} px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl`;
      case 'card':
        return `${baseClasses} px-4 sm:px-6 max-w-2xl`;
      case 'modal':
        return `${baseClasses} px-4 sm:px-6 md:px-8 max-w-lg`;
      case 'form':
        return `${baseClasses} px-4 sm:px-6 max-w-md`;
      default:
        return baseClasses;
    }
  }

  // Safe area utilities for mobile devices
  getSafeAreaClasses(): string {
    return [
      'pt-safe-area-inset-top',    // Top safe area (notch)
      'pb-safe-area-inset-bottom', // Bottom safe area (home indicator)
      'pl-safe-area-inset-left',   // Left safe area
      'pr-safe-area-inset-right'   // Right safe area
    ].join(' ');
  }

  // Keyboard-safe utilities for mobile forms
  getKeyboardSafeClasses(): string {
    return [
      'pb-keyboard-height', // Adjust for virtual keyboard
      'transition-all duration-300 ease-in-out' // Smooth transitions
    ].join(' ');
  }

  // Performance optimization for mobile
  getMobilePerformanceClasses(): string {
    return [
      'will-change-transform',     // Optimize for animations
      'transform-gpu',             // Use GPU acceleration
      'backface-visibility-hidden' // Prevent flickering
    ].join(' ');
  }

  // Scroll optimization for mobile
  getMobileScrollClasses(): string {
    return [
      'overscroll-behavior-contain', // Prevent overscroll
      'scroll-smooth',               // Smooth scrolling
      '-webkit-overflow-scrolling-touch' // iOS momentum scrolling
    ].join(' ');
  }

  // Focus management for accessibility
  getFocusClasses(): string {
    return [
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary',
      'focus:ring-offset-2',
      'focus-visible:ring-2' // Only show focus ring for keyboard navigation
    ].join(' ');
  }

  // Animation classes optimized for mobile
  getMobileAnimationClasses(type: 'slide' | 'fade' | 'scale' = 'fade'): string {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    switch (type) {
      case 'slide':
        return `${baseClasses} transform translate-x-full data-[state=open]:translate-x-0`;
      case 'scale':
        return `${baseClasses} transform scale-95 data-[state=open]:scale-100`;
      case 'fade':
      default:
        return `${baseClasses} opacity-0 data-[state=open]:opacity-100`;
    }
  }

  // Utility to check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Generate CSS variables for dynamic theming
  getCSSVariables(): Record<string, string> {
    return {
      '--mobile-header-height': '64px',
      '--mobile-footer-height': '80px',
      '--mobile-fab-size': '56px',
      '--touch-target-min': this.touchTargets.minimum,
      '--touch-target-optimal': this.touchTargets.optimal,
      '--safe-area-inset-top': 'env(safe-area-inset-top)',
      '--safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
      '--safe-area-inset-left': 'env(safe-area-inset-left)',
      '--safe-area-inset-right': 'env(safe-area-inset-right)',
      '--keyboard-height': '0px'
    };
  }

  // Initialize mobile optimizations
  initialize(): void {
    if (typeof window === 'undefined') return;

    // Add CSS variables to root
    const root = document.documentElement;
    const variables = this.getCSSVariables();
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Add mobile class to body for CSS targeting
    if (this.isMobile()) {
      document.body.classList.add('is-mobile');
    }

    if (this.isTouchDevice()) {
      document.body.classList.add('is-touch');
    }

    // Listen for orientation changes
    if ('orientation' in window) {
      window.addEventListener('orientationchange', () => {
        // Force reflow after orientation change
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      });
    }

    // Handle virtual keyboard on mobile
    this.setupKeyboardHandling();

    console.log('Mobile optimization service initialized');
  }

  private setupKeyboardHandling(): void {
    if (!this.isMobile()) return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight - currentHeight;
      const isKeyboardOpen = heightDifference > 150; // Threshold for keyboard detection
      
      document.documentElement.style.setProperty(
        '--keyboard-height', 
        isKeyboardOpen ? `${heightDifference}px` : '0px'
      );
      
      document.body.classList.toggle('keyboard-open', isKeyboardOpen);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
  }
}

// Export singleton instance
export const mobileOptimization = MobileOptimizationService.getInstance();

// Initialize immediately
if (typeof window !== 'undefined') {
  mobileOptimization.initialize();
}
