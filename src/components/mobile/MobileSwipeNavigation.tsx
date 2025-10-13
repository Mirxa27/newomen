import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileSwipeNavigationProps {
  routes: Array<{
    path: string;
    label: string;
    icon?: React.ComponentType;
  }>;
  className?: string;
}

export default function MobileSwipeNavigation({ 
  routes, 
  className = '' 
}: MobileSwipeNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Find current route index
  useEffect(() => {
    const index = routes.findIndex(route => route.path === location.pathname);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [location.pathname, routes]);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < routes.length - 1) {
      navigate(routes[currentIndex + 1].path);
    }
    if (isRightSwipe && currentIndex > 0) {
      navigate(routes[currentIndex - 1].path);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        navigate(routes[currentIndex - 1].path);
      }
      if (e.key === 'ArrowRight' && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1].path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, navigate, routes]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < routes.length - 1;

  return (
    <div className={`mobile-swipe-navigation ${className}`}>
      {/* Navigation indicators */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {routes.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-primary scale-125' 
                : 'bg-muted-foreground/30'
            }`}
            animate={{
              scale: index === currentIndex ? 1.25 : 1,
              opacity: index === currentIndex ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Swipe area */}
      <div
        className="relative w-full h-full min-h-[200px] touch-optimized"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation arrows */}
        <AnimatePresence>
          {canGoBack && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 glass-card p-2 rounded-full touch-target"
              onClick={() => navigate(routes[currentIndex - 1].path)}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {canGoForward && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 glass-card p-2 rounded-full touch-target"
              onClick={() => navigate(routes[currentIndex + 1].path)}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Swipe hint */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          Swipe to navigate
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted/20 rounded-full h-1 mt-4">
        <motion.div
          className="bg-primary h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentIndex + 1) / routes.length) * 100}%` 
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </div>

      <style jsx>{`
        .mobile-swipe-navigation {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .touch-optimized {
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Enhanced touch targets for mobile */
        @media (max-width: 640px) {
          .touch-target {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        /* Smooth transitions */
        .mobile-swipe-navigation * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
