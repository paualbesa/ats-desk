import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type RecentPeer = {
  id: string;
  label?: string;
  lastConnected: number;
};

const KEY = 'ats_recent_peers_v1';

export function useRecentPeers() {
  const [peers, setPeers] = useState<RecentPeer[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) setPeers(JSON.parse(raw));
    } catch {
      setPeers([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPeer = useCallback(
    async (id: string, label?: string) => {
      const normalized = id.replace(/\s/g, '');
      setPeers((prev) => {
        const next = [
          { id: normalized, label, lastConnected: Date.now() },
          ...prev.filter((p) => p.id !== normalized),
        ].slice(0, 20);
        SecureStore.setItemAsync(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removePeer = useCallback(async (id: string) => {
    setPeers((prev) => {
      const next = prev.filter((p) => p.id !== id);
      SecureStore.setItemAsync(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { peers, addPeer, removePeer, reload: load };
}
