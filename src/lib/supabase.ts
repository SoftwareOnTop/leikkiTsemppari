import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { secureStore } from './secureStore';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    // When env vars are missing we still create a harmless client so module loading never crashes.
    // Callers should gate behavior using `isSupabaseConfigured`.
    client = createClient(supabaseUrl ?? 'http://localhost', supabaseAnonKey ?? 'anon', {
      auth: {
        detectSessionInUrl: false,
        ...(isSupabaseConfigured
          ? {
              persistSession: true,
              autoRefreshToken: true,
              storage: {
                // SecureStore has a small per-item limit (~2KB) and Supabase sessions can exceed it.
                // Use AsyncStorage on native, localStorage on web.
                getItem: Platform.OS === 'web' ? secureStore.getItem : AsyncStorage.getItem,
                setItem: Platform.OS === 'web' ? secureStore.setItem : AsyncStorage.setItem,
                removeItem:
                  Platform.OS === 'web' ? secureStore.removeItem : AsyncStorage.removeItem,
              },
            }
          : {
              // Avoid hitting SecureStore or making network calls with placeholder config.
              persistSession: false,
              autoRefreshToken: false,
            }),
      },
    });
  }

  return client;
}
