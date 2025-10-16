import React, { ReactNode } from 'react';
import { useIOSNativeBridge } from './IosNativeBridge';
import { cn } from '@/lib/shared/utils';

interface SafeAreaViewProps {
  children: ReactNode;
  className?: string;
  edges?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
  style?: React.CSSProperties;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  className,
  edges = { top: true, right: true, bottom: true, left: true },
  style
}) => {
  const { safeAreaInsets, isNative } = useIOSNativeBridge();

  const safeAreaStyle: React.CSSProperties = {
    ...style,
    ...(isNative && {
      paddingTop: edges.top ? `${safeAreaInsets.top}px` : undefined,
      paddingRight: edges.right ? `${safeAreaInsets.right}px` : undefined,
      paddingBottom: edges.bottom ? `${safeAreaInsets.bottom}px` : undefined,
      paddingLeft: edges.left ? `${safeAreaInsets.left}px` : undefined,
    })
  };

  return (
    <div
      className={cn('ios-safe-area', className)}
      style={safeAreaStyle}
    >
      {children}
    </div>
  );
};

// Convenience components for specific edge cases
export const SafeAreaTop: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <SafeAreaView edges={{ top: true, right: false, bottom: false, left: false }} className={className}>
    {children}
  </SafeAreaView>
);

export const SafeAreaBottom: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <SafeAreaView edges={{ top: false, right: false, bottom: true, left: false }} className={className}>
    {children}
  </SafeAreaView>
);

export const SafeAreaLeft: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <SafeAreaView edges={{ top: false, right: false, bottom: false, left: true }} className={className}>
    {children}
  </SafeAreaView>
);

export const SafeAreaRight: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <SafeAreaView edges={{ top: false, right: true, bottom: false, left: false }} className={className}>
    {children}
  </SafeAreaView>
);

export default SafeAreaView;