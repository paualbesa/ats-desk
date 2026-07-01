import { AlbesaColors } from '@/src/theme/albesa';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GlassButton } from './GlassButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSendText: (text: string) => void;
  onSendKey: (key: string) => void;
};

const SPECIAL_KEYS = [
  { label: 'Ctrl+Alt+Supr', key: 'CtrlAltDel' },
  { label: 'Win', key: 'Meta' },
  { label: 'Tab', key: 'Tab' },
  { label: 'Esc', key: 'Escape' },
  { label: 'Enter', key: 'Enter' },
  { label: 'Backspace', key: 'Backspace' },
];

export function RemoteKeyboardSheet({ visible, onClose, onSendText, onSendKey }: Props) {
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    onSendText(text);
    setText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Teclado remoto</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe para enviar al equipo remoto…"
          placeholderTextColor={AlbesaColors.textSecondary}
          value={text}
          onChangeText={setText}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <GlassButton label="Enviar texto" onPress={send} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.keysRow}>
          {SPECIAL_KEYS.map((k) => (
            <Pressable
              key={k.key}
              style={styles.keyChip}
              onPress={() => {
                Haptics.selectionAsync();
                onSendKey(k.key);
              }}
            >
              <Text style={styles.keyChipText}>{k.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable style={styles.closeRow} onPress={onClose}>
          <Ionicons name="chevron-down" size={20} color={AlbesaColors.textSecondary} />
          <Text style={styles.closeText}>Cerrar</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AlbesaColors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: AlbesaColors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AlbesaColors.border,
    marginBottom: 12,
  },
  title: { color: AlbesaColors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: AlbesaColors.surface,
    borderRadius: 14,
    padding: 14,
    color: AlbesaColors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
  },
  keysRow: { marginTop: 14, marginBottom: 8 },
  keyChip: {
    backgroundColor: AlbesaColors.accentGlass,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(232,118,46,0.35)',
  },
  keyChipText: { color: AlbesaColors.accentLight, fontWeight: '600', fontSize: 13 },
  closeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  closeText: { color: AlbesaColors.textSecondary },
});
