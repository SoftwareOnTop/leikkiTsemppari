import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore keys must only contain [A-Za-z0-9._-].
const keyPrefix = 'leikkitsemppari_';

function toSecureStoreKey(rawKey: string): string {
  const safe = rawKey.replace(/[^0-9A-Za-z._-]/g, '_');
  return safe.length > 0 ? safe : `${keyPrefix}default`;
}

function getWebStorage(): Storage | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = (globalThis as any).window as Window | undefined;
    return w?.localStorage ?? null;
  } catch {
    return null;
  }
}

const memoryFallback = new Map<string, string>();

export const secureStore = {
  async getItem(key: string): Promise<string | null> {
    const finalKey = toSecureStoreKey(keyPrefix + key);

    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      return storage ? storage.getItem(finalKey) : memoryFallback.get(finalKey) ?? null;
    }

    // expo-secure-store is native-only; guard in case it isn't available.
    try {
      return await SecureStore.getItemAsync(finalKey);
    } catch {
      return memoryFallback.get(finalKey) ?? null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    const finalKey = toSecureStoreKey(keyPrefix + key);

    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (storage) storage.setItem(finalKey, value);
      else memoryFallback.set(finalKey, value);
      return;
    }

    try {
      await SecureStore.setItemAsync(finalKey, value);
    } catch {
      memoryFallback.set(finalKey, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    const finalKey = toSecureStoreKey(keyPrefix + key);

    if (Platform.OS === 'web') {
      const storage = getWebStorage();
      if (storage) storage.removeItem(finalKey);
      memoryFallback.delete(finalKey);
      return;
    }

    try {
      await SecureStore.deleteItemAsync(finalKey);
    } finally {
      memoryFallback.delete(finalKey);
    }
  },
};
