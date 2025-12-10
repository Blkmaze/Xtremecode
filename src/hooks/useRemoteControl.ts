import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

export interface RemoteControlConfig {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onEnter?: () => void;
  onBack?: () => void;
  onMenu?: () => void;
  onPlayPause?: () => void;
  onFastForward?: () => void;
  onRewind?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onChannelUp?: () => void;
  onChannelDown?: () => void;
  onNumber?: (number: number) => void;
  enabled?: boolean;
}

export const useRemoteControl = (config: RemoteControlConfig) => {
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!config.enabled) return;

    const handleKeyDown = (event: any) => {
      const { keyCode } = event;
      const currentConfig = configRef.current;

      switch (keyCode) {
        // D-Pad Navigation
        case 19: // Arrow Up
        case 38: // Up Arrow
          event.preventDefault();
          currentConfig.onUp?.();
          break;
        case 20: // Arrow Down
        case 40: // Down Arrow
          event.preventDefault();
          currentConfig.onDown?.();
          break;
        case 21: // Arrow Left
        case 37: // Left Arrow
          event.preventDefault();
          currentConfig.onLeft?.();
          break;
        case 22: // Arrow Right
        case 39: // Right Arrow
          event.preventDefault();
          currentConfig.onRight?.();
          break;

        // Action Buttons
        case 23: // Enter/OK
        case 13: // Enter (web)
          event.preventDefault();
          currentConfig.onEnter?.();
          break;
        case 4: // Back
        case 27: // Escape (web)
          event.preventDefault();
          currentConfig.onBack?.();
          break;
        case 82: // Menu
          event.preventDefault();
          currentConfig.onMenu?.();
          break;

        // Media Controls
        case 85: // Play/Pause
        case 179: // Play/Pause (Windows)
          event.preventDefault();
          currentConfig.onPlayPause?.();
          break;
        case 87: // Fast Forward
        case 228: // Fast Forward (Windows)
          event.preventDefault();
          currentConfig.onFastForward?.();
          break;
        case 88: // Rewind
        case 227: // Rewind (Windows)
          event.preventDefault();
          currentConfig.onRewind?.();
          break;

        // Volume Controls
        case 24: // Volume Up
          event.preventDefault();
          currentConfig.onVolumeUp?.();
          break;
        case 25: // Volume Down
          event.preventDefault();
          currentConfig.onVolumeDown?.();
          break;
        case 164: // Mute
          event.preventDefault();
          currentConfig.onMute?.();
          break;

        // Channel Controls
        case 166: // Channel Up
          event.preventDefault();
          currentConfig.onChannelUp?.();
          break;
        case 167: // Channel Down
          event.preventDefault();
          currentConfig.onChannelDown?.();
          break;

        // Number Keys (0-9)
        case 7: // 0
        case 8: // 1
        case 9: // 2
        case 10: // 3
        case 11: // 4
        case 12: // 5
        case 13: // 6
        case 14: // 7
        case 15: // 8
        case 16: // 9
          event.preventDefault();
          const number = keyCode - 7; // Map to 0-9
          currentConfig.onNumber?.(number);
          break;

        // Additional Fire Stick specific keys
        case 19: // Up
        case 20: // Down
        case 21: // Left
        case 22: // Right
        case 66: // Center/OK
          event.preventDefault();
          if (keyCode === 66) {
            currentConfig.onEnter?.();
          }
          break;
      }
    };

    const handleKeyUp = (event: any) => {
      // Handle key up events if needed
    };

    // Add event listeners for different platforms
    if (Platform.OS === 'android') {
      // For Android TV and Fire Stick
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        configRef.current.onBack?.();
        return true; // Prevent default behavior
      });

      // Add key event listeners for Android
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
      }

      return () => {
        subscription.remove();
        if (typeof document !== 'undefined') {
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
        }
      };
    } else {
      // For web and other platforms
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
      }

      return () => {
        if (typeof document !== 'undefined') {
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
        }
      };
    }
  }, [config.enabled]);
};

export default useRemoteControl;