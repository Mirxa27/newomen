import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { IOSServiceManager } from '@/services/features/ios';

interface IOSNativeBridgeContextType {
  isNative: boolean;
  services: IOSServiceManager;
  keyboardVisible: boolean;
  statusBarHeight: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  initializeServices: () => Promise<void>;
}

const IOSNativeBridgeContext = createContext<IOSNativeBridgeContextType | null>(null);

export const useIOSNativeBridge = () => {
  const context = useContext(IOSNativeBridgeContext);
  if (!context) {
    throw new Error('useIOSNativeBridge must be used within IOSNativeBridgeProvider');
  }
  return context;
};

interface IOSNativeBridgeProviderProps {
  children: React.ReactNode;
}

export const IOSNativeBridgeProvider: React.FC<IOSNativeBridgeProviderProps> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  const [services] = useState(() => IOSServiceManager.getInstance());

  useEffect(() => {
    const checkNativePlatform = () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);

      if (native) {
        // Set status bar style for iOS
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor({ color: '#1a1428' });

        // Get status bar height (iOS specific)
        const updateStatusBarHeight = () => {
          // Use CSS variable for safe area insets
          const root = document.documentElement;
          const computedStyle = getComputedStyle(root);
          const safeAreaTop = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
          setStatusBarHeight(safeAreaTop);
        };

        updateStatusBarHeight();

        // Setup keyboard listeners
        const keyboardShowListener = Keyboard.addListener('keyboardWillShow', () => {
          setKeyboardVisible(true);
        });

        const keyboardHideListener = Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardVisible(false);
        });

        // Update safe area insets based on CSS variables
        const updateSafeAreaInsets = () => {
          const root = document.documentElement;
          const computedStyle = getComputedStyle(root);
          setSafeAreaInsets({
            top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
            right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
            bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
            left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
          });
        };

        updateSafeAreaInsets();

        return () => {
          keyboardShowListener.remove();
          keyboardHideListener.remove();
        };
      }
    };

    checkNativePlatform();
  }, []);

  const initializeServices = async () => {
    if (isNative) {
      try {
        await services.initialize();
        await services.setupWellnessFeatures();
        await services.setupSecurityFeatures();
      } catch (error) {
        console.error('Failed to initialize iOS services:', error);
      }
    }
  };

  const contextValue: IOSNativeBridgeContextType = {
    isNative,
    services,
    keyboardVisible,
    statusBarHeight,
    safeAreaInsets,
    initializeServices
  };

  return (
    <IOSNativeBridgeContext.Provider value={contextValue}>
      {children}
    </IOSNativeBridgeContext.Provider>
  );
};

export default IOSNativeBridgeProvider;