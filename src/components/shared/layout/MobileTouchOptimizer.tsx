import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface MobileTouchOptimizerProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  hapticFeedback?: boolean;
}

export default function MobileTouchOptimizer({
  children,
  className = '',
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 50,
  hapticFeedback = true,
}: MobileTouchOptimizerProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

  // Haptic feedback for supported devices
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (hapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Enhanced touch handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startTime = Date.now();
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: startTime });
    setTouchEnd(null);
    setIsPressed(true);
    triggerHaptic('light');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Update motion values for visual feedback
    x.set(deltaX);
    y.set(deltaY);
    
    // Prevent default if significant movement (swipe gesture)
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const endTime = Date.now();
    const endX = touch.clientX;
    const endY = touch.clientY;
    
    setTouchEnd({ x: endX, y: endY, time: endTime });
    setIsPressed(false);
    
    // Reset motion values
    x.set(0);
    y.set(0);
    
    // Calculate swipe direction and distance
    const deltaX = endX - touchStart.x;
    const deltaY = endY - touchStart.y;
    const deltaTime = endTime - touchStart.time;
    
    // Only trigger swipe if movement is significant and fast enough
    if (deltaTime < 300 && (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold)) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
          triggerHaptic('medium');
        } else {
          onSwipeLeft?.();
          triggerHaptic('medium');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
          triggerHaptic('medium');
        } else {
          onSwipeUp?.();
          triggerHaptic('medium');
        }
      }
    }
  };

  // Enhanced click handling for better mobile interaction
  const handleClick = (e: React.MouseEvent) => {
    // Add slight delay to prevent accidental double-taps
    e.preventDefault();
    setTimeout(() => {
      // Re-trigger the click event
      const element = e.target as HTMLElement;
      element.click();
    }, 50);
  };

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerHaptic('light');
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={`touch-optimized glass rounded-lg ${className}`}
      style={{ scale, x, y }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
