import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  findNodeHandle,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

import type { Child, Game, PlaySession } from '../state/usePlayGridStore';
import type { PairAssignment } from '../state/useAppDataStore';
import { useDragStore } from '../state/useDragStore';

type Props = {
  rowChildren: Child[];
  colChildren: Child[];
  games: Game[];
  sessions: PlaySession[];
  assignments?: PairAssignment[];
  selectedGameId: string | null;
  onCellPress?: (args: { rowChildId: string; colChildId: string; gameId: string }) => void;
  headerTitle?: string;
};

type PairKey = string;

function pairKey(aId: string, bId: string): PairKey {
  return aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
}

function withAlpha(color: string, alpha01: number): string {
  const alpha = Math.max(0, Math.min(1, alpha01));
  const aa = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return `${trimmed}${aa}`;
  if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) return `${trimmed.slice(0, 7)}${aa}`;
  return color;
}

const CELL_MIN_DP = 44;

export function PlayGrid({
  rowChildren,
  colChildren,
  games,
  sessions,
  assignments = [],
  selectedGameId,
  onCellPress,
  headerTitle = 'Leikkiruudukko',
}: Props) {
  const { width, height } = useWindowDimensions();

  const isTablet = Math.max(width, height) >= 900;
  const usableWidth = width;

  const targetVisibleCols = isTablet ? 10 : 6;

  const cellSize = useMemo(() => {
    const columns = Math.max(1, Math.min(colChildren.length, targetVisibleCols));
    const approx = Math.floor((usableWidth - 120) / (columns + 1));
    return Math.max(CELL_MIN_DP, approx);
  }, [colChildren.length, targetVisibleCols, usableWidth]);

  const headerSize = useMemo(() => Math.max(96, Math.floor(cellSize * 1.6)), [cellSize]);

  const gamesById = useMemo(() => new Map(games.map((g) => [g.id, g])), [games]);

  const assignmentByPair = useMemo(() => {
    const map = new Map<PairKey, string>();
    for (const a of assignments) {
      map.set(pairKey(a.child_a_id, a.child_b_id), a.game_id);
    }
    return map;
  }, [assignments]);

  const topHeaderRef = useRef<ScrollView>(null);
  const leftHeaderRef = useRef<ScrollView>(null);
  const bodyHRef = useRef<ScrollView>(null);
  const bodyVRef = useRef<ScrollView>(null);

  const syncing = useRef({ fromBodyH: false, fromBodyV: false, fromTopH: false, fromLeftV: false });

  const gridFrameRef = useRef<View>(null);
  const gridFrameWindow = useRef<{ x: number; y: number } | null>(null);
  const scrollX = useRef(0);
  const scrollY = useRef(0);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const draggingGameId = useDragStore((s) => s.draggingGameId);
  const pointer = useDragStore((s) => s.pointer);
  const hovered = useDragStore((s) => s.hovered);
  const setHovered = useDragStore((s) => s.setHovered);
  const clearHovered = useDragStore((s) => s.clearHovered);

  const syncTopFromBody = useCallback((x: number) => {
    if (syncing.current.fromTopH) return;
    syncing.current.fromBodyH = true;
    topHeaderRef.current?.scrollTo({ x, animated: false });
    syncing.current.fromBodyH = false;
  }, []);

  const syncBodyHFromTop = useCallback((x: number) => {
    if (syncing.current.fromBodyH) return;
    syncing.current.fromTopH = true;
    bodyHRef.current?.scrollTo({ x, animated: false });
    syncing.current.fromTopH = false;
  }, []);

  const syncLeftFromBody = useCallback((y: number) => {
    if (syncing.current.fromLeftV) return;
    syncing.current.fromBodyV = true;
    leftHeaderRef.current?.scrollTo({ y, animated: false });
    syncing.current.fromBodyV = false;
  }, []);

  const syncBodyVFromLeft = useCallback((y: number) => {
    if (syncing.current.fromBodyV) return;
    syncing.current.fromLeftV = true;
    bodyVRef.current?.scrollTo({ y, animated: false });
    syncing.current.fromLeftV = false;
  }, []);

  const selectedGame = selectedGameId ? gamesById.get(selectedGameId) : undefined;

  const measureGridFrame = useCallback(() => {
    const node = findNodeHandle(gridFrameRef.current);
    if (!node) return;
    UIManager.measureInWindow(node, (x, y) => {
      gridFrameWindow.current = { x, y };
    });
  }, []);

  const computeHover = useCallback(() => {
    if (!draggingGameId || !pointer) {
      clearHovered();
      return;
    }

    const origin = gridFrameWindow.current;
    if (!origin) {
      clearHovered();
      return;
    }

    const bodyX = origin.x + headerSize;
    const bodyY = origin.y + cellSize;
    const rx = pointer.x - bodyX;
    const ry = pointer.y - bodyY;
    if (rx < 0 || ry < 0) {
      clearHovered();
      return;
    }

    const contentX = rx + scrollX.current;
    const contentY = ry + scrollY.current;
    const colIndex = Math.floor(contentX / cellSize);
    const rowIndex = Math.floor(contentY / cellSize);

    if (rowIndex < 0 || colIndex < 0 || rowIndex >= rowChildren.length || colIndex >= colChildren.length) {
      clearHovered();
      return;
    }

    setHovered(rowChildren[rowIndex].id, colChildren[colIndex].id);
  }, [cellSize, clearHovered, colChildren, draggingGameId, headerSize, pointer, rowChildren, setHovered]);

  useEffect(() => {
    computeHover();
  }, [computeHover]);

  const handleCellPress = useCallback(
    (rowChildId: string, colChildId: string) => {
      if (!selectedGameId) return;
      if (rowChildId === colChildId) return;
      onCellPress?.({ rowChildId, colChildId, gameId: selectedGameId });
    },
    [onCellPress, selectedGameId]
  );

  const renderCell = useCallback(
    (rowChildId: string, colChildId: string) => {

      const key = pairKey(rowChildId, colChildId);
      const assignedGameId = assignmentByPair.get(key);
      const gameForCell = (assignedGameId && gamesById.get(assignedGameId)) || undefined;

      const baseColor = gameForCell?.color ?? 'transparent';
      const bg = gameForCell ? withAlpha(baseColor, 0.25) : 'transparent';

      const showEmoji = !!gameForCell?.emoji;

      const isHover = !!hovered && pairKey(hovered.rowChildId, hovered.colChildId) === key;

      return (
        <Pressable
          key={`${rowChildId}:${colChildId}`}
          onPress={() => handleCellPress(rowChildId, colChildId)}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              backgroundColor: bg,
              borderWidth: isHover ? 2 : StyleSheet.hairlineWidth,
              borderColor: isHover ? 'black' : 'rgba(0,0,0,0.12)',
            },
          ]}
        >
          {showEmoji ? (
            <Animated.Text
              // Key forces re-mount when game changes, so the enter/exit animations run.
              key={assignedGameId}
              entering={ZoomIn.duration(140).springify().damping(14)}
              exiting={ZoomOut.duration(110)}
              style={styles.emoji}
            >
              {gameForCell?.emoji}
            </Animated.Text>
          ) : null}
        </Pressable>
      );
    },
    [assignmentByPair, cellSize, gamesById, handleCellPress, hovered]
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{headerTitle}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {selectedGame ? `Valittu peli: ${selectedGame.emoji} ${selectedGame.name}` : 'Valitse peli alhaalta'}
        </Text>
      </View>

      <View
        ref={gridFrameRef}
        style={styles.gridFrame}
        onLayout={() => {
          // Measure absolute position so we can hit-test drag pointer.
          measureGridFrame();
        }}
      >
        {/* Left pinned column */}
        <View style={{ width: headerSize }}>
          <View style={[styles.cornerCell, { width: headerSize, height: cellSize }]} />
          <ScrollView
            ref={leftHeaderRef}
            style={{ flex: 1 }}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              syncBodyVFromLeft(e.nativeEvent.contentOffset.y)
            }
            scrollEventThrottle={16}
          >
            {rowChildren.map((c) => (
              <View
                key={c.id}
                style={[styles.headerCell, { width: headerSize, height: cellSize, justifyContent: 'center' }]}
              >
                <Text style={styles.headerText} numberOfLines={1}>
                  {c.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Right scrollable area */}
        <View style={{ flex: 1 }}>
          {/* Top pinned row (fixed height so body starts immediately below) */}
          <View style={{ height: cellSize }}>
            <ScrollView
              ref={topHeaderRef}
              horizontal
              scrollEnabled={scrollEnabled}
              showsHorizontalScrollIndicator={false}
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                syncBodyHFromTop(e.nativeEvent.contentOffset.x)
              }
              scrollEventThrottle={16}
              style={{ height: cellSize }}
              contentContainerStyle={{ height: cellSize }}
            >
              <View style={{ flexDirection: 'row' }}>
                {colChildren.map((c) => (
                  <View
                    key={c.id}
                    style={[styles.headerCell, { width: cellSize, height: cellSize, justifyContent: 'center' }]}
                  >
                    <Text style={styles.headerText} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Body (2D scroll: horizontal + vertical) */}
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={bodyHRef}
              horizontal
              scrollEnabled={scrollEnabled}
              showsHorizontalScrollIndicator
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                scrollX.current = e.nativeEvent.contentOffset.x;
                syncTopFromBody(e.nativeEvent.contentOffset.x);
              }}
              scrollEventThrottle={16}
            >
              <ScrollView
                ref={bodyVRef}
                scrollEnabled={scrollEnabled}
                showsVerticalScrollIndicator
                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  scrollY.current = e.nativeEvent.contentOffset.y;
                  syncLeftFromBody(e.nativeEvent.contentOffset.y);
                }}
                scrollEventThrottle={16}
                onScrollBeginDrag={() => {
                  if (Platform.OS === 'web') return;
                  setScrollEnabled(true);
                }}
              >
                <View style={{ flexDirection: 'column' }}>
                  {rowChildren.map((row) => (
                    <View key={row.id} style={{ flexDirection: 'row' }}>
                      {colChildren.map((col) => renderCell(row.id, col.id))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, opacity: 0.7, marginTop: 2 },

  gridFrame: { flex: 1, flexDirection: 'row' },

  cornerCell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },

  headerCell: {
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },

  headerText: { fontSize: 12, fontWeight: '600' },

  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  emoji: { fontSize: 18 },
});
