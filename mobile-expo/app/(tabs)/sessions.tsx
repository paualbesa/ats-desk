import { AnimatedEntrance } from '@/src/components/AnimatedEntrance';
import { useRecentPeers } from '@/src/hooks/useRecentPeers';
import { AlbesaColors } from '@/src/theme/albesa';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SessionsScreen() {
  const { peers, removePeer } = useRecentPeers();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Conexiones recientes</Text>
      <FlatList
        data={peers}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 18 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no hay equipos. Conecta desde la pestaña principal.</Text>
        }
        renderItem={({ item, index }) => (
          <AnimatedEntrance index={index}>
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/remote/${item.id}` as `/remote/${string}`)}
            >
              <View>
                <Text style={styles.id}>{item.id.replace(/(\d{3})(?=\d)/g, '$1 ')}</Text>
                <Text style={styles.date}>
                  {new Date(item.lastConnected).toLocaleString('es-ES')}
                </Text>
              </View>
              <Pressable onPress={() => removePeer(item.id)} hitSlop={12}>
                <Ionicons name="trash-outline" size={20} color={AlbesaColors.danger} />
              </Pressable>
            </Pressable>
          </AnimatedEntrance>
        )}
      />
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
  empty: { color: AlbesaColors.textSecondary, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: AlbesaColors.bgElevated,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
  },
  id: { color: AlbesaColors.text, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  date: { color: AlbesaColors.textSecondary, fontSize: 12, marginTop: 4 },
});
