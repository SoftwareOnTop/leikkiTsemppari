import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  PanGestureHandler,
  State,
  type HandlerStateChangeEvent,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

import type { Game } from '../state/usePlayGridStore';
import { useDragStore } from '../state/useDragStore';

type Props = {
  games: Game[];
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
  onDropOnCell?: (args: { rowChildId: string; colChildId: string; gameId: string }) => void;
};

export function GameTray({ games, selectedGameId, onSelect, onDropOnCell }: Props) {
  const startDrag = useDragStore((s) => s.startDrag);
  const updatePointer = useDragStore((s) => s.updatePointer);
  const endDrag = useDragStore((s) => s.endDrag);

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {games.map((g) => {
          const selected = g.id === selectedGameId;

          // Web: use pointer events (PanGestureHandler isn't consistently mouse-friendly across browsers).
          if (Platform.OS === 'web') {
            return (
              <View key={g.id} style={{ alignSelf: 'flex-start' }}>
                <Pressable
                  onPress={() => onSelect(g.id)}
                  onPressIn={(e) => {
                    onSelect(g.id);
                    startDrag(g.id);
                    // RN web press events usually expose pageX/pageY.
                    const ne: any = e?.nativeEvent;
                    const x = ne?.pageX ?? ne?.clientX;
                    const y = ne?.pageY ?? ne?.clientY;
                    if (typeof x === 'number' && typeof y === 'number') updatePointer(x, y);
                  }}
                  onPressOut={() => {
                    const hoveredNow = useDragStore.getState().hovered;
                    if (hoveredNow && onDropOnCell) {
                      onDropOnCell({ rowChildId: hoveredNow.rowChildId, colChildId: hoveredNow.colChildId, gameId: g.id });
                    }
                    endDrag();
                  }}
                  style={[styles.chip, { backgroundColor: selected ? g.color : 'rgba(0,0,0,0.06)' }]}
                >
                  <Text style={[styles.emoji, { opacity: selected ? 1 : 0.9 }]}>{g.emoji}</Text>
                  <Text style={[styles.name, { color: selected ? 'white' : 'black' }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                </Pressable>
              </View>
            );
          }

          const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
            const x = event.nativeEvent.absoluteX;
            const y = event.nativeEvent.absoluteY;
            updatePointer(x, y);
          };

          const onHandlerStateChange = (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
            const x = event.nativeEvent.absoluteX;
            const y = event.nativeEvent.absoluteY;

            if (event.nativeEvent.state === State.BEGAN) {
              onSelect(g.id);
              startDrag(g.id);
              updatePointer(x, y);
              return;
            }

            if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
              // Drop: only one target cell.
              const hoveredNow = useDragStore.getState().hovered;
              if (hoveredNow && onDropOnCell) {
                onDropOnCell({
                  rowChildId: hoveredNow.rowChildId,
                  colChildId: hoveredNow.colChildId,
                  gameId: g.id,
                });
              }

              endDrag();
            }
          };

          return (
            <PanGestureHandler key={g.id} onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
              <View style={{ alignSelf: 'flex-start' }}>
                <Pressable
                  onPress={() => onSelect(g.id)}
                  style={[styles.chip, { backgroundColor: selected ? g.color : 'rgba(0,0,0,0.06)' }]}
                >
                  <Text style={[styles.emoji, { opacity: selected ? 1 : 0.9 }]}>{g.emoji}</Text>
                  <Text style={[styles.name, { color: selected ? 'white' : 'black' }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                </Pressable>
              </View>
            </PanGestureHandler>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'white',
  },
  row: {
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    minHeight: 44,
  },
  emoji: { fontSize: 18 },
  name: { fontSize: 14, fontWeight: '700', maxWidth: 140 },
});
