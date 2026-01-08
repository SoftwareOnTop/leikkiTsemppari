import { create } from 'zustand';

import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

type SessionState = {
  session: Session | null;
  initializing: boolean;
  init: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  initializing: true,

  init: async () => {
    set({ initializing: true });
    const { data } = await supabase.auth.getSession();
    set({ session: data.session ?? null, initializing: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session: session ?? null, initializing: false });
    });
  },

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUpWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
