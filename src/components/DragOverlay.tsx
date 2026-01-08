import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Game } from '../state/usePlayGridStore';
import { useDragStore } from '../state/useDragStore';

type Props = {
  games: Game[];
};

export function DragOverlay({ games }: Props) {
  const draggingGameId = useDragStore((s) => s.draggingGameId);
  const pointer = useDragStore((s) => s.pointer);

  const game = useMemo(() => games.find((g) => g.id === draggingGameId) ?? null, [draggingGameId, games]);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!game) {
      opacity.value = withTiming(0, { duration: 90 });
      return;
    }
    opacity.value = withTiming(1, { duration: 80 });
  }, [game, opacity]);

  useEffect(() => {
    if (!pointer) return;
    x.value = pointer.x - 24;
    y.value = pointer.y - 24;
  }, [pointer, x, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 }],
  }));

  if (!game) return null;

  // Overlay is mainly for web smoothness; native already uses gesture-driven UX.
  // But it also works fine on native.
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.bubble, style]}>
        <View style={[styles.chip, { backgroundColor: game.color }]}> 
          <Text style={styles.emoji}>{game.emoji}</Text>
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {game.name}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22, color: 'white' },
  label: {
    maxWidth: 180,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    borderRadius: 999,
  },
});
