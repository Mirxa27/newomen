import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboard } from '@/hooks/useKeyboard';
import MobileFooter from '../layout/MobileFooter';
import Header from '../layout/Header';

interface MobileOptimizedLayoutProps {
  children: ReactNode;
}

export default function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen: isKeyboardOpen, height: keyboardHeight } = useKeyboard();
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  // Enhanced scroll detection for mobile
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const direction = currentScrollY > lastScrollY ? 'down' : 'up';
          
          setScrollDirection(direction);
          setIsScrolling(currentScrollY > 10);
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Prevent zoom on input focus (iOS)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      }
    };

    const handleFocusOut = () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Add safe area handling for iOS
  useEffect(() => {
    const setSafeArea = () => {
      const root = document.documentElement;
      const safeAreaTop = getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)');
      const safeAreaBottom = getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)');
      
      if (safeAreaTop) {
        root.style.setProperty('--safe-area-top', safeAreaTop);
      }
      if (safeAreaBottom) {
        root.style.setProperty('--safe-area-bottom', safeAreaBottom);
      }
    };

    setSafeArea();
    window.addEventListener('resize', setSafeArea);
    return () => window.removeEventListener('resize', setSafeArea);
  }, []);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col overflow-x-hidden bg-background">
      {/* Enhanced Header with scroll behavior */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ 
          y: scrollDirection === 'down' && isScrolling ? -80 : 0,
          opacity: isScrolling ? 0.95 : 1
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-50"
      >
        <Header />
      </motion.div>

      {/* Main content with enhanced mobile optimizations */}
      <main className="flex-1 relative">
        <div className="h-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                ease: 'easeInOut',
                type: 'tween'
              }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Enhanced Mobile Footer - hides when keyboard is open or scrolling down */}
      {user && location.pathname !== '/auth' && !isKeyboardOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ 
            y: scrollDirection === 'down' && isScrolling ? 100 : 0,
            opacity: scrollDirection === 'down' && isScrolling ? 0 : 1
          }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-40"
        >
          <MobileFooter />
        </motion.div>
      )}

      {/* Mobile-specific enhancements */}
      <style jsx>{`
        /* Prevent pull-to-refresh on mobile */
        body {
          overscroll-behavior-y: contain;
        }
        
        /* Enhanced touch scrolling */
        .mobile-scroll {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
        }
        
        /* Prevent text selection on UI elements */
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Enhanced tap targets */
        .touch-target {
          min-height: 44px;
          min-width: 44px;
          position: relative;
        }
        
        .touch-target::before {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          z-index: -1;
        }
      `}</style>
    </div>
  );
}
