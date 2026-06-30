import { AnimatedEntrance } from '@/src/components/AnimatedEntrance';
import { GlassButton } from '@/src/components/GlassButton';
import { GlassCard } from '@/src/components/GlassCard';
import { DeskConfig } from '@/src/config/desk';
import { useRecentPeers } from '@/src/hooks/useRecentPeers';
import { useAuth } from '@/src/services/auth';
import { AlbesaColors } from '@/src/theme/albesa';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatId(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { peers, addPeer } = useRecentPeers();
  const [peerId, setPeerId] = useState('');
  const [password, setPassword] = useState('');

  const connect = async () => {
    const id = peerId.replace(/\s/g, '');
    if (id.length < 6) return;
    await addPeer(id);
    router.push({
      pathname: '/remote/[id]',
      params: { id, ...(password ? { password } : {}) },
    });
  };

  return (
    <LinearGradient colors={['#16120e', AlbesaColors.bgDark]} style={styles.bg}>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: 100 }]}>
        <AnimatedEntrance index={0}>
          <Text style={styles.greeting}>Hola, {user?.email?.split('@')[0] ?? 'operador'}</Text>
          <Text style={styles.title}>Conectar a un equipo</Text>
        </AnimatedEntrance>

        <AnimatedEntrance index={1}>
          <GlassCard>
            <Text style={styles.label}>ID remoto ATS Desk</Text>
            <TextInput
              style={styles.idInput}
              placeholder="123 456 789"
              placeholderTextColor={AlbesaColors.textSecondary}
              value={peerId}
              onChangeText={(t) => setPeerId(formatId(t))}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Contraseña (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Si el equipo la requiere"
              placeholderTextColor={AlbesaColors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <GlassButton label="Conectar ahora" onPress={connect} style={{ marginTop: 14 }} />
          </GlassCard>
        </AnimatedEntrance>

        <AnimatedEntrance index={2}>
          <GlassCard style={{ marginTop: 14 }}>
            <Text style={styles.serverLabel}>Servidor Albesa</Text>
            <Text style={styles.serverValue}>ID · {DeskConfig.rendezvousServer}</Text>
            <Text style={styles.serverValue}>Relay · {DeskConfig.relayServer}</Text>
          </GlassCard>
        </AnimatedEntrance>

        {peers.length > 0 && (
          <AnimatedEntrance index={3}>
            <Text style={styles.section}>Recientes</Text>
            {peers.slice(0, 4).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/remote/${p.id}` as `/remote/${string}`)}
                style={styles.recentRow}
              >
                <Text style={styles.recentId}>{formatId(p.id)}</Text>
                <Text style={styles.recentMeta}>Tocar para conectar</Text>
              </Pressable>
            ))}
          </AnimatedEntrance>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18 },
  greeting: { color: AlbesaColors.textSecondary, fontSize: 14 },
  title: { color: AlbesaColors.text, fontSize: 28, fontWeight: '800', marginBottom: 18 },
  label: { color: AlbesaColors.textSecondary, fontSize: 13, marginBottom: 8 },
  idInput: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    color: AlbesaColors.accentLight,
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  input: {
    backgroundColor: AlbesaColors.surface,
    borderRadius: 14,
    padding: 14,
    color: AlbesaColors.text,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
  },
  serverLabel: { color: AlbesaColors.text, fontWeight: '700', marginBottom: 8 },
  serverValue: { color: AlbesaColors.textSecondary, fontSize: 13, marginTop: 2 },
  section: { color: AlbesaColors.text, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  recentRow: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: AlbesaColors.bgElevated,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
  },
  recentId: { color: AlbesaColors.text, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  recentMeta: { color: AlbesaColors.textSecondary, fontSize: 12, marginTop: 4 },
});
