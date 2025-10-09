/**
 * Mobile Responsiveness System
 * Production-grade responsive design with touch optimization and adaptive layouts
 */

import { z } from 'zod';
import { logger } from '@/lib/logging';

/**
 * Breakpoint Schema
 */
export const BreakpointSchema = z.object({
  xs: z.number().default(320),
  sm: z.number().default(640),
  md: z.number().default(768),
  lg: z.number().default(1024),
  xl: z.number().default(1280),
  '2xl': z.number().default(1536),
});

export type Breakpoints = z.infer<typeof BreakpointSchema>;

/**
 * Responsive Configuration Schema
 */
export const ResponsiveConfigSchema = z.object({
  enabled: z.boolean().default(true),
  breakpoints: BreakpointSchema.default({}),
  features: z.object({
    fluidTypography: z.boolean().default(true),
    responsiveImages: z.boolean().default(true),
    touchOptimization: z.boolean().default(true),
    adaptiveLayout: z.boolean().default(true),
    orientationSupport: z.boolean().default(true),
    safeAreaSupport: z.boolean().default(true),
    gestureSupport: z.boolean().default(true),
    hapticFeedback: z.boolean().default(true),
    viewportOptimization: z.boolean().default(true),
    performanceOptimization: z.boolean().default(true),
  }).default({}),
  performance: z.object({
    lazyLoading: z.boolean().default(true),
    imageOptimization: z.boolean().default(true),
    codeSplitting: z.boolean().default(true),
    caching: z.boolean().default(true),
    compression: z.boolean().default(true),
    minification: z.boolean().default(true),
  }).default({}),
  testing: z.object({
    deviceEmulation: z.boolean().default(true),
    touchSimulation: z.boolean().default(true),
    networkSimulation: z.boolean().default(true),
    performanceTesting: z.boolean().default(true),
  }).default({}),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    realTime: z.boolean().default(true),
    metrics: z.boolean().default(true),
    alerts: z.boolean().default(true),
  }).default({}),
});

export type ResponsiveConfig = z.infer<typeof ResponsiveConfigSchema>;

/**
 * Device Information Schema
 */
