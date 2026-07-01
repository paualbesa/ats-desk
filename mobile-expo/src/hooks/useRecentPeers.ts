import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type RecentPeer = {
  id: string;
  label?: string;
  lastConnected: number;
  favorite?: boolean;
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

  const persist = useCallback((next: RecentPeer[]) => {
    setPeers(next);
    SecureStore.setItemAsync(KEY, JSON.stringify(next));
  }, []);

  const addPeer = useCallback(
    async (id: string, label?: string) => {
      const normalized = id.replace(/\D/g, '').slice(0, 6);
      setPeers((prev) => {
        const existing = prev.find((p) => p.id === normalized);
        const next = [
          {
            id: normalized,
            label: label ?? existing?.label,
            lastConnected: Date.now(),
            favorite: existing?.favorite,
          },
          ...prev.filter((p) => p.id !== normalized),
        ].slice(0, 30);
        SecureStore.setItemAsync(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removePeer = useCallback(
    async (id: string) => {
      setPeers((prev) => {
        const next = prev.filter((p) => p.id !== id);
        SecureStore.setItemAsync(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      setPeers((prev) => {
        const next = prev.map((p) =>
          p.id === id ? { ...p, favorite: !p.favorite } : p,
        );
        SecureStore.setItemAsync(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const favorites = peers.filter((p) => p.favorite);

  return { peers, favorites, addPeer, removePeer, toggleFavorite, reload: load, persist };
}

/** Solo dígitos, máximo 6. Visual: 123 456 */
export function formatDeskId(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export function normalizeDeskId(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 6);
}

export function isValidDeskId(raw: string) {
  return normalizeDeskId(raw).length === 6;
}
