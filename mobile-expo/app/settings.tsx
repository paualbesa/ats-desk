import { SquircleGlass } from '@/src/components/SquircleGlass';
import { DeskConfig } from '@/src/config/desk';
import { useDeskServerStatus } from '@/src/hooks/useDeskServerStatus';
import { useAuth } from '@/src/services/auth';
import { accentForOnline, AlbesaColors, AlbesaRadius } from '@/src/theme/albesa';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PORTS = ['21115/tcp', '21116/tcp+udp', '21117/tcp', '21118/tcp', '21119/tcp'];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { online, wsOnline, refresh } = useDeskServerStatus();

  const accent = accentForOnline(online);

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={AlbesaColors.text} />
        </Pressable>
        <Text style={styles.title}>Ajustes</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.pad}>
        <SquircleGlass online={online} style={styles.card}>
          <Text style={styles.label}>Cuenta</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </SquircleGlass>

        <SquircleGlass online={online} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Servidor ATS Desk</Text>
            <Pressable onPress={refresh}>
              <Ionicons name="refresh" size={18} color={accent} />
            </Pressable>
          </View>
          <Text style={[styles.status, { color: accent }]}>
            {online ? (wsOnline ? 'En línea (ID + WebSocket)' : 'En línea (ID; WS directo :21118)') : 'Sin conexión'}
          </Text>
          <Text style={styles.meta}>ID · {DeskConfig.rendezvousServer}</Text>
          <Text style={styles.meta}>Relay · {DeskConfig.relayServer}</Text>
        </SquircleGlass>

        <SquircleGlass online={online} style={styles.card}>
          <Text style={styles.label}>Puertos requeridos (firewall)</Text>
          {PORTS.map((p) => (
            <Text key={p} style={styles.meta}>
              · {p}
            </Text>
          ))}
          <Text style={[styles.hint, { marginTop: 10 }]}>
            DNS: desk.albesa.tech → IP pública (solo DNS, nube gris en Cloudflare). No uses el túnel CF para RustDesk.
          </Text>
        </SquircleGlass>

        <Pressable onPress={onLogout} style={[styles.logout, { borderColor: accent }]}>
          <Text style={[styles.logoutText, { color: accent }]}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AlbesaColors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: AlbesaColors.text },
  pad: { padding: 18, paddingBottom: 40 },
  card: { padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: AlbesaColors.textSecondary, fontSize: 13, marginBottom: 6 },
  value: { color: AlbesaColors.text, fontSize: 17, fontWeight: '600' },
  status: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  meta: { color: AlbesaColors.textSecondary, fontSize: 13, marginTop: 4 },
  hint: { color: AlbesaColors.textTertiary, fontSize: 12, lineHeight: 17 },
  logout: {
    marginTop: 20,
    padding: 16,
    borderRadius: AlbesaRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  logoutText: { fontWeight: '700', fontSize: 16 },
});
