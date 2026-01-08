import { create } from 'zustand';

import type { Session } from '@supabase/supabase-js';

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

type SessionState = {
  session: Session | null;
  initializing: boolean;
  envMissing: boolean;
  init: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  initializing: true,
  envMissing: false,

  init: async () => {
    set({ initializing: true, envMissing: false });
    if (!isSupabaseConfigured) {
      set({ session: null, initializing: false, envMissing: true });
      return;
    }

    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    set({ session: data.session ?? null, initializing: false, envMissing: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session: session ?? null, initializing: false, envMissing: false });
    });
  },

  signInWithPassword: async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUpWithPassword: async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
