import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

/**
 * Universal cross-platform action confirmation helper.
 *
 * In React Native Web, Alert.alert(title, msg, buttons) ignores button callbacks
 * and simply invokes window.alert without executing onPress actions.
 * This helper uses window.confirm on web and native Alert.alert on Android/iOS.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: ConfirmOptions
): void {
  if (Platform.OS === 'web') {
    let ok = true;
    try {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        ok = window.confirm(`${title}\n\n${message}`);
      }
    } catch {
      ok = true;
    }
    if (ok) {
      try {
        const res = onConfirm();
        if (res && typeof res.then === 'function') {
          res.catch((err) => console.error('Error during confirmed action:', err));
        }
      } catch (err) {
        console.error('Error during confirmed action:', err);
      }
    }
  } else {
    Alert.alert(title, message, [
      {
        text: options?.cancelText || 'Cancel',
        style: 'cancel',
      },
      {
        text: options?.confirmText || 'Confirm',
        style: options?.isDestructive ? 'destructive' : 'default',
        onPress: () => {
          try {
            const res = onConfirm();
            if (res && typeof res.then === 'function') {
              res.catch((err) => console.error('Error during confirmed action:', err));
            }
          } catch (err) {
            console.error('Error during confirmed action:', err);
          }
        },
      },
    ]);
  }
}
