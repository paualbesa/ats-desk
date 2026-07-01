import { GlassButton } from '@/src/components/GlassButton';
import { GlassCard } from '@/src/components/GlassCard';
import { DeskConfig } from '@/src/config/desk';
import { useAuth } from '@/src/services/auth';
import { AlbesaColors } from '@/src/theme/albesa';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: 100 }]}>
      <Text style={styles.title}>Ajustes</Text>
      <View style={styles.pad}>
        <GlassCard>
          <Text style={styles.label}>Cuenta</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </GlassCard>
        <GlassCard style={{ marginTop: 12 }}>
          <Text style={styles.label}>Infraestructura ATS Desk</Text>
          <Text style={styles.meta}>ID server: {DeskConfig.rendezvousServer}</Text>
          <Text style={styles.meta}>Relay: {DeskConfig.relayServer}</Text>
        </GlassCard>
        <GlassButton label="Cerrar sesión" onPress={onLogout} variant="ghost" style={{ marginTop: 24 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AlbesaColors.bgDark },
  title: {
    color: AlbesaColors.text,
    fontSize: 26,
    fontWeight: '800',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  pad: { paddingHorizontal: 18 },
  label: { color: AlbesaColors.textSecondary, fontSize: 13, marginBottom: 6 },
  value: { color: AlbesaColors.text, fontSize: 17, fontWeight: '600' },
  meta: { color: AlbesaColors.textSecondary, fontSize: 13, marginTop: 4 },
});
