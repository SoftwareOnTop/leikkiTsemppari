import { create } from 'zustand';

export type Child = {
  id: string;
  name: string;
};

export type Game = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type PlaySession = {
  id: string;
  child_a_id: string;
  child_b_id: string;
  game_id: string;
  created_at: string;
};

type PairKey = string;

function pairKey(aId: string, bId: string): PairKey {
  return aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
}

type PlayGridState = {
  selectedGameId: string | null;
  setSelectedGameId: (gameId: string | null) => void;

  sessions: PlaySession[];
  setSessions: (sessions: PlaySession[]) => void;
  addSessionOptimistic: (session: PlaySession) => void;

  getPairCount: (childAId: string, childBId: string) => number;
};

export const usePlayGridStore = create<PlayGridState>((set: any, get: any) => ({
  selectedGameId: null,
  setSelectedGameId: (gameId: string | null) => set({ selectedGameId: gameId }),

  sessions: [],
  setSessions: (sessions: PlaySession[]) => set({ sessions }),
  addSessionOptimistic: (session: PlaySession) => set({ sessions: [session, ...get().sessions] }),

  getPairCount: (childAId: string, childBId: string) => {
    const key = pairKey(childAId, childBId);
    let count = 0;
    for (const s of get().sessions) {
      if (pairKey(s.child_a_id, s.child_b_id) === key) count += 1;
    }
    return count;
  },
}));
