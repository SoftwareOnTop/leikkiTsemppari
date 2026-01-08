import { create } from 'zustand';

type DragState = {
  draggingGameId: string | null;
  pointer: { x: number; y: number } | null;
  hovered: { rowChildId: string; colChildId: string } | null;

  startDrag: (gameId: string) => void;
  updatePointer: (x: number, y: number) => void;
  setHovered: (rowChildId: string, colChildId: string) => void;
  clearHovered: () => void;
  endDrag: () => void;
};

export const useDragStore = create<DragState>((set) => ({
  draggingGameId: null,
  pointer: null,
  hovered: null,

  startDrag: (gameId) => set({ draggingGameId: gameId, pointer: null, hovered: null }),
  updatePointer: (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      set({ pointer: null });
      return;
    }
    set({ pointer: { x, y } });
  },
  setHovered: (rowChildId, colChildId) => set({ hovered: { rowChildId, colChildId } }),
  clearHovered: () => set({ hovered: null }),
  endDrag: () => set({ draggingGameId: null, pointer: null, hovered: null }),
}));
