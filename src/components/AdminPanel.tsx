import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppDataStore } from '../state/useAppDataStore';
import { PinPrompt } from './PinPrompt';

export function AdminPanel({ onClose }: { onClose?: () => void }) {
  const {
    children,
    games,
    pinCode,
    updatePinCode,
    upsertChild,
    deleteChild,
    upsertGame,
    deleteGame,
    resetGrid,
    resetAllChildren,
  } = useAppDataStore();

  const [newChildName, setNewChildName] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [newGameEmoji, setNewGameEmoji] = useState('🎲');
  const [newGameColor, setNewGameColor] = useState('#4F46E5');

  const [childEdits, setChildEdits] = useState<Record<string, string>>({});
  const [gameEdits, setGameEdits] = useState<Record<string, { name: string; emoji: string; color: string }>>({});
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const sortedChildren = useMemo(
    () =>
      [...children].sort((a, b) =>
        a.axis === b.axis ? a.name.localeCompare(b.name) : a.axis === 'row' ? -1 : 1
      ),
    [children]
  );
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
            <View style={{ width: 58 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', opacity: 0.75 }}>{c.axis === 'row' ? 'Pysty' : 'Vaaka'}</Text>
            </View>
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
            Alert.alert('Poista leikit ruudukosta?', 'Poistaa kaikki ruutuihin asetetut leikit ja historian.', [
              { text: 'Peruuta', style: 'cancel' },
              {
                text: 'Poista',
                style: 'destructive',
                onPress: async () => {
                  await resetGrid();
                  onClose?.();
                },
              },
            ])
          }
        >
          <Text style={styles.btnDangerText}>Poista leikit ruudukosta</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnDanger]}
          onPress={() =>
            Alert.alert('Nollaa nimet ja taulukko?', 'Poistaa kaikki lapset (nimet) ja koko taulukon sisällön.', [
              { text: 'Peruuta', style: 'cancel' },
              {
                text: 'Nollaa',
                style: 'destructive',
                onPress: async () => {
                  await resetAllChildren();
                  onClose?.();
                },
              },
            ])
          }
        >
          <Text style={styles.btnDangerText}>Nollaa nimet ja taulukko</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Admin PIN</Text>
        <Text style={styles.label}>
          {pinCode ? 'PIN on asetettu.' : 'PIN ei ole asetettu. Oletus-PIN: 1234.'}
        </Text>
        <Pressable style={[styles.btn, styles.btnPrimary, { alignSelf: 'flex-start' }]} onPress={() => setPinModalVisible(true)}>
          <Text style={styles.btnPrimaryText}>{pinCode ? 'Vaihda PIN' : 'Aseta PIN'}</Text>
        </Pressable>
      </View>

      {onClose ? (
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
          <Text style={styles.btnGhostText}>Sulje</Text>
        </Pressable>
      ) : null}

      <PinPrompt
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        title={pinCode ? 'Vaihda PIN' : 'Aseta PIN'}
        subtitle="Syötä uusi 4-numeroinen PIN"
        confirmLabel="Tallenna"
        onSubmit={async (pin) => {
          try {
            await updatePinCode(pin);
            setPinModalVisible(false);
            Alert.alert('PIN vaihdettu', 'Uusi PIN on tallennettu.');
          } catch (e: any) {
            Alert.alert('PINin vaihto epäonnistui', e?.message ?? 'Tuntematon virhe');
          }
        }}
      />
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
