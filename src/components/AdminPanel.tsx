import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppDataStore } from '../state/useAppDataStore';

export function AdminPanel({ onClose }: { onClose?: () => void }) {
  const { children, games, upsertChild, deleteChild, upsertGame, deleteGame, resetGrid } = useAppDataStore();

  const [newChildName, setNewChildName] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [newGameEmoji, setNewGameEmoji] = useState('🎲');
  const [newGameColor, setNewGameColor] = useState('#4F46E5');

  const [childEdits, setChildEdits] = useState<Record<string, string>>({});
  const [gameEdits, setGameEdits] = useState<Record<string, { name: string; emoji: string; color: string }>>({});

  const sortedChildren = useMemo(() => [...children].sort((a, b) => a.name.localeCompare(b.name)), [children]);
  const sortedGames = useMemo(() => [...games].sort((a, b) => a.name.localeCompare(b.name)), [games]);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.section}>
        <Text style={styles.h2}>Lapset</Text>

        <View style={styles.row}>
          <TextInput
            value={newChildName}
            onChangeText={setNewChildName}
            placeholder="Uusi lapsi"
            style={styles.input}
          />
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={async () => {
              if (!newChildName.trim()) return;
              await upsertChild({ name: newChildName.trim() });
              setNewChildName('');
            }}
          >
            <Text style={styles.btnPrimaryText}>Lisää</Text>
          </Pressable>
        </View>

        {sortedChildren.map((c) => (
          <View key={c.id} style={styles.itemRow}>
            <TextInput
              value={childEdits[c.id] ?? c.name}
              onChangeText={(t) => setChildEdits((prev) => ({ ...prev, [c.id]: t }))}
              style={[styles.input, { marginBottom: 0, flex: 1 }]}
            />
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={async () => {
                const name = (childEdits[c.id] ?? c.name).trim();
                if (!name) return;
                await upsertChild({ id: c.id, name });
              }}
            >
              <Text style={styles.btnPrimaryText}>Tallenna</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnDanger]}
              onPress={() =>
                Alert.alert('Poista lapsi?', c.name, [
                  { text: 'Peruuta', style: 'cancel' },
                  {
                    text: 'Poista',
                    style: 'destructive',
                    onPress: async () => {
                      await deleteChild(c.id);
                    },
                  },
                ])
              }
            >
              <Text style={styles.btnDangerText}>Poista</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Pelit</Text>

        <Text style={styles.label}>Nimi</Text>
        <TextInput value={newGameName} onChangeText={setNewGameName} placeholder="Uusi peli" style={styles.inputFull} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Emoji</Text>
            <TextInput value={newGameEmoji} onChangeText={(t) => setNewGameEmoji(t.slice(0, 2))} style={styles.input} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Väri (#RRGGBB)</Text>
            <TextInput value={newGameColor} onChangeText={setNewGameColor} style={styles.input} autoCapitalize="none" />
          </View>
        </View>

        <Pressable
          style={[styles.btn, styles.btnPrimary, { alignSelf: 'flex-start' }]}
          onPress={async () => {
            if (!newGameName.trim()) return;
            await upsertGame({ name: newGameName.trim(), emoji: newGameEmoji || '🎲', color: newGameColor || '#4F46E5' });
            setNewGameName('');
          }}
        >
          <Text style={styles.btnPrimaryText}>Lisää peli</Text>
        </Pressable>

        {sortedGames.map((g) => (
            <View key={g.id} style={{ gap: 10, paddingVertical: 8 }}>
              <View style={styles.row}>
                <TextInput
                  value={(gameEdits[g.id]?.emoji ?? g.emoji) || '🎲'}
                  onChangeText={(t) =>
                    setGameEdits((prev) => ({
                      ...prev,
                      [g.id]: {
                        name: prev[g.id]?.name ?? g.name,
                        emoji: t.slice(0, 2),
                        color: prev[g.id]?.color ?? g.color,
                      },
                    }))
                  }
                  style={[styles.input, { flex: 0.4 }]}
                />
                <TextInput
                  value={(gameEdits[g.id]?.name ?? g.name) || ''}
                  onChangeText={(t) =>
                    setGameEdits((prev) => ({
                      ...prev,
                      [g.id]: {
                        name: t,
                        emoji: prev[g.id]?.emoji ?? g.emoji,
                        color: prev[g.id]?.color ?? g.color,
                      },
                    }))
                  }
                  style={[styles.input, { flex: 1 }]}
                />
              </View>
              <View style={styles.row}>
                <TextInput
                  value={(gameEdits[g.id]?.color ?? g.color) || ''}
                  onChangeText={(t) =>
                    setGameEdits((prev) => ({
                      ...prev,
                      [g.id]: {
                        name: prev[g.id]?.name ?? g.name,
                        emoji: prev[g.id]?.emoji ?? g.emoji,
                        color: t,
                      },
                    }))
                  }
                  style={[styles.input, { flex: 1 }]}
                  autoCapitalize="none"
                />
                <Pressable
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={async () => {
                    const edit = gameEdits[g.id] ?? { name: g.name, emoji: g.emoji, color: g.color };
                    const name = edit.name.trim();
                    const emoji = (edit.emoji || g.emoji || '🎲').slice(0, 2);
                    const color = (edit.color || g.color || '#4F46E5').trim();
                    if (!name) return;
                    await upsertGame({ id: g.id, name, emoji, color });
                  }}
                >
                  <Text style={styles.btnPrimaryText}>Tallenna</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnDanger]}
                  onPress={() =>
                    Alert.alert('Poista peli?', g.name, [
                      { text: 'Peruuta', style: 'cancel' },
                      {
                        text: 'Poista',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteGame(g.id);
                        },
                      },
                    ])
                  }
                >
                  <Text style={styles.btnDangerText}>Poista</Text>
                </Pressable>
              </View>
            </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Ruudukko</Text>
        <Pressable
          style={[styles.btn, styles.btnDanger]}
          onPress={() =>
            Alert.alert('Nollaa ruudukko?', 'Poistaa kaikki leikkisessiot.', [
              { text: 'Peruuta', style: 'cancel' },
              {
                text: 'Nollaa',
                style: 'destructive',
                onPress: async () => {
                  await resetGrid();
                  onClose?.();
                },
              },
            ])
          }
        >
          <Text style={styles.btnDangerText}>Nollaa (poista sessiot)</Text>
        </Pressable>
      </View>

      {onClose ? (
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
          <Text style={styles.btnGhostText}>Sulje</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 18 },
  section: { gap: 10 },
  h2: { fontSize: 16, fontWeight: '800' },
  label: { fontSize: 12, opacity: 0.7 },

  row: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    flex: 1,
  },
  inputFull: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },

  itemRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemText: { fontSize: 14, fontWeight: '600', flex: 1 },

  btn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: 'black' },
  btnPrimaryText: { color: 'white', fontWeight: '800' },
  btnDanger: { backgroundColor: 'rgba(0,0,0,0.08)' },
  btnDangerText: { color: 'black', fontWeight: '800' },
  btnGhost: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnGhostText: { fontWeight: '800' },
});
