import { useState, useCallback, useEffect } from 'react';

interface UseFullScreenReturn {
  isFullScreen: boolean;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
  toggleFullScreen: () => void;
}

export const useFullScreen = (onEnter?: () => void, onExit?: () => void): UseFullScreenReturn => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const enterFullScreen = useCallback(() => {
    setIsFullScreen(true);
    onEnter?.();
  }, [onEnter]);

  const exitFullScreen = useCallback(() => {
    setIsFullScreen(false);
    onExit?.();
  }, [onExit]);

  const toggleFullScreen = useCallback(() => {
    if (isFullScreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  }, [isFullScreen, enterFullScreen, exitFullScreen]);

  // Listen for Escape key to exit full-screen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        exitFullScreen();
      }
    };

    if (isFullScreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, exitFullScreen]);

  return {
    isFullScreen,
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen
  };
};