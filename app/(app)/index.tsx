import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { Lock, LogOut } from 'lucide-react-native';

import { useSessionStore } from '../../src/state/useSessionStore';
import { useAppDataStore } from '../../src/state/useAppDataStore';
import { usePlayGridStore } from '../../src/state/usePlayGridStore';
import { PlayGrid } from '../../src/components/PlayGrid';
import { GameTray } from '../../src/components/GameTray';
import { PinPrompt } from '../../src/components/PinPrompt';
import { AdminPanel } from '../../src/components/AdminPanel';
import { BottomSheet } from '../../src/components/BottomSheet';
import { DragOverlay } from '../../src/components/DragOverlay';
import { useDragStore } from '../../src/state/useDragStore';

export default function GridScreen() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.max(width, height) >= 900;

  const session = useSessionStore((s) => s.session);
  const signOut = useSessionStore((s) => s.signOut);

  const { children, games, sessions, assignments, pinCode, refreshAll, upsertPairAssignment } = useAppDataStore();

  const selectedGameId = usePlayGridStore((s) => s.selectedGameId);
  const setSelectedGameId = usePlayGridStore((s) => s.setSelectedGameId);

  const [pinVisible, setPinVisible] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const hasEnoughGrid = children.length >= 2 && games.length >= 1;

  const rowChildren = useMemo(() => children.filter((c) => c.axis === 'row'), [children]);
  const colChildren = useMemo(() => children.filter((c) => c.axis === 'col'), [children]);

  const draggingGameId = useDragStore((s) => s.draggingGameId);
  const updatePointer = useDragStore((s) => s.updatePointer);
  const endDrag = useDragStore((s) => s.endDrag);

  const content = useMemo(() => {
    return (
      <View
        style={{ flex: 1 }}
        // Web: capture pointer move/up globally so the drag overlay follows the mouse everywhere.
        onPointerMove={
          Platform.OS === 'web'
            ? (e: any) => {
                if (!draggingGameId) return;
                const ne = e?.nativeEvent;
                const x = ne?.pageX ?? ne?.clientX;
                const y = ne?.pageY ?? ne?.clientY;
                if (typeof x === 'number' && typeof y === 'number') updatePointer(x, y);
              }
            : undefined
        }
        onPointerUp={
          Platform.OS === 'web'
            ? async () => {
                const state = useDragStore.getState();
                if (!state.draggingGameId) return;

                const hoveredNow = state.hovered;
                const gameId = state.draggingGameId;

                try {
                  if (hoveredNow) {
                    await upsertPairAssignment({
                      childAId: hoveredNow.rowChildId,
                      childBId: hoveredNow.colChildId,
                      gameId,
                    });
                  }
                } catch (e: any) {
                  Alert.alert('Tallennus epäonnistui', e?.message ?? 'Tuntematon virhe');
                  await refreshAll();
                } finally {
                  endDrag();
                }
              }
            : undefined
        }
      >
        <View style={styles.topBar}>
          <Text style={styles.brand}>Leikkitsemppari</Text>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => setPinVisible(true)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Admin"
            >
              <Lock size={20} color="black" />
            </Pressable>
            <Pressable
              onPress={async () => {
                await signOut();
              }}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={20} color="black" />
            </Pressable>
          </View>
        </View>

        {!hasEnoughGrid ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aloita admin-tilasta</Text>
            <Text style={styles.emptyBody}>Lisää vähintään 2 lasta ja 1 peli.</Text>
          </View>
        ) : (
          <PlayGrid
            rowChildren={rowChildren}
            colChildren={colChildren}
            games={games}
            sessions={sessions}
            assignments={assignments}
            selectedGameId={selectedGameId}
            onCellPress={async ({ rowChildId, colChildId, gameId }) => {
              try {
                await upsertPairAssignment({ childAId: rowChildId, childBId: colChildId, gameId });
              } catch (e: any) {
                Alert.alert('Tallennus epäonnistui', e?.message ?? 'Tuntematon virhe');
                await refreshAll();
              }
            }}
          />
        )}

        <GameTray
          games={games}
          selectedGameId={selectedGameId}
          onSelect={setSelectedGameId}
          onDropOnCell={async ({ rowChildId, colChildId, gameId }) => {
            try {
              await upsertPairAssignment({ childAId: rowChildId, childBId: colChildId, gameId });
            } catch (e: any) {
              Alert.alert('Tallennus epäonnistui', e?.message ?? 'Tuntematon virhe');
              await refreshAll();
            }
          }}
        />

        <DragOverlay games={games} />

        <PinPrompt
          visible={pinVisible}
          onClose={() => setPinVisible(false)}
          onSubmit={(pin) => {
            const expected = pinCode ?? '1234';
            if (pin !== expected) {
              Alert.alert('Väärä PIN', 'Yritä uudelleen.');
              return;
            }
            setPinVisible(false);
            setAdminUnlocked(true);
          }}
        />

        {!isTablet ? (
          <BottomSheet open={adminUnlocked} onClose={() => setAdminUnlocked(false)}>
            <AdminPanel onClose={() => setAdminUnlocked(false)} />
          </BottomSheet>
        ) : null}
      </View>
    );
  }, [adminUnlocked, children, rowChildren, colChildren, games, hasEnoughGrid, isTablet, pinCode, pinVisible, refreshAll, selectedGameId, setSelectedGameId, signOut, sessions, assignments, upsertPairAssignment, draggingGameId, updatePointer, endDrag]);

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  if (isTablet) {
    // Two-pane layout: settings left, grid right
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.tabletRow}>
          <View style={styles.leftPane}>
            <Text style={styles.paneTitle}>Asetukset</Text>
            <Text style={styles.paneHint}>Admin lukitus oikeasta yläkulmasta.</Text>
            <AdminPanel />
          </View>
          <View style={styles.rightPane}>{content}</View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile stack layout (settings is still accessible via lock, shown as overlay for now)
  return <SafeAreaView style={styles.root}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  brand: { fontWeight: '900', fontSize: 16 },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { marginTop: 6, opacity: 0.7 },

  tabletRow: { flex: 1, flexDirection: 'row' },
  leftPane: {
    width: 360,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'white',
  },
  rightPane: { flex: 1 },
  paneTitle: { fontSize: 16, fontWeight: '900', padding: 16, paddingBottom: 4 },
  paneHint: { opacity: 0.7, paddingHorizontal: 16, paddingBottom: 8 },
});
