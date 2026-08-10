import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  peerId: string;
  onCancel: () => void;
  onConnect: (password?: string) => void;
};

export function ConnectPasswordModal({ visible, peerId, onCancel, onConnect }: Props) {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible) setPassword('');
  }, [visible, peerId]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Conectar</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            ID {peerId}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.bg,
              },
            ]}
            placeholder="Contraseña (opcional)"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => onConnect(password.trim() || undefined)}
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.secondaryBtn}>
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => onConnect(password.trim() || undefined)}
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
              <Text style={styles.primaryText}>Conectar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 15, letterSpacing: 2, fontVariant: ['tabular-nums'] },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  secondaryBtn: { paddingVertical: 12, paddingHorizontal: 14 },
  secondaryText: { fontWeight: '600', fontSize: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
