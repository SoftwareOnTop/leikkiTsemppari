import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Child, Game, PlaySession } from '../state/usePlayGridStore';

type Props = {
  children: Child[];
  games: Game[];
  sessions: PlaySession[];
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
  children,
  games,
  sessions,
  selectedGameId,
  onCellPress,
  headerTitle = 'Leikkiruudukko',
}: Props) {
  const { width, height } = useWindowDimensions();

  const isTablet = Math.max(width, height) >= 900;
  const usableWidth = width;

  const targetVisibleCols = isTablet ? 10 : 6;

  const cellSize = useMemo(() => {
    const columns = Math.max(1, Math.min(children.length, targetVisibleCols));
    const approx = Math.floor((usableWidth - 120) / (columns + 1));
    return Math.max(CELL_MIN_DP, approx);
  }, [children.length, targetVisibleCols, usableWidth]);

  const headerSize = useMemo(() => Math.max(96, Math.floor(cellSize * 1.6)), [cellSize]);

  const gamesById = useMemo(() => new Map(games.map((g) => [g.id, g])), [games]);

  const pairCounts = useMemo(() => {
    const map = new Map<PairKey, number>();
    for (const s of sessions) {
      const key = pairKey(s.child_a_id, s.child_b_id);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [sessions]);

  const pairTopGame = useMemo(() => {
    const map = new Map<PairKey, string>();
    for (const s of sessions) {
      const key = pairKey(s.child_a_id, s.child_b_id);
      if (!map.has(key)) map.set(key, s.game_id);
    }
    return map;
  }, [sessions]);

  const topHeaderRef = useRef<ScrollView>(null);
  const leftHeaderRef = useRef<ScrollView>(null);
  const bodyHRef = useRef<ScrollView>(null);
  const bodyVRef = useRef<ScrollView>(null);

  const syncing = useRef({ fromBodyH: false, fromBodyV: false, fromTopH: false, fromLeftV: false });

  const [scrollEnabled, setScrollEnabled] = useState(true);

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

  const handleCellPress = useCallback(
    (rowChildId: string, colChildId: string) => {
      if (!selectedGameId) return;
      if (rowChildId === colChildId) return;
      const key = pairKey(rowChildId, colChildId);
      const count = pairCounts.get(key) ?? 0;
      if (count >= 2) return;
      onCellPress?.({ rowChildId, colChildId, gameId: selectedGameId });
    },
    [onCellPress, pairCounts, selectedGameId]
  );

  const renderCell = useCallback(
    (rowChildId: string, colChildId: string) => {
      if (rowChildId === colChildId) {
        return <View style={[styles.cell, { width: cellSize, height: cellSize }]} />;
      }

      const key = pairKey(rowChildId, colChildId);
      const count = pairCounts.get(key) ?? 0;
      const topGameId = pairTopGame.get(key);
      const gameForCell = (topGameId && gamesById.get(topGameId)) || selectedGame;

      const baseColor = gameForCell?.color ?? '#999999';
      const bg = count === 0 ? 'transparent' : count === 1 ? withAlpha(baseColor, 0.25) : baseColor;

      const locked = count >= 2;
      const showDot = count === 1;
      const showEmoji = count >= 2 && !!gameForCell?.emoji;

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
              opacity: locked ? 0.9 : 1,
            },
          ]}
        >
          {showDot ? <View style={styles.dot} /> : null}
          {showEmoji ? <Text style={styles.emoji}>{gameForCell?.emoji}</Text> : null}
        </Pressable>
      );
    },
    [cellSize, gamesById, handleCellPress, pairCounts, pairTopGame, selectedGame]
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{headerTitle}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {selectedGame ? `Valittu peli: ${selectedGame.emoji} ${selectedGame.name}` : 'Valitse peli alhaalta'}
        </Text>
      </View>

      <View style={styles.gridFrame}>
        {/* Left pinned column */}
        <View style={{ width: headerSize }}>
          <View style={[styles.cornerCell, { width: headerSize, height: cellSize }]} />
          <ScrollView
            ref={leftHeaderRef}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              syncBodyVFromLeft(e.nativeEvent.contentOffset.y)
            }
            scrollEventThrottle={16}
          >
            {children.map((c) => (
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
          {/* Top pinned row */}
          <ScrollView
            ref={topHeaderRef}
            horizontal
            scrollEnabled={scrollEnabled}
            showsHorizontalScrollIndicator={false}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              syncBodyHFromTop(e.nativeEvent.contentOffset.x)
            }
            scrollEventThrottle={16}
          >
            <View style={{ flexDirection: 'row' }}>
              {children.map((c) => (
                <View key={c.id} style={[styles.headerCell, { width: cellSize, height: cellSize }]}>
                  <Text style={styles.headerText} numberOfLines={1}>
                    {c.name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Body (2D scroll: horizontal + vertical) */}
          <ScrollView
            ref={bodyHRef}
            horizontal
            scrollEnabled={scrollEnabled}
            showsHorizontalScrollIndicator
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
              syncTopFromBody(e.nativeEvent.contentOffset.x)
            }
            scrollEventThrottle={16}
          >
            <ScrollView
              ref={bodyVRef}
              scrollEnabled={scrollEnabled}
              showsVerticalScrollIndicator
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                syncLeftFromBody(e.nativeEvent.contentOffset.y)
              }
              scrollEventThrottle={16}
              onScrollBeginDrag={() => {
                if (Platform.OS === 'web') return;
                setScrollEnabled(true);
              }}
            >
              <View style={{ flexDirection: 'column' }}>
                {children.map((row) => (
                  <View key={row.id} style={{ flexDirection: 'row' }}>
                    {children.map((col) => renderCell(row.id, col.id))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
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
