import { SquircleGlass } from '@/src/components/SquircleGlass';
import { DeskConfig } from '@/src/config/desk';
import { clearDeskWebRelayCache, resolveDeskWebRelayHost } from '@/src/config/deskWs';
import { useDeskServerStatus } from '@/src/hooks/useDeskServerStatus';
import { useAuth } from '@/src/services/auth';
import { AlbesaRadius } from '@/src/theme/albesa';
import { useTheme, type ThemeMode } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'light', label: 'Claro', icon: 'sunny-outline' },
  { key: 'dark', label: 'Oscuro', icon: 'moon-outline' },
  { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { online, wsOnline, lastCheck, refresh } = useDeskServerStatus();
  const { colors, accent, mode, setMode } = useTheme();

  const accentColor = accent(online);

  const [relayHost, setRelayHost] = useState<string | null>(null);
  useEffect(() => {
    clearDeskWebRelayCache();
    resolveDeskWebRelayHost()
      .then(setRelayHost)
      .catch(() => setRelayHost(null));
  }, [lastCheck]);

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad}>
        {user ? (
          <Animated.View entering={FadeInDown.delay(30)}>
            <SquircleGlass online={online} style={styles.card} padding={16}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Cuenta</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
            </SquircleGlass>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(60)}>
          <SquircleGlass online={online} style={styles.card} padding={16}>
            <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 12 }]}>
              Apariencia
            </Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = mode === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode(opt.key);
                    }}
                    style={[
                      styles.themeChip,
                      {
                        borderColor: active ? accentColor : colors.border,
                        backgroundColor: active ? colors.accentGlass : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={active ? accentColor : colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: active ? accentColor : colors.textSecondary,
                        fontWeight: active ? '700' : '500',
                        fontSize: 13,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SquircleGlass>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90)}>
          <SquircleGlass online={online} style={styles.card} padding={16}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Servidor ATS Desk</Text>
              <Pressable onPress={refresh}>
                <Ionicons name="refresh" size={18} color={accentColor} />
              </Pressable>
            </View>
            <Text style={[styles.status, { color: accentColor }]}>
              {online
                ? wsOnline
                  ? 'En línea'
                  : 'En línea (ID)'
                : 'Sin conexión'}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              ID (hbbs) · {DeskConfig.rendezvousServer} · {online ? 'accesible' : 'sin respuesta'}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              WebSocket · {wsOnline ? 'accesible' : 'sin respuesta'}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Relay · {DeskConfig.relayServer}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Host relay web · {relayHost ?? '…'}
            </Text>
          </SquircleGlass>
        </Animated.View>

        {user ? (
          <Animated.View entering={FadeInDown.delay(120)}>
            <Pressable
              onPress={onLogout}
              style={[styles.logout, { borderColor: accentColor }]}
            >
              <Text style={[styles.logoutText, { color: accentColor }]}>Cerrar sesión</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  pad: { padding: 18, paddingBottom: 40 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, marginBottom: 6 },
  value: { fontSize: 17, fontWeight: '600' },
  status: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  meta: { fontSize: 13, marginTop: 4 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: AlbesaRadius.md,
    borderWidth: 1.5,
  },
  logout: {
    marginTop: 20,
    padding: 16,
    borderRadius: AlbesaRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  logoutText: { fontWeight: '700', fontSize: 16 },
});
