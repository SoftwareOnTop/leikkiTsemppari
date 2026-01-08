import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSessionStore } from '../../src/state/useSessionStore';

export default function SignInScreen() {
  const session = useSessionStore((s) => s.session);
  const envMissing = useSessionStore((s) => s.envMissing);
  const signInWithPassword = useSessionStore((s) => s.signInWithPassword);
  const signUpWithPassword = useSessionStore((s) => s.signUpWithPassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/(app)" />;

  if (envMissing) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Leikkitsemppari</Text>
        <Text style={styles.subtitle}>Supabase puuttuu</Text>
        <Text style={{ opacity: 0.75, lineHeight: 20 }}>
          Luo tiedosto mobile/.env ja lisää:
          {'\n'}EXPO_PUBLIC_SUPABASE_URL
          {'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Leikkitsemppari</Text>
      <Text style={styles.subtitle}>Kirjaudu opettajana</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Salasana"
        secureTextEntry
        style={styles.input}
      />

      <Pressable
        style={[styles.btn, styles.btnPrimary, busy ? styles.btnDisabled : null]}
        disabled={busy}
        onPress={async () => {
          try {
            setBusy(true);
            await signInWithPassword(email.trim(), password);
          } catch (e: any) {
            Alert.alert('Kirjautuminen epäonnistui', e?.message ?? 'Tuntematon virhe');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.btnPrimaryText}>Kirjaudu</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnGhost, busy ? styles.btnDisabled : null]}
        disabled={busy}
        onPress={async () => {
          try {
            setBusy(true);
            await signUpWithPassword(email.trim(), password);
            Alert.alert('Tili luotu', 'Voit nyt kirjautua sisään.');
          } catch (e: any) {
            Alert.alert('Rekisteröinti epäonnistui', e?.message ?? 'Tuntematon virhe');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.btnGhostText}>Luo tili</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { opacity: 0.7, marginBottom: 10 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  btn: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: 'black' },
  btnPrimaryText: { color: 'white', fontWeight: '800' },
  btnGhost: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnGhostText: { fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
});
