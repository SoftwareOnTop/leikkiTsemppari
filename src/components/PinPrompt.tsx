import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
};

export function PinPrompt({
  visible,
  onClose,
  onSubmit,
  title = 'Admin PIN',
  subtitle = 'Syötä 4-numeroinen PIN',
  confirmLabel = 'Avaa',
}: Props) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!visible) setPin('');
  }, [visible]);

  const masked = useMemo(() => '•'.repeat(pin.length), [pin.length]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <TextInput
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            style={styles.input}
            placeholder={masked.length ? masked : '••••'}
          />

          <View style={styles.row}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Peruuta</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (pin.length === 4) onSubmit(pin);
              }}
              style={[styles.btn, pin.length === 4 ? styles.btnPrimary : styles.btnDisabled]}
            >
              <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  card: { width: '88%', maxWidth: 420, backgroundColor: 'white', borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { marginTop: 4, opacity: 0.7 },
  input: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 6,
    minHeight: 48,
  },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 14 },
  btn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: 'rgba(0,0,0,0.06)' },
  btnGhostText: { fontWeight: '700' },
  btnPrimary: { backgroundColor: 'black' },
  btnDisabled: { backgroundColor: 'rgba(0,0,0,0.25)' },
  btnPrimaryText: { color: 'white', fontWeight: '800' },
});
