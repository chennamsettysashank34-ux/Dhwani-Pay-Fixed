import { Platform } from 'react-native';

export interface NativePaymentEvent {
  amount: number;
  source: string;
  payer: string;
  utr: string;
  announcedNatively?: boolean;
}

type PaymentCallback = (event: NativePaymentEvent) => void;
type Subscription = { remove: () => void };

const NOOP_SUBSCRIPTION: Subscription = { remove: () => {} };

function getNativePaymentModule(): any | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  try {
    const ExpoModulesCore = require('expo-modules-core');
    if (typeof ExpoModulesCore.requireOptionalNativeModule === 'function') {
      return ExpoModulesCore.requireOptionalNativeModule('PaymentListener');
    }
    if (typeof ExpoModulesCore.requireNativeModule === 'function') {
      return ExpoModulesCore.requireNativeModule('PaymentListener');
    }
    return null;
  } catch (e) {
    console.warn('[PaymentListener] Native module unavailable:', e);
    return null;
  }
}

/**
 * Subscribe to native Android payment notifications intercepted by
 * PaymentNotificationListenerService via the PaymentListener Expo module.
 *
 * Compatible with both Expo SDK 52-57 JSI NativeModule (.addListener directly on module)
 * and LegacyEventEmitter / EventEmitter fallbacks.
 */
export function addPaymentListener(callback: PaymentCallback): Subscription {
  if (Platform.OS !== 'android') {
    return NOOP_SUBSCRIPTION;
  }

  try {
    const nativeModule = getNativePaymentModule();
    if (!nativeModule) {
      return NOOP_SUBSCRIPTION;
    }

    // Modern Expo Modules API (SDK 52-57): NativeModule is itself an EventEmitter
    if (typeof nativeModule.addListener === 'function') {
      const sub = nativeModule.addListener('onPaymentReceived', callback);
      if (sub && typeof sub.remove === 'function') {
        return sub;
      }
    }

    // Fallback for older EventEmitter wrappers
    const ExpoModulesCore = require('expo-modules-core');
    const EmitterClass = ExpoModulesCore.LegacyEventEmitter || ExpoModulesCore.EventEmitter;
    if (EmitterClass) {
      const emitter = new EmitterClass(nativeModule);
      if (typeof emitter.addListener === 'function') {
        return emitter.addListener('onPaymentReceived', callback);
      }
    }

    return NOOP_SUBSCRIPTION;
  } catch (e) {
    console.warn('[PaymentListener] Failed to attach payment listener:', e);
    return NOOP_SUBSCRIPTION;
  }
}

/**
 * Check if the Android user has granted DhwaniPay NotificationListener permission in system settings.
 */
export async function isPermissionGranted(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const nativeModule = getNativePaymentModule();
    if (!nativeModule || typeof nativeModule.isPermissionGranted !== 'function') {
      return false;
    }
    return Boolean(await nativeModule.isPermissionGranted());
  } catch {
    return false;
  }
}

/**
 * Open the Android system Notification Listener Access settings screen
 * so the merchant can toggle DhwaniPay on with a single tap.
 */
export async function openPermissionSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const nativeModule = getNativePaymentModule();
    if (!nativeModule || typeof nativeModule.openPermissionSettings !== 'function') {
      return false;
    }
    return Boolean(await nativeModule.openPermissionSettings());
  } catch (e) {
    console.warn('[PaymentListener] Could not open notification listener settings:', e);
    return false;
  }
}
