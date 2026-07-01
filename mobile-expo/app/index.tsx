import { SquircleGlass } from '@/src/components/SquircleGlass';
import {
  formatDeskId,
  isValidDeskId,
  normalizeDeskId,
  useRecentPeers,
} from '@/src/hooks/useRecentPeers';
import { useDeskServerStatus } from '@/src/hooks/useDeskServerStatus';
import { AlbesaRadius } from '@/src/theme/albesa';
import { useTheme } from '@/src/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Segment = 'recientes' | 'favoritos' | 'todos';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PeerRow({
  id,
  label,
  favorite,
  online,
  onPress,
  onToggleStar,
  index,
}: {
  id: string;
  label?: string;
  favorite?: boolean;
  online: boolean;
  onPress: () => void;
  onToggleStar: () => void;
  index: number;
}) {
  const { colors, accent } = useTheme();
  const accentColor = accent(online);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInRight.delay(80 + index * 50).springify().damping(18)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={[styles.peerRow, animStyle]}
      >
        <SquircleGlass online={online} radius={AlbesaRadius.lg} style={styles.thumbWrap}>
          <View style={[styles.thumbInner, { backgroundColor: colors.bgGlass }]}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: online ? colors.success : colors.offline,
                  borderColor: colors.bgCard,
                },
              ]}
            />
            <Ionicons name="desktop-outline" size={36} color={accentColor} style={{ opacity: 0.9 }} />
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                Haptics.selectionAsync();
                onToggleStar();
              }}
              hitSlop={10}
              style={styles.starBtn}
            >
              <Ionicons
                name={favorite ? 'star' : 'star-outline'}
                size={18}
                color={favorite ? '#FFCC00' : colors.textTertiary}
              />
            </Pressable>
          </View>
        </SquircleGlass>
        <View style={styles.peerMeta}>
          <Text style={[styles.peerId, { color: colors.text }]}>{formatDeskId(id)}</Text>
          {label ? (
            <Text style={[styles.peerLabel, { color: colors.textSecondary }]}>{label}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, accent, isDark } = useTheme();
  const { peers, favorites, addPeer, toggleFavorite } = useRecentPeers();
  const { online } = useDeskServerStatus();

  const [remoteId, setRemoteId] = useState('');
  const [segment, setSegment] = useState<Segment>('recientes');

  const accentColor = accent(online);
  const idReady = isValidDeskId(remoteId);

  const listData = useMemo(() => {
    if (segment === 'favoritos') return favorites;
    if (segment === 'todos') return peers;
    return peers.slice(0, 20);
  }, [segment, peers, favorites]);

  const connect = async () => {
    const id = normalizeDeskId(remoteId);
    if (!isValidDeskId(id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addPeer(id);
    router.push({ pathname: '/remote/[id]', params: { id } });
  };

  const openPeer = (id: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/remote/[id]', params: { id } });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={colors.gradient} style={StyleSheet.absoluteFill} />

      <BlurView
        intensity={isDark ? 40 : 70}
        tint={colors.headerBlur}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <View style={styles.headerSide} />

        <Animated.View entering={FadeIn.duration(400)} style={styles.logoRow}>
          <Image source={require('../assets/images/logo.png')} style={styles.logoImage} />
          <Text style={[styles.logoText, { color: accentColor }]}>ATS Desk</Text>
        </Animated.View>

        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.headerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)' }]}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
      </BlurView>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 18 }}
        ListHeaderComponent={
          <>
            <Animated.View entering={FadeInDown.delay(40).springify()}>
              <SquircleGlass online={online} radius={AlbesaRadius.lg} style={styles.remoteInputWrap}>
                <View style={styles.remoteInputRow}>
                  <TextInput
                    style={[styles.remoteInput, { color: colors.text }]}
                    placeholder="000 000"
                    placeholderTextColor={colors.textTertiary}
                    value={remoteId}
                    onChangeText={(t) => setRemoteId(formatDeskId(t))}
                    keyboardType="number-pad"
                    maxLength={7}
                    returnKeyType="go"
                    onSubmitEditing={connect}
                  />
                  {idReady && (
                    <Animated.View entering={FadeIn.springify()}>
                      <Pressable
                        onPress={connect}
                        style={[styles.connectChip, { backgroundColor: accentColor }]}
                      >
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              </SquircleGlass>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
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
                          active && {
                            backgroundColor: isDark ? colors.surface : '#fff',
                            shadowColor: colors.shadow,
                            shadowOpacity: 0.08,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                          },
                        ]}
                      >
                        <Ionicons
                          name={tab.icon}
                          size={22}
                          color={active ? accentColor : colors.textTertiary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </SquircleGlass>
            </Animated.View>
          </>
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn.delay(200)} style={styles.empty}>
            <Ionicons name="desktop-outline" size={44} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {segment === 'favoritos' ? 'Sin favoritos' : 'Sin conexiones recientes'}
            </Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <PeerRow
            id={item.id}
            label={item.label}
            favorite={item.favorite}
            online={online}
            onPress={() => openPeer(item.id)}
            onToggleStar={() => toggleFavorite(item.id)}
            index={index}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: { width: 44 },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 30, height: 30, borderRadius: 8 },
  logoText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  remoteInputWrap: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 58,
  },
  remoteInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  remoteInput: {
    flex: 1,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 4,
  },
  connectChip: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  segmentBar: { marginTop: 16, marginBottom: 18 },
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
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  thumbWrap: { width: 108, height: 80 },
  thumbInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: AlbesaRadius.lg,
  },
  statusDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  starBtn: { position: 'absolute', top: 8, right: 8 },
  peerMeta: { flex: 1 },
  peerId: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  peerLabel: { fontSize: 14, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 16 },
});
