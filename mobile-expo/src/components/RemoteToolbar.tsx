import { AlbesaColors } from '@/src/theme/albesa';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export type TouchMode = 'touch' | 'mouse';
export type ZoomMode = 'fit' | '100' | '150';

type Props = {
  touchMode: TouchMode;
  onTouchModeChange: (m: TouchMode) => void;
  zoom: ZoomMode;
  onZoomChange: (z: ZoomMode) => void;
  onKeyboard: () => void;
  onDisconnect: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
};

export function RemoteToolbar({
  touchMode,
  onTouchModeChange,
  zoom,
  onZoomChange,
  onKeyboard,
  onDisconnect,
  expanded,
  onToggleExpand,
}: Props) {
  const cycleZoom = () => {
    const order: ZoomMode[] = ['fit', '100', '150'];
    const i = order.indexOf(zoom);
    onZoomChange(order[(i + 1) % order.length]);
    Haptics.selectionAsync();
  };

  const ToolbarInner = () => (
    <View style={styles.row}>
      <Tool
        icon={touchMode === 'touch' ? 'hand-left' : 'navigate'}
        label={touchMode === 'touch' ? 'Táctil' : 'Ratón'}
        active
        onPress={() => {
          onTouchModeChange(touchMode === 'touch' ? 'mouse' : 'touch');
          Haptics.selectionAsync();
        }}
      />
      <Tool icon="search" label={`Zoom ${zoom === 'fit' ? 'Auto' : zoom + '%'}`} onPress={cycleZoom} />
      <Tool icon="keypad" label="Teclado" onPress={onKeyboard} />
      <Tool icon="close-circle" label="Salir" danger onPress={onDisconnect} />
      <Pressable onPress={onToggleExpand} style={styles.chevron}>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-up'}
          size={18}
          color={AlbesaColors.textSecondary}
        />
      </Pressable>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.bar}>
        <ToolbarInner />
      </View>
    );
  }

  return (
    <BlurView intensity={55} tint="dark" style={styles.bar}>
      <ToolbarInner />
    </BlurView>
  );
}

function Tool({
  icon,
  label,
  onPress,
  active,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tool, active && styles.toolActive]}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? AlbesaColors.danger : active ? AlbesaColors.accent : AlbesaColors.text}
      />
      <Text style={[styles.toolLabel, danger && { color: AlbesaColors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 28 : 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AlbesaColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tool: { alignItems: 'center', minWidth: 64, paddingVertical: 4 },
  toolActive: {},
  toolLabel: { color: AlbesaColors.textSecondary, fontSize: 10, marginTop: 4, fontWeight: '600' },
  chevron: { padding: 8 },
});
