import { create } from 'zustand';

import { supabase } from '../lib/supabase';
import type { Child, Game, PlaySession } from './usePlayGridStore';

type AppDataState = {
  children: Child[];
  games: Game[];
  sessions: PlaySession[];
  pinCode: string | null;

  loading: boolean;
  refreshAll: () => Promise<void>;

  upsertChild: (args: { id?: string; name: string }) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;

  upsertGame: (args: { id?: string; name: string; emoji: string; color: string }) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;

  addPlaySession: (args: { childAId: string; childBId: string; gameId: string }) => Promise<void>;
  resetGrid: () => Promise<void>;
};

export const useAppDataStore = create<AppDataState>((set, get) => ({
  children: [],
  games: [],
  sessions: [],
  pinCode: null,

  loading: false,

  refreshAll: async () => {
    set({ loading: true });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Ensure profile exists (RLS allows inserting/updating your own row)
      await supabase.from('profiles').upsert({ id: user.id, email: user.email ?? null });
    }

    const [{ data: profile }, { data: children }, { data: games }, { data: sessions }] = await Promise.all([
      supabase.from('profiles').select('pin_code').maybeSingle(),
      supabase.from('children').select('id,name').order('name'),
      supabase.from('games').select('id,name,emoji,color').order('name'),
      supabase
        .from('play_sessions')
        .select('id,child_a_id,child_b_id,game_id,created_at')
        .order('created_at', { ascending: false }),
    ]);

    set({
      pinCode: profile?.pin_code ?? null,
      children: (children ?? []) as Child[],
      games: (games ?? []) as Game[],
      sessions: (sessions ?? []) as PlaySession[],
      loading: false,
    });
  },

  upsertChild: async ({ id, name }) => {
    const payload = id ? { id, name } : { name };
    const { error } = await supabase.from('children').upsert(payload).select().maybeSingle();
    if (error) throw error;
    await get().refreshAll();
  },

  deleteChild: async (id) => {
    const { error } = await supabase.from('children').delete().eq('id', id);
    if (error) throw error;
    await get().refreshAll();
  },

  upsertGame: async ({ id, name, emoji, color }) => {
    const payload = id ? { id, name, emoji, color } : { name, emoji, color };
    const { error } = await supabase.from('games').upsert(payload).select().maybeSingle();
    if (error) throw error;
    await get().refreshAll();
  },

  deleteGame: async (id) => {
    const { error } = await supabase.from('games').delete().eq('id', id);
    if (error) throw error;
    await get().refreshAll();
  },

  addPlaySession: async ({ childAId, childBId, gameId }) => {
    const { error } = await supabase
      .from('play_sessions')
      .insert({ child_a_id: childAId, child_b_id: childBId, game_id: gameId })
      .select()
      .maybeSingle();
    if (error) throw error;
    await get().refreshAll();
  },

  resetGrid: async () => {
    const { error } = await supabase.from('play_sessions').delete().gte('created_at', '1970-01-01T00:00:00Z');
    if (error) throw error;
    await get().refreshAll();
  },
}));
