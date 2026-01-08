import * as SecureStore from 'expo-secure-store';

const keyPrefix = 'leikkitsemppari:';

export const secureStore = {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(keyPrefix + key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(keyPrefix + key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(keyPrefix + key);
  },
};
