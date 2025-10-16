import React, { useRef, useEffect, useState } from 'react';
import { useIOSNativeBridge } from './IosNativeBridge';
import { cn } from '@/lib/shared/utils';

interface IosOptimizedScrollViewProps {
  children: React.ReactNode;
  className?: string;
  horizontal?: boolean;
  showScrollIndicators?: boolean;
  bounces?: boolean;
  onScroll?: (event: Event) => void;
  onScrollEnd?: (event: Event) => void;
  pullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  refreshThreshold?: number;
  refreshDistance?: number;
}

export const IosOptimizedScrollView: React.FC<IosOptimizedScrollViewProps> = ({
  children,
  className,
  horizontal = false,
  showScrollIndicators = true,
  bounces = true,
  onScroll,
  onScrollEnd,
  pullToRefresh = false,
  onRefresh,
  refreshThreshold = 80,
  refreshDistance = 100
}) => {
  const { isNative, services } = useIOSNativeBridge();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = (e: Event) => {
      onScroll?.(e);

      // Provide haptic feedback on scroll end
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (services.haptics.isHapticsEnabled()) {
          services.haptics.selection();
        }
        onScrollEnd?.(e);
      }, 150);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    // iOS momentum scrolling optimization
    if (isNative) {
      element.style.webkitOverflowScrolling = 'touch';
      element.style.overscrollBehavior = bounces ? 'auto' : 'none';
    }

    return () => {
      element.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isNative, bounces, onScroll, onScrollEnd, services.haptics]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!pullToRefresh) return;

    const touch = e.touches[0];
    startY.current = touch.clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pullToRefresh || !isPulling) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const scrollTop = scrollRef.current?.scrollTop || 0;

    // Only allow pull-to-refresh when at the top
    if (scrollTop === 0) {
      const distance = Math.max(0, currentY - startY.current);
      setPullDistance(distance);

      // Provide haptic feedback at threshold
      if (distance >= refreshThreshold && distance < refreshThreshold + 5) {
        services.haptics.impact('light');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!pullToRefresh || !isPulling || !onRefresh) return;

    setIsPulling(false);

    if (pullDistance >= refreshThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(refreshDistance);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const scrollContainerStyle: React.CSSProperties = {
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: bounces ? 'auto' : 'none',
    scrollbarWidth: showScrollIndicators ? 'auto' : 'none',
    msOverflowStyle: showScrollIndicators ? 'auto' : 'none',
    // iOS-specific optimizations
    touchAction: 'pan-y',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    // Pull to refresh offset
    transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
    transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Pull to refresh indicator */}
      {pullToRefresh && (
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-center bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"
          style={{
            height: `${refreshDistance}px`,
            transform: `translateY(${Math.max(0, pullDistance - refreshDistance)}px)`,
            opacity: pullDistance / refreshThreshold
          }}
        >
          <div className="flex flex-col items-center">
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            ) : (
              <div className={cn(
                'w-8 h-8 rounded-full border-2 transition-all duration-200',
                pullDistance >= refreshThreshold
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-400 bg-gray-400/10'
              )}>
                <svg
                  className={cn(
                    'w-full h-full transition-transform duration-200',
                    pullDistance >= refreshThreshold && 'rotate-180'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            )}
            <span className="text-xs text-gray-400 mt-2">
              {isRefreshing ? 'Refreshing...' : pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          'w-full h-full',
          horizontal ? 'flex flex-row overflow-x-auto' : 'overflow-y-auto',
          !showScrollIndicators && 'scrollbar-hide'
        )}
        style={scrollContainerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default IosOptimizedScrollView;