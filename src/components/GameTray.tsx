import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Game } from '../state/usePlayGridStore';

type Props = {
  games: Game[];
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
};

export function GameTray({ games, selectedGameId, onSelect }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {games.map((g) => {
          const selected = g.id === selectedGameId;
          return (
            <Pressable
              key={g.id}
              onPress={() => onSelect(g.id)}
              style={[styles.chip, { backgroundColor: selected ? g.color : 'rgba(0,0,0,0.06)' }]}
            >
              <Text style={[styles.emoji, { opacity: selected ? 1 : 0.9 }]}>{g.emoji}</Text>
              <Text style={[styles.name, { color: selected ? 'white' : 'black' }]} numberOfLines={1}>
                {g.name}
              </Text>
            </Pressable>
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
