import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MobileResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  className?: string;
  animation?: boolean;
}

export default function MobileResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
  className = '',
  animation = true,
}: MobileResponsiveGridProps) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
    gap: gap.mobile,
    width: '100%',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className={`mobile-responsive-grid ${className}`}
      style={gridStyle}
      variants={animation ? containerVariants : undefined}
      initial={animation ? 'hidden' : undefined}
      animate={animation ? 'visible' : undefined}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={animation ? itemVariants : undefined}
          className="mobile-grid-item"
        >
          {child}
        </motion.div>
      ))}
      
      <style jsx>{`
        .mobile-responsive-grid {
          display: grid;
          width: 100%;
        }
        
        .mobile-grid-item {
          min-height: 0; /* Prevent grid items from expanding */
          overflow: hidden;
        }
        
        /* Mobile styles */
        @media (max-width: 640px) {
          .mobile-responsive-grid {
            grid-template-columns: repeat(${columns.mobile}, 1fr);
            gap: ${gap.mobile};
            padding: 0.5rem;
          }
        }
        
        /* Tablet styles */
        @media (min-width: 641px) and (max-width: 1024px) {
          .mobile-responsive-grid {
            grid-template-columns: repeat(${columns.tablet}, 1fr);
            gap: ${gap.tablet};
            padding: 1rem;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 1025px) {
          .mobile-responsive-grid {
            grid-template-columns: repeat(${columns.desktop}, 1fr);
            gap: ${gap.desktop};
            padding: 1.5rem;
          }
        }
        
        /* Enhanced mobile touch targets */
        @media (max-width: 640px) {
          .mobile-grid-item > * {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Prevent horizontal scroll */
        .mobile-responsive-grid {
          overflow-x: hidden;
        }
        
        /* Smooth scrolling for mobile */
        .mobile-responsive-grid {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
      `}</style>
    </motion.div>
  );
}
