// Define a more specific type for performance entries with non-standard properties
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: DOMHighResTimeStamp;
  hadRecentInput?: boolean;
  value?: number;
  responseEnd?: DOMHighResTimeStamp;
  requestStart?: DOMHighResTimeStamp;
  transferSize?: number;
}

export class MobileResponsiveManager {
  private isMobile: boolean;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private swipeThreshold: number = 50;
  private performanceObserver: PerformanceObserver | null = null;
  private longPressTimeout: number | null = null;
  private longPressDuration: number = 500;

  constructor() {
    this.isMobile = this.checkIfMobile();
    this.setupEventListeners();
    this.setupPerformanceObserver();
    this.setupGestureSupport();
    this.setupHapticFeedback();
  }

  private checkIfMobile(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', this.handleResize.bind(this));
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleResize(): void {
    const newIsMobile = this.checkIfMobile();
    if (newIsMobile !== this.isMobile) {
      this.isMobile = newIsMobile;
      this.dispatchResponsiveChangeEvent();
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
    this.longPressTimeout = window.setTimeout(() => {
      this.dispatchCustomEvent('longpress', { x: this.touchStartX, y: this.touchStartY });
      this.vibrate(200);
    }, this.longPressDuration);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
  }

  private handleTouchEnd(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
    this.handleSwipeGesture();
  }

  private handleSwipeGesture(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;

    if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaY) < this.swipeThreshold) {
      if (deltaX > 0) {
        this.dispatchCustomEvent('swiperight');
      } else {
        this.dispatchCustomEvent('swipeleft');
      }
    }

    if (Math.abs(deltaY) > this.swipeThreshold && Math.abs(deltaX) < this.swipeThreshold) {
      if (deltaY > 0) {
        this.dispatchCustomEvent('swipedown');
      } else {
        this.dispatchCustomEvent('swipeup');
      }
    }
  }

  private dispatchResponsiveChangeEvent(): void {
    const event = new CustomEvent('responsiveChange', {
      detail: { isMobile: this.isMobile },
    });
    window.dispatchEvent(event);
  }

  private dispatchCustomEvent(eventName: string, detail: object = {}): void {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  public getIsMobile(): boolean {
    return this.isMobile;
  }

  public vibrate(pattern: number | number[]): void {
    if (this.isMobile && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn("Haptic feedback (vibration) is not supported or enabled on this device.", error);
      }
    }
  }

  // Add missing method declarations
  public setupGestureSupport(): void {
    // Implementation for gesture support
  }

  public setupHapticFeedback(): void {
    // Implementation for haptic feedback
  }

  public on(eventName: string, callback: (event: CustomEvent) => void): void {
    document.addEventListener(eventName, callback as EventListener);
  }

