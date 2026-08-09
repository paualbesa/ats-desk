import {
  clearDeskWebRelayCache,
  getWebSocketHost,
  parseDeskHostPort,
  probeDeskWebSocket,
  probeHbbsReachable,
} from '@/src/config/deskWs';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Comprueba hbbs (rd.albesa.tech:21116) y WebSocket (desk.albesa.tech vía túnel). */
export function useDeskServerStatus(pollMs = 15000) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [wsOnline, setWsOnline] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    clearDeskWebRelayCache();

    const hbbsOk = await probeHbbsReachable();
    setOnline(hbbsOk);

    const wsOk = await probeDeskWebSocket(getWebSocketHost());
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
