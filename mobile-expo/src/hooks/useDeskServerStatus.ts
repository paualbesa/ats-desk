import { DeskConfig } from '@/src/config/desk';
import { useCallback, useEffect, useRef, useState } from 'react';

function parseHostPort() {
  const raw = DeskConfig.rendezvousServer;
  const [host, port] = raw.split(':');
  return { host, port: port || '21116', wsPort: String(Number(port || 21116) + 2) };
}

/** Comprueba reachability del servidor ID (WebSocket puerto 21118). */
export function useDeskServerStatus(pollMs = 15000) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    const { host, wsPort } = parseHostPort();

    const result = await new Promise<boolean>((resolve) => {
      let done = false;
      const finish = (v: boolean) => {
        if (done) return;
        done = true;
        resolve(v);
      };
      try {
        const ws = new WebSocket(`ws://${host}:${wsPort}`);
        ws.onopen = () => {
          ws.close();
          finish(true);
        };
        ws.onerror = () => finish(false);
        setTimeout(() => finish(false), 4500);
      } catch {
        finish(false);
      }
    });

    setOnline(result);
    setLastCheck(Date.now());
    checking.current = false;
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, pollMs);
    return () => clearInterval(id);
  }, [check, pollMs]);

  return { online: online === true, checking: online === null, lastCheck, refresh: check };
}