  public off(eventName: string, callback: (event: CustomEvent) => void): void {
    document.removeEventListener(eventName, callback as EventListener);
  }

  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.analyzePerformanceEntry(entry);
        }
      });
      this.performanceObserver.observe({
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'resource', 'event'],
      });
    }
  }

  private analyzePerformanceEntry(entry: PerformanceEntry): void {
    const entryData = {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
    };

    switch (entry.entryType) {
      case 'navigation':
        this.logMetric('Navigation Timing', entryData);
        break;
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.logMetric('First Contentful Paint (FCP)', entryData);
        }
        break;
      case 'largest-contentful-paint':
        this.logMetric('Largest Contentful Paint (LCP)', entryData);
        break;
      case 'first-input':
        this.logMetric('First Input Delay (FID)', entryData);
        break;
      case 'layout-shift':
        this.logMetric('Cumulative Layout Shift (CLS)', { ...entryData, value: (entry as any).value });
        break;
      case 'resource':
        this.logMetric('Resource Timing', entryData);
        break;
      case 'event': {
        const eventEntry = entry as PerformanceEventTiming;
        const processingTime = eventEntry.processingStart - eventEntry.startTime;
        this.logMetric('Event Timing', { ...entryData, processingTime });
        break;
      }
    }
  }

  private logMetric(name: string, data: object): void {
    console.log(`[Performance] ${name}:`, data);
  }

  public addTapListener(element: HTMLElement, callback: (event: Event) => void): void {
    let touchStartTime = 0;
    const tapThreshold = 200;

    const handleTouchStart = () => {
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (event: Event) => {
      const touchEndTime = Date.now();
      if (touchEndTime - touchStartTime < tapThreshold) {
        callback(event);
        this.vibrate(50);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
  }

  public addDoubleTapListener(element: HTMLElement, callback: (event: Event) => void): void {
    let lastTap = 0;
    const doubleTapDelay = 300;

    this.addTapListener(element, (event) => {
      const now = Date.now();
      if (now - lastTap < doubleTapDelay) {
        callback(event);
        this.vibrate([50, 50, 50]);
      }
      lastTap = now;
    });
  }

  public addPanListener(element: HTMLElement, onPan: (detail: { deltaX: number; deltaY: number }) => void): void {
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      isPanning = true;
      lastX = event.touches[0].clientX;
      lastY = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isPanning) return;
      const deltaX = event.touches[0].clientX - lastX;
      const deltaY = event.touches[0].clientY - lastY;
      lastX = event.touches[0].clientX;
      lastY = event.touches[0].clientY;
      onPan({ deltaX, deltaY });
    };

    const handleTouchEnd = () => {
      isPanning = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);
  }

  public addPinchListener(element: HTMLElement, onPinch: (detail: { scale: number }) => void): void {
    let initialDistance = 0;

    const getDistance = (touches: TouchList) => {
      const [touch1, touch2] = [touches[0], touches[1]];
      return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        initialDistance = getDistance(event.touches);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && initialDistance > 0) {
        const currentDistance = getDistance(event.touches);
        const scale = currentDistance / initialDistance;
        onPinch({ scale });
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        initialDistance = 0;
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
  }

  public addRotationListener(element: HTMLElement, onRotate: (detail: { angle: number }) => void): void {
    let initialAngle = 0;

    const getAngle = (touches: TouchList) => {
      const [touch1, touch2] = [touches[0], touches[1]];
      return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        initialAngle = getAngle(event.touches);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const currentAngle = getAngle(event.touches);
        const angle = currentAngle - initialAngle;
        onRotate({ angle });
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
  }

  public getNetworkInfo(): object | null {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!connection) return null;
    return {
      effectiveType: connection.effectiveType,
      rtt: connection.rtt,
      downlink: connection.downlink,
      saveData: connection.saveData,
    };
  }

  public getMemoryInfo(): object | null {
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }
    return null;
  }

  public getDeviceInfo(): object {
    return {
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      platform: navigator.platform,
      vendor: navigator.vendor,
    };
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public onOnlineStatusChange(callback: (isOnline: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  public getBatteryInfo(callback: (battery: any) => void): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then(callback);
    }
  }

  public getScreenOrientation(): string {
    return screen.orientation.type;
  }

  public onScreenOrientationChange(callback: (orientation: string) => void): void {
    screen.orientation.addEventListener('change', () => callback(screen.orientation.type));
  }

  public lockScreenOrientation(orientation: 'portrait' | 'landscape'): Promise<void> {
    return screen.orientation.lock(orientation);
  }

  public unlockScreenOrientation(): void {
    screen.orientation.unlock();
  }

  public isFullScreen(): boolean {
    return !!document.fullscreenElement;
  }

  public requestFullScreen(element: HTMLElement): Promise<void> {
    return element.requestFullscreen();
  }

  public exitFullScreen(): Promise<void> {
    return document.exitFullscreen();
  }

  public onFullScreenChange(callback: (isFullScreen: boolean) => void): void {
    document.addEventListener('fullscreenchange', () => callback(this.isFullScreen()));
  }

  public getScrollPosition(): { x: number; y: number } {
    return { x: window.scrollX, y: window.scrollY };
  }

  public scrollTo(options: { x: number; y: number; smooth?: boolean }): void {
    window.scrollTo({
      left: options.x,
      top: options.y,
      behavior: options.smooth ? 'smooth' : 'auto',
    });
  }

  public onScroll(callback: (position: { x: number; y: number }) => void): void {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          callback(this.getScrollPosition());
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  public getViewportSize(): { width: number; height: number } {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  public onViewportResize(callback: (size: { width: number; height: number }) => void): void {
    let ticking = false;
    window.addEventListener('resize', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          callback(this.getViewportSize());
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  public getPerformanceMetrics(): {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
    resourceLoadTimes?: { name: string; duration: number }[];
  } {
    const metrics: any = {};
    const entries = performance.getEntries();

    const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
    if (fcpEntry) metrics.fcp = fcpEntry.startTime;

    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;

    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
      const fidEntry = fidEntries[0] as PerformanceEventTiming;
      metrics.fid = fidEntry.processingStart - fidEntry.startTime;
    }

    const clsEntries = performance.getEntriesByType('layout-shift');
    if (clsEntries.length > 0) {
      metrics.cls = clsEntries.reduce((sum, entry: any) => sum + (entry.hadRecentInput ? 0 : entry.value), 0);
    }

    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0] as PerformanceEventTiming;
      metrics.ttfb = (navEntry.responseEnd ?? 0) - (navEntry.requestStart ?? 0);
    }

    metrics.resourceLoadTimes = entries
      .filter(e => e.entryType === 'resource')
      .map(e => ({ name: e.name, duration: e.duration, size: (e as PerformanceEventTiming).transferSize }));

    return metrics;
  }
}

export const mobileResponsiveManager = new MobileResponsiveManager();