// Custom hook to detect keyboard visibility state
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';

interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export function useKeyboard() {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    // Only set up listeners on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Keyboard show listeners
    const showListener = Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      console.log('🎹 Keyboard opening, height:', info.keyboardHeight);
      setKeyboardState({
        isOpen: true,
        height: info.keyboardHeight,
      });
    });

    const didShowListener = Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
      console.log('🎹 Keyboard fully open, height:', info.keyboardHeight);
      setKeyboardState({
        isOpen: true,
        height: info.keyboardHeight,
      });
    });

    // Keyboard hide listeners
    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      console.log('🎹 Keyboard closing');
      setKeyboardState({
        isOpen: false,
        height: 0,
      });
    });

    const didHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('🎹 Keyboard fully closed');
      setKeyboardState({
        isOpen: false,
        height: 0,
      });
    });

    // Cleanup listeners on unmount
    return () => {
      showListener.remove();
      didShowListener.remove();
      hideListener.remove();
      didHideListener.remove();
    };
  }, []);

  // For web browsers, detect virtual keyboard using visualViewport API
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return; // Skip for native platforms
    }

    // Check if visualViewport is supported (modern browsers)
    if (!window.visualViewport) {
      return;
    }

    const handleResize = () => {
      if (!window.visualViewport) return;

      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      
      // If viewport is significantly smaller than window, keyboard is likely open
      const keyboardHeight = windowHeight - viewportHeight;
      const isKeyboardOpen = keyboardHeight > 150; // Threshold for keyboard detection

      if (isKeyboardOpen !== keyboardState.isOpen) {
        console.log('🎹 Web keyboard state changed:', isKeyboardOpen ? 'open' : 'closed');
        setKeyboardState({
          isOpen: isKeyboardOpen,
          height: isKeyboardOpen ? keyboardHeight : 0,
        });
      }
    };

    // Listen to viewport resize (happens when keyboard opens/closes)
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [keyboardState.isOpen]);

  // Alternative detection for older browsers - focusin/focusout on input elements
  useEffect(() => {
    if (Capacitor.isNativePlatform() || window.visualViewport) {
      return; // Skip if native or visualViewport is available
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        setTimeout(() => {
          console.log('🎹 Input focused - keyboard likely open');
          setKeyboardState({
            isOpen: true,
            height: 300, // Approximate height
          });
        }, 300); // Delay to allow keyboard to open
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        setTimeout(() => {
          // Check if focus moved to another input
          const activeElement = document.activeElement;
          if (
            activeElement?.tagName !== 'INPUT' &&
            activeElement?.tagName !== 'TEXTAREA' &&
            !(activeElement as HTMLElement)?.isContentEditable
          ) {
            console.log('🎹 Input unfocused - keyboard likely closed');
            setKeyboardState({
              isOpen: false,
              height: 0,
            });
          }
        }, 100);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return keyboardState;
}

