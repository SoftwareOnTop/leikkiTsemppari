import { create } from 'zustand';

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { Child, Game, PlaySession } from './usePlayGridStore';

export type PairAssignment = {
  id: string;
  child_a_id: string;
  child_b_id: string;
  game_id: string;
  updated_at: string;
};

type AppDataState = {
  children: Child[];
  games: Game[];
  sessions: PlaySession[];
  assignments: PairAssignment[];
  pinCode: string | null;

  loading: boolean;
  refreshAll: () => Promise<void>;

  upsertChild: (args: { id?: string; name: string }) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;

  upsertGame: (args: { id?: string; name: string; emoji: string; color: string }) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;

  addPlaySession: (args: { childAId: string; childBId: string; gameId: string }) => Promise<void>;
  resetGrid: () => Promise<void>;
  resetAllChildren: () => Promise<void>;

  updatePinCode: (newPin: string) => Promise<void>;

  upsertPairAssignment: (args: { childAId: string; childBId: string; gameId: string }) => Promise<void>;
};

export const useAppDataStore = create<AppDataState>((set, get) => ({
  children: [],
  games: [],
  sessions: [],
  assignments: [],
  pinCode: null,

  loading: false,

  refreshAll: async () => {
    set({ loading: true });

    if (!isSupabaseConfigured) {
      set({ loading: false, children: [], games: [], sessions: [], assignments: [], pinCode: null });
      return;
    }

    const supabase = getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Ensure profile exists (RLS allows inserting/updating your own row)
      await supabase.from('profiles').upsert({ id: user.id, email: user.email ?? null });
    }

    const [{ data: profile }, { data: children }, { data: games }, { data: sessions }, { data: assignments }] = await Promise.all([
      supabase.from('profiles').select('pin_code').maybeSingle(),
      supabase.from('children').select('id,name,axis').order('axis').order('name'),
      supabase.from('games').select('id,name,emoji,color').order('name'),
      supabase
        .from('play_sessions')
        .select('id,child_a_id,child_b_id,game_id,created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('pair_assignments')
        .select('id,child_a_id,child_b_id,game_id,updated_at')
        .order('updated_at', { ascending: false }),
    ]);

    set({
      pinCode: profile?.pin_code ?? null,
      children: (children ?? []) as Child[],
      games: (games ?? []) as Game[],
      sessions: (sessions ?? []) as PlaySession[],
      assignments: (assignments ?? []) as PairAssignment[],
      loading: false,
    });
  },

  upsertChild: async ({ id, name }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const payload = (() => {
      if (id) return { id, name };

      const existing = get().children;
      const rowCount = existing.filter((c) => c.axis === 'row').length;
      const colCount = existing.filter((c) => c.axis === 'col').length;
      const axis: 'row' | 'col' = rowCount <= colCount ? 'row' : 'col';
      return { name, axis };
    })();
    const { error } = await supabase.from('children').upsert(payload).select().maybeSingle();
    if (error) throw error;
    await get().refreshAll();
  },

  deleteChild: async (id) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const { error } = await supabase.from('children').delete().eq('id', id);
    if (error) throw error;
    await get().refreshAll();
  },

  upsertGame: async ({ id, name, emoji, color }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const payload = id ? { id, name, emoji, color } : { name, emoji, color };
    const { error } = await supabase.from('games').upsert(payload).select().maybeSingle();
    if (error) throw error;
    await get().refreshAll();
  },

  deleteGame: async (id) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const { error } = await supabase.from('games').delete().eq('id', id);
    if (error) throw error;
    await get().refreshAll();
  },

  addPlaySession: async ({ childAId, childBId, gameId }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const { error } = await supabase
      .from('play_sessions')
      .insert({ child_a_id: childAId, child_b_id: childBId, game_id: gameId })
      .select()
      .maybeSingle();
    if (error) throw error;
    await get().refreshAll();
  },

  resetGrid: async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const [{ error: sessionsError }, { error: assignmentsError }] = await Promise.all([
      supabase.from('play_sessions').delete().gte('created_at', '1970-01-01T00:00:00Z'),
      supabase.from('pair_assignments').delete().gte('created_at', '1970-01-01T00:00:00Z'),
    ]);
    if (sessionsError) throw sessionsError;
    if (assignmentsError) throw assignmentsError;
    await get().refreshAll();
  },

  resetAllChildren: async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    const supabase = getSupabase();
    const { error } = await supabase.from('children').delete().gte('created_at', '1970-01-01T00:00:00Z');
    if (error) throw error;
    await get().refreshAll();
  },

  updatePinCode: async (newPin) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }

    const pin = newPin.replace(/\D/g, '').slice(0, 4);
    if (pin.length !== 4) throw new Error('PIN pitää olla 4 numeroa.');

    const supabase = getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Ei kirjautunutta käyttäjää.');

    const { error } = await supabase.from('profiles').update({ pin_code: pin }).eq('id', user.id);
    if (error) throw error;

    set({ pinCode: pin });
  },

  upsertPairAssignment: async ({ childAId, childBId, gameId }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Missing Supabase env vars. Create mobile/.env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
      );
    }
    if (childAId === childBId) return;

    const [a, b] = childAId < childBId ? [childAId, childBId] : [childBId, childAId];
    const supabase = getSupabase();

    const { error } = await supabase.rpc('upsert_pair_assignment_and_log', {
      child_a: a,
      child_b: b,
      game: gameId,
    });

    if (error) {
      throw new Error(
        `${error.message}. Varmista että Supabaseen on ajettu päivitetty schema.sql (funktio upsert_pair_assignment_and_log).`
      );
    }
    await get().refreshAll();
  },
}));
