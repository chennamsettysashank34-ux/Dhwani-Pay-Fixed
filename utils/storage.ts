import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent storage for DhwaniPay.
 * Uses AsyncStorage which works on Android, iOS, and web.
 *
 * The previous implementation used window.localStorage with an in-memory fallback,
 * meaning ALL data was lost on native app restart. This version persists correctly.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`Storage.getItem("${key}") failed:`, e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Storage.setItem("${key}") failed:`, e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`Storage.removeItem("${key}") failed:`, e);
    }
  },
};
