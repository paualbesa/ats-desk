import {
  getWebSocketHost,
  probeDeskWebSocket,
  probeHbbsReachable,
} from '@/src/config/deskWs';
import { useCallback, useEffect, useRef, useState } from 'react';

type StatusSnapshot = {
  online: boolean;
  wsOnline: boolean;
  updatedAt: number;
};

let statusCache: StatusSnapshot | null = null;
const CACHE_SOFT_MS = 20000;

/** Comprueba hbbs y WebSocket; mantiene último estado para evitar “sin conexión” al entrar en Ajustes. */
export function useDeskServerStatus(pollMs = 30000) {
  const [online, setOnline] = useState<boolean | null>(() => statusCache?.online ?? null);
  const [wsOnline, setWsOnline] = useState<boolean | null>(() => statusCache?.wsOnline ?? null);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<number | null>(() => statusCache?.updatedAt ?? null);
  const busy = useRef(false);

  const applySnapshot = useCallback((snap: StatusSnapshot) => {
    statusCache = snap;
    setOnline(snap.online);
    setWsOnline(snap.wsOnline);
    setLastCheck(snap.updatedAt);
  }, []);

  const check = useCallback(
    async (opts?: { force?: boolean; clearRelay?: boolean }) => {
      if (busy.current) return;
      const force = opts?.force ?? false;
      const fresh =
        statusCache && Date.now() - statusCache.updatedAt < CACHE_SOFT_MS;

      if (!force && fresh && statusCache) {
        applySnapshot(statusCache);
        return;
      }

      busy.current = true;
      setChecking(true);

      const [hbbsOk, wsOk] = await Promise.all([
        probeHbbsReachable(),
        probeDeskWebSocket(getWebSocketHost(), opts?.clearRelay),
      ]);

      applySnapshot({ online: hbbsOk, wsOnline: wsOk, updatedAt: Date.now() });
      setChecking(false);
      busy.current = false;
    },
    [applySnapshot],
  );

  useEffect(() => {
    check();
    const id = setInterval(() => check(), pollMs);
    return () => clearInterval(id);
  }, [check, pollMs]);

  const refresh = useCallback(() => {
    check({ force: true, clearRelay: true });
  }, [check]);

  const effectiveOnline = online ?? statusCache?.online ?? false;
  const effectiveWsOnline = wsOnline ?? statusCache?.wsOnline ?? false;
  const pending = checking && online === null && !statusCache;

  return {
    online: effectiveOnline,
    wsOnline: effectiveWsOnline,
    checking: pending,
    isRefreshing: checking && !pending,
    lastCheck,
    refresh,
  };
}