export const DeviceInfoSchema = z.object({
  type: z.enum(['mobile', 'tablet', 'desktop', 'tv', 'wearable']),
  orientation: z.enum(['portrait', 'landscape']),
  screenWidth: z.number(),
  screenHeight: z.number(),
  devicePixelRatio: z.number(),
  touchSupport: z.boolean(),
  hapticSupport: z.boolean(),
  connection: z.enum(['slow-2g', '2g', '3g', '4g', 'wifi', 'ethernet', 'unknown']).default('unknown'),
  memory: z.number().optional(),
  cpuCores: z.number().optional(),
  userAgent: z.string(),
  platform: z.string(),
  browser: z.string(),
  version: z.string(),
  timestamp: z.string(),
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

/**
 * Touch Gesture Schema
 */
export const TouchGestureSchema = z.object({
  type: z.enum(['tap', 'doubleTap', 'longPress', 'swipe', 'pinch', 'rotate', 'pan']),
  element: z.string(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
  timestamp: z.string(),
  duration: z.number().optional(),
  velocity: z.number().optional(),
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
});

export type TouchGesture = z.infer<typeof TouchGestureSchema>;

/**
 * Performance Metrics Schema
 */
export const PerformanceMetricsSchema = z.object({
  firstContentfulPaint: z.number(),
  largestContentfulPaint: z.number(),
  firstInputDelay: z.number(),
  cumulativeLayoutShift: z.number(),
  timeToInteractive: z.number(),
  totalBlockingTime: z.number(),
  speedIndex: z.number(),
  deviceInfo: DeviceInfoSchema,
  timestamp: z.string(),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

/**
 * Mobile Responsive Manager
 */
export class MobileResponsiveManager {
  private config: ResponsiveConfig;
  private deviceInfo: DeviceInfo | null = null;
  private performanceMetrics: PerformanceMetrics[] = [];
  private touchGestures: TouchGesture[] = [];
  private observers: Map<string, ResizeObserver | IntersectionObserver> = new Map();
  private mediaQueries: Map<string, MediaQueryList> = new Map();

  constructor(config: Partial<ResponsiveConfig> = {}) {
    this.config = ResponsiveConfigSchema.parse(config);
    this.initializeResponsiveFeatures();
  }

  /**
   * Initialize responsive features
   */
  private initializeResponsiveFeatures(): void {
    if (!this.config.enabled) return;

    if (typeof window !== 'undefined') {
      this.detectDevice();
      this.setupFluidTypography();
      this.setupResponsiveImages();
      this.setupTouchOptimization();
      this.setupAdaptiveLayout();
      this.setupOrientationSupport();
      this.setupSafeAreaSupport();
      this.setupGestureSupport();
      this.setupHapticFeedback();
      this.setupViewportOptimization();
      this.setupPerformanceOptimization();
      this.setupMonitoring();
    }
  }

  /**
   * Detect device information
   */
  private detectDevice(): void {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Tablet|PlayBook|Nook|Kindle|Silk|KFAPWI/i.test(userAgent);
    const isTV = /SmartTV|AppleTV|GoogleTV|HbbTV|NetCast|Web0S|Opera TV|SonyDTV/i.test(userAgent);
    const isWearable = /Watch|Wear|Glass/i.test(userAgent);

    let deviceType: DeviceInfo['type'] = 'desktop';
    if (isTV) deviceType = 'tv';
    else if (isWearable) deviceType = 'wearable';
    else if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    // Detect orientation
    const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

    // Detect touch support
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect haptic support
    const hapticSupport = 'vibrate' in navigator;

    // Detect connection
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || 'unknown';

    this.deviceInfo = {
      type: deviceType,
      orientation,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      touchSupport,
      hapticSupport,
      connection: effectiveType,
      memory: (navigator as any).deviceMemory,
      cpuCores: navigator.hardwareConcurrency,
      userAgent,
      platform,
      browser: this.detectBrowser(userAgent),
      version: this.detectBrowserVersion(userAgent),
      timestamp: new Date().toISOString(),
    };

    logger.info('Device detected', this.deviceInfo);
  }

  /**
   * Detect browser
   */
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Detect browser version
   */
  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Setup fluid typography
   */
  private setupFluidTypography(): void {
    if (!this.config.features.fluidTypography) return;

    const updateFontSize = () => {
      const width = window.innerWidth;
      const minWidth = this.config.breakpoints.sm;
      const maxWidth = this.config.breakpoints.xl;
      const minFontSize = 14;
      const maxFontSize = 18;

      let fontSize: number;
      if (width <= minWidth) {
        fontSize = minFontSize;
      } else if (width >= maxWidth) {
        fontSize = maxFontSize;
      } else {
        fontSize = minFontSize + (maxFontSize - minFontSize) * 
                  ((width - minWidth) / (maxWidth - minWidth));
      }

      document.documentElement.style.fontSize = `${fontSize}px`;
    };

    updateFontSize();
    window.addEventListener('resize', updateFontSize);
  }

  /**
   * Setup responsive images
   */
  private setupResponsiveImages(): void {
    if (!this.config.features.responsiveImages) return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('srcset')) {
        this.generateSrcset(img);
      }
    });

    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => {
        imageObserver.observe(img);
      });

      this.observers.set('imageObserver', imageObserver);
    }
  }

  /**
   * Generate srcset for responsive images
   */
  private generateSrcset(img: HTMLImageElement): void {
    const src = img.getAttribute('src');
    if (!src) return;

    const baseUrl = src.split('.').slice(0, -1).join('.');
    const extension = src.split('.').pop();
    
    const widths = [320, 640, 768, 1024, 1280, 1536];
    const srcset = widths.map(width => 
      `${baseUrl}-${width}w.${extension} ${width}w`
    ).join(', ');

    img.setAttribute('srcset', srcset);
    img.setAttribute('sizes', this.generateSizes());
  }

  /**
   * Generate sizes attribute
   */
  private generateSizes(): string {
    const width = window.innerWidth;
    if (width < this.config.breakpoints.sm) return '100vw';
    if (width < this.config.breakpoints.md) return '90vw';
    if (width < this.config.breakpoints.lg) return '80vw';
    return '70vw';
  }

  /**
   * Load image with optimization
   */
  private loadImage(img: HTMLImageElement): void {
    if (this.config.performance.imageOptimization) {
      // Use WebP if supported
      if (this.supportsWebP()) {
        const src = img.getAttribute('src');
        if (src && !src.includes('.webp')) {
          const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          img.setAttribute('src', webpSrc);
        }
      }
    }

    img.classList.add('loaded');
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Setup touch optimization
   */
  private setupTouchOptimization(): void {
    if (!this.config.features.touchOptimization || !this.deviceInfo?.touchSupport) return;

    // Increase touch targets
    this.increaseTouchTargets();
    
    // Add touch feedback
    this.addTouchFeedback();
    
    // Optimize for thumb reach
    this.optimizeThumbReach();
    
    // Setup touch gestures
    this.setupTouchGestures();
  }

  /**
   * Increase touch targets
   */
  private increaseTouchTargets(): void {
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    const minTouchTarget = 44; // iOS recommendation

    touchTargets.forEach(target => {
      const element = target as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
        element.style.minWidth = `${minTouchTarget}px`;
        element.style.minHeight = `${minTouchTarget}px`;
        element.style.padding = '12px';
      }
    });
  }

  /**
   * Add touch feedback
   */
  private addTouchFeedback(): void {
    const style = document.createElement('style');
    style.textContent = `
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }
      
      .touch-feedback::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.1);
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }
      
      .touch-feedback:active::before {
        width: 100%;
        height: 100%;
      }
    `;
    document.head.appendChild(style);

    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach(element => {
      element.classList.add('touch-feedback');
    });
  }

  /**
   * Optimize for thumb reach
   */
  private optimizeThumbReach(): void {
    if (this.deviceInfo?.type !== 'mobile') return;

    // Add thumb-friendly navigation
    const navigation = document.querySelector('nav, .navigation, [role="navigation"]');
    if (navigation) {
      navigation.classList.add('thumb-friendly');
    }

    // Optimize form layouts
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.classList.add('thumb-optimized');
    });
  }

  /**
   * Setup touch gestures
   */
  private setupTouchGestures(): void {
    let startX: number, startY: number, startTime: number;

    document.addEventListener('touchstart', (event) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (!startX || !startY || !startTime) return;

      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      const gesture: TouchGesture = {
        type: 'tap',
        element: event.target ? (event.target as Element).tagName : 'unknown',
        coordinates: { x: endX, y: endY },
        timestamp: new Date().toISOString(),
        duration: deltaTime,
      };

      // Detect gesture type
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (deltaTime > 500 && absDeltaX < 10 && absDeltaY < 10) {
        gesture.type = 'longPress';
      } else if (absDeltaX > 50 || absDeltaY > 50) {
        gesture.type = 'swipe';
        gesture.direction = absDeltaX > absDeltaY ? 
          (deltaX > 0 ? 'right' : 'left') : 
          (deltaY > 0 ? 'down' : 'up');
        gesture.velocity = Math.sqrt(absDeltaX * absDeltaX + absDeltaY * absDeltaY) / deltaTime;
      }

      this.touchGestures.push(gesture);
      this.handleTouchGesture(gesture);

      // Reset
      startX = startY = startTime = 0;
    }, { passive: true });
  }

  /**
   * Handle touch gesture
   */
  private handleTouchGesture(gesture: TouchGesture): void {
    switch (gesture.type) {
      case 'swipe':
        this.handleSwipeGesture(gesture);
        break;
      case 'longPress':
        this.handleLongPressGesture(gesture);
        break;
      case 'tap':
        this.handleTapGesture(gesture);
        break;
    }
  }

  /**
   * Handle swipe gesture
   */
  private handleSwipeGesture(gesture: TouchGesture): void {
    if (!gesture.direction) return;

    switch (gesture.direction) {
      case 'left':
        // Navigate to next item
        this.navigateNext();
        break;
      case 'right':
        // Navigate to previous item
        this.navigatePrevious();
        break;
      case 'up':
        // Scroll up or close modal
        this.handleSwipeUp();
        break;
      case 'down':
        // Scroll down or open modal
        this.handleSwipeDown();
        break;
    }
  }

  /**
   * Handle long press gesture
   */
  private handleLongPressGesture(gesture: TouchGesture): void {
    // Show context menu or additional options
    const element = document.elementFromPoint(gesture.coordinates.x, gesture.coordinates.y);
    if (element) {
      this.showContextMenu(element, gesture.coordinates);
    }
  }

  /**
   * Handle tap gesture
   */
  private handleTapGesture(gesture: TouchGesture): void {
    // Provide haptic feedback if available
    if (this.config.features.hapticFeedback && this.deviceInfo?.hapticSupport) {
      this.triggerHapticFeedback();
    }
  }

  /**
   * Navigate to next item
   */
  private navigateNext(): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    
    if (focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
    }
  }

  /**
   * Navigate to previous item
   */
  private navigatePrevious(): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    
    if (focusableElements[prevIndex]) {
      focusableElements[prevIndex].focus();
    }
  }

  /**
   * Handle swipe up
   */
  private handleSwipeUp(): void {
    // Close modal or go back
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    modals.forEach(modal => {
      if (modal.classList.contains('open')) {
        modal.classList.remove('open');
      }
    });
  }

  /**
   * Handle swipe down
   */
  private handleSwipeDown(): void {
    // Refresh or show menu
    window.scrollTo(0, 0);
  }

  /**
   * Show context menu
   */
  private showContextMenu(element: Element, coordinates: { x: number; y: number }): void {
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${coordinates.x}px`;
    menu.style.top = `${coordinates.y}px`;
    menu.style.background = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.padding = '8px';
    menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    menu.style.zIndex = '1000';
    
    menu.innerHTML = `
      <button onclick="this.parentElement.remove()">Close</button>
    `;
    
    document.body.appendChild(menu);
    
    // Remove menu after 3 seconds
    setTimeout(() => menu.remove(), 3000);
  }

  /**
   * Get focusable elements
   */
  private getFocusableElements(): HTMLElement[] {
    const selector = 'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHapticFeedback(): void {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  /**
   * Setup adaptive layout
   */
  private setupAdaptiveLayout(): void {
    if (!this.config.features.adaptiveLayout) return;

    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;

      // Apply responsive classes
      document.body.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');
      
      if (width < this.config.breakpoints.sm) {
        document.body.classList.add('mobile');
      } else if (width < this.config.breakpoints.lg) {
        document.body.classList.add('tablet');
      } else {
        document.body.classList.add('desktop');
      }

      if (aspectRatio < 1) {
        document.body.classList.add('portrait');
      } else {
        document.body.classList.add('landscape');
      }

      // Adjust layout based on device
      this.adjustLayoutForDevice();
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
  }

  /**
   * Adjust layout for device
   */
  private adjustLayoutForDevice(): void {
    if (!this.deviceInfo) return;

    const header = document.querySelector('header');
    const navigation = document.querySelector('nav');
    const main = document.querySelector('main');

    if (this.deviceInfo.type === 'mobile') {
      // Mobile-specific adjustments
      if (header) {
        header.classList.add('mobile-header');
      }
      if (navigation) {
        navigation.classList.add('mobile-nav');
      }
      if (main) {
        main.classList.add('mobile-main');
      }
    } else if (this.deviceInfo.type === 'tablet') {
      // Tablet-specific adjustments
      if (header) {
        header.classList.add('tablet-header');
      }
      if (navigation) {
        navigation.classList.add('tablet-nav');
      }
      if (main) {
        main.classList.add('tablet-main');
      }
    }
  }

  /**
   * Setup orientation support
   */
  private setupOrientationSupport(): void {
    if (!this.config.features.orientationSupport) return;

    const handleOrientationChange = () => {
      const orientation = screen.orientation?.angle === 90 ? 'landscape' : 'portrait';
      document.body.classList.remove('portrait', 'landscape');
      document.body.classList.add(orientation);
      
      // Re-detect device info
      this.detectDevice();
      
      // Adjust layout
      this.adjustLayoutForDevice();
    };

    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    handleOrientationChange();
  }

  /**
   * Setup safe area support
   */
  private setupSafeAreaSupport(): void {
    if (!this.config.features.safeAreaSupport) return;

    const updateSafeArea = () => {
      const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-top') || '0px';
      const safeAreaBottom = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-bottom') || '0px';
      const safeAreaLeft = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-left') || '0px';
      const safeAreaRight = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-right') || '0px';

      document.documentElement.style.setProperty('--safe-area-inset-top', safeAreaTop);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', safeAreaBottom);
      document.documentElement.style.setProperty('--safe-area-inset-left', safeAreaLeft);
      document.documentElement.style.setProperty('--safe-area-inset-right', safeAreaRight);
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
  }

  /**
   * Setup viewport optimization
   */
  private setupViewportOptimization(): void {
    if (!this.config.features.viewportOptimization) return;

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      let content = 'width=device-width, initial-scale=1';
      
      if (this.deviceInfo?.type === 'mobile') {
        content += ', user-scalable=yes, maximum-scale=5';
      }
      
      viewport.setAttribute('content', content);
    }

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  /**
   * Setup performance optimization
   */
  private setupPerformanceOptimization(): void {
    if (!this.config.features.performanceOptimization) return;

    // Monitor performance
    this.monitorPerformance();
    
    // Optimize for slow connections
    if (this.deviceInfo?.connection === 'slow-2g' || this.deviceInfo?.connection === '2g') {
      this.optimizeForSlowConnection();
    }
  }

  /**
   * Monitor performance
   */
  private monitorPerformance(): void {
    if (!this.config.monitoring.enabled) return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor user interactions
    this.monitorUserInteractions();
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordPerformanceMetric('firstContentfulPaint', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordPerformanceMetric('largestContentfulPaint', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.recordPerformanceMetric('firstInputDelay', entry.processingStart - entry.startTime);
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordPerformanceMetric('cumulativeLayoutShift', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(metric: string, value: number): void {
    const metrics: Partial<PerformanceMetrics> = {
      [metric]: value,
      deviceInfo: this.deviceInfo!,
      timestamp: new Date().toISOString(),
    };

    this.performanceMetrics.push(metrics as PerformanceMetrics);
    logger.info(`Performance metric recorded: ${metric} = ${value}`);
  }

  /**
   * Monitor resource loading
   */
  private monitorResourceLoading(): void {
    if (!('PerformanceObserver' in window)) return;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const loadTime = entry.responseEnd - entry.requestStart;
          if (loadTime > 1000) { // Slow resource
            logger.warn('Slow resource detected', {
              name: entry.name,
              loadTime,
              size: entry.transferSize,
            });
          }
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor user interactions
   */
  private monitorUserInteractions(): void {
    const interactionMetrics = {
      clicks: 0,
      scrolls: 0,
      keypresses: 0,
      touches: 0,
    };

    document.addEventListener('click', () => interactionMetrics.clicks++, { passive: true });
    document.addEventListener('scroll', () => interactionMetrics.scrolls++, { passive: true });
    document.addEventListener('keypress', () => interactionMetrics.keypresses++, { passive: true });
    document.addEventListener('touchstart', () => interactionMetrics.touches++, { passive: true });

    // Report metrics every 30 seconds
    setInterval(() => {
      logger.info('User interaction metrics', interactionMetrics);
      Object.keys(interactionMetrics).forEach(key => {
        (interactionMetrics as any)[key] = 0;
      });
    }, 30000);
  }

  /**
   * Optimize for slow connection
   */
  private optimizeForSlowConnection(): void {
    // Disable non-essential features
    document.body.classList.add('slow-connection');
    
    // Reduce image quality
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.hasAttribute('data-low-quality')) {
        img.setAttribute('src', img.getAttribute('data-low-quality')!);
      }
    });
    
    // Disable animations
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup monitoring
   */
  private setupMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    // Monitor viewport changes
    this.monitorViewportChanges();
    
    // Monitor device orientation
    this.monitorDeviceOrientation();
    
    // Monitor network changes
    this.monitorNetworkChanges();
  }

  /**
   * Monitor viewport changes
   */
  private monitorViewportChanges(): void {
    const updateViewportInfo = () => {
      const info = {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.angle || 0,
        timestamp: new Date().toISOString(),
      };
      
      logger.info('Viewport changed', info);
    };

    updateViewportInfo();
    window.addEventListener('resize', updateViewportInfo);
  }

  /**
   * Monitor device orientation
   */
  private monitorDeviceOrientation(): void {
    if (!window.DeviceOrientationEvent) return;

    window.addEventListener('deviceorientation', (event) => {
      const orientation = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
        timestamp: new Date().toISOString(),
      };
      
      logger.debug('Device orientation changed', orientation);
    });
  }

  /**
   * Monitor network changes
   */
  private monitorNetworkChanges(): void {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateConnectionInfo = () => {
      const info = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: new Date().toISOString(),
      };
      
      logger.info('Network connection changed', info);
    };

    connection.addEventListener('change', updateConnectionInfo);
    updateConnectionInfo();
  }

  /**
   * Get device information
   */
  getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return this.performanceMetrics;
  }

  /**
   * Get touch gestures
   */
  getTouchGestures(): TouchGesture[] {
    return this.touchGestures;
  }

  /**
   * Update responsive configuration
   */
  updateConfig(config: Partial<ResponsiveConfig>): void {
    this.config = ResponsiveConfigSchema.parse({
      ...this.config,
      ...config,
    });
    logger.info('Responsive configuration updated');
  }

  /**
   * Get responsive configuration
   */
  getConfig(): ResponsiveConfig {
    return this.config;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Remove event listeners
    window.removeEventListener('resize', this.detectDevice);
    window.removeEventListener('orientationchange', this.detectDevice);

    // Remove media queries
    this.mediaQueries.forEach(mq => {
      if (mq.removeListener) {
        mq.removeListener(() => {});
      }
    });
    this.mediaQueries.clear();

    logger.info('Mobile responsive manager cleaned up');
  }
}

export default MobileResponsiveManager;