import {
  clearDeskWebRelayCache,
  parseDeskHostPort,
  probeDeskWebSocket,
  probeTcpPort,
} from '@/src/config/deskWs';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Comprueba hbbs (21116) y WebSocket (nginx o :21118 directo). */
export function useDeskServerStatus(pollMs = 15000) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [wsOnline, setWsOnline] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    clearDeskWebRelayCache();

    const { host, port } = parseDeskHostPort();
    const hbbsOk = await probeTcpPort(host, port);
    setOnline(hbbsOk);

    const wsOk = hbbsOk ? await probeDeskWebSocket(host) : false;
    setWsOnline(wsOk);

    setLastCheck(Date.now());
    checking.current = false;
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, pollMs);
    return () => clearInterval(id);
  }, [check, pollMs]);

  return {
    online: online === true,
    wsOnline: wsOnline === true,
    checking: online === null,
    lastCheck,
    refresh: check,
  };
}
