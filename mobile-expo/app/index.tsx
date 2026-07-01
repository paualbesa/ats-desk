import { SquircleGlass } from '@/src/components/SquircleGlass';
import { DeskConfig } from '@/src/config/desk';
import { formatDeskId, useRecentPeers } from '@/src/hooks/useRecentPeers';
import { useDeskServerStatus } from '@/src/hooks/useDeskServerStatus';
import { useAuth } from '@/src/services/auth';
import {
  accentForOnline,
  AlbesaColors,
  AlbesaRadius,
} from '@/src/theme/albesa';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Segment = 'recientes' | 'favoritos' | 'todos';

function PeerRow({
  id,
  label,
  favorite,
  online,
  onPress,
  onToggleStar,
}: {
  id: string;
  label?: string;
  favorite?: boolean;
  online: boolean;
  onPress: () => void;
  onToggleStar: () => void;
}) {
  const accent = accentForOnline(online);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.peerRow, pressed && { opacity: 0.92 }]}>
      <SquircleGlass online={online} radius={AlbesaRadius.md} style={styles.thumbWrap}>
        <View style={styles.thumbInner}>
          <View style={[styles.statusDot, { backgroundColor: online ? AlbesaColors.success : AlbesaColors.offline }]} />
          <Ionicons name="desktop-outline" size={28} color={accent} style={{ opacity: 0.85 }} />
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleStar();
            }}
            hitSlop={8}
            style={styles.starBtn}
          >
            <Ionicons
              name={favorite ? 'star' : 'star-outline'}
              size={16}
              color={favorite ? '#FFCC00' : AlbesaColors.textTertiary}
            />
          </Pressable>
        </View>
      </SquircleGlass>
      <View style={styles.peerMeta}>
        <Text style={styles.peerId}>{formatDeskId(id)}</Text>
        {label ? <Text style={styles.peerLabel}>{label}</Text> : null}
      </View>
      <Ionicons name="ellipsis-vertical" size={18} color={AlbesaColors.textTertiary} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { peers, favorites, addPeer, toggleFavorite } = useRecentPeers();
  const { online, checking, refresh } = useDeskServerStatus();

  const [remoteId, setRemoteId] = useState('');
  const [segment, setSegment] = useState<Segment>('recientes');

  const accent = accentForOnline(online);

  const listData = useMemo(() => {
    if (segment === 'favoritos') return favorites;
    if (segment === 'todos') return peers;
    return peers.slice(0, 20);
  }, [segment, peers, favorites]);

  const connect = async () => {
    const id = remoteId.replace(/\s/g, '');
    if (id.length < 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addPeer(id);
    router.push({ pathname: '/remote/[id]', params: { id } });
  };

  const openPeer = (id: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/remote/[id]', params: { id } });
  };

  const hostLabel = DeskConfig.rendezvousServer.split(':')[0];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#FFF8F4', AlbesaColors.bg, '#ECECF0']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <BlurView intensity={70} tint="light" style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.headerBtn, { backgroundColor: online ? 'rgba(232,118,46,0.12)' : 'rgba(142,142,147,0.12)' }]}
        >
          <Ionicons name="construct-outline" size={22} color={accent} />
        </Pressable>

        <View style={styles.logoRow}>
          <View style={[styles.logoMark, { backgroundColor: accent }]} />
          <Text style={[styles.logoText, { color: accent }]}>ATS Desk</Text>
        </View>

        <Pressable onPress={() => router.push('/settings')} style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color={AlbesaColors.text} />
        </Pressable>
      </BlurView>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 18 }}
        ListHeaderComponent={
          <>
            {/* Input remoto */}
            <Animated.View entering={FadeInDown.delay(50)}>
              <SquircleGlass online={online} radius={AlbesaRadius.lg} style={styles.remoteInputWrap}>
                <TextInput
                  style={styles.remoteInput}
                  placeholder="Introduzca la dirección remota"
                  placeholderTextColor={AlbesaColors.textTertiary}
                  value={remoteId}
                  onChangeText={(t) => setRemoteId(formatDeskId(t))}
                  keyboardType="number-pad"
                  returnKeyType="go"
                  onSubmitEditing={connect}
                />
                {remoteId.replace(/\s/g, '').length >= 6 && (
                  <Pressable onPress={connect} style={[styles.connectChip, { backgroundColor: accent }]}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </Pressable>
                )}
              </SquircleGlass>
            </Animated.View>

            {/* Tu dirección */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.yourSection}>
              <View style={styles.yourRow}>
                <View>
                  <Text style={styles.yourLabel}>Su dirección</Text>
                  <Text style={[styles.yourId, { color: accent }]}>
                    {user?.email?.split('@')[0] ?? '— — —'}
                  </Text>
                  <Text style={styles.yourHint}>
                    {online
                      ? `Servidor ${hostLabel} · en línea`
                      : checking
                        ? 'Comprobando servidor…'
                        : `Sin conexión a ${hostLabel}`}
                  </Text>
                </View>
                <Pressable onPress={refresh} hitSlop={12}>
                  <Ionicons
                    name={online ? 'cloud-done-outline' : 'cloud-offline-outline'}
                    size={22}
                    color={accent}
                  />
                </Pressable>
              </View>
            </Animated.View>

            {/* Segmentos */}
            <Animated.View entering={FadeInDown.delay(150)}>
              <SquircleGlass online={online} radius={AlbesaRadius.pill} style={styles.segmentBar}>
                <View style={styles.segmentInner}>
                  {(
                    [
                      { key: 'recientes' as const, icon: 'time-outline' as const },
                      { key: 'favoritos' as const, icon: 'star-outline' as const },
                      { key: 'todos' as const, icon: 'people-outline' as const },
                    ] as const
                  ).map((tab) => {
                    const active = segment === tab.key;
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSegment(tab.key);
                        }}
                        style={[
                          styles.segmentItem,
                          active && [styles.segmentActive, { backgroundColor: online ? '#fff' : '#F2F2F7' }],
                        ]}
                      >
                        <Ionicons
                          name={tab.icon}
                          size={22}
                          color={active ? accent : AlbesaColors.textTertiary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </SquircleGlass>
            </Animated.View>

            {!online && !checking && (
              <SquircleGlass online={false} radius={AlbesaRadius.md} style={styles.offlineBanner}>
                <Ionicons name="warning-outline" size={18} color={AlbesaColors.offline} />
                <Text style={styles.offlineText}>
                  No hay conexión con el servidor. Comprueba que hbbs esté activo y los puertos 21115–21119 abiertos en el firewall.
                </Text>
              </SquircleGlass>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="desktop-outline" size={40} color={AlbesaColors.textTertiary} />
            <Text style={styles.emptyText}>
              {segment === 'favoritos' ? 'Sin favoritos' : 'Sin conexiones recientes'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 40)}>
            <PeerRow
              id={item.id}
              label={item.label}
              favorite={item.favorite}
              online={online}
              onPress={() => openPeer(item.id)}
              onToggleStar={() => toggleFavorite(item.id)}
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AlbesaColors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AlbesaColors.border,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 14, height: 14, borderRadius: 5, transform: [{ rotate: '45deg' }] },
  logoText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  remoteInputWrap: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    minHeight: 58,
  },
  remoteInput: {
    flex: 1,
    fontSize: 17,
    color: AlbesaColors.text,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  connectChip: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yourSection: { marginTop: 22, marginBottom: 16 },
  yourRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  yourLabel: { fontSize: 14, color: AlbesaColors.textSecondary, marginBottom: 4 },
  yourId: { fontSize: 32, fontWeight: '800', letterSpacing: 1, fontVariant: ['tabular-nums'] },
  yourHint: { fontSize: 12, color: AlbesaColors.textTertiary, marginTop: 6 },
  segmentBar: { marginBottom: 14 },
  segmentInner: {
    flexDirection: 'row',
    padding: 5,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: AlbesaRadius.pill,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    marginBottom: 12,
  },
  offlineText: { flex: 1, fontSize: 13, color: AlbesaColors.textSecondary, lineHeight: 18 },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  thumbWrap: { width: 88, height: 64 },
  thumbInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statusDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  starBtn: { position: 'absolute', top: 6, right: 6 },
  peerMeta: { flex: 1 },
  peerId: { fontSize: 18, fontWeight: '700', color: AlbesaColors.text, letterSpacing: 0.5 },
  peerLabel: { fontSize: 13, color: AlbesaColors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: AlbesaColors.textTertiary, fontSize: 15 },
});
