import { DeskConfig } from '@/src/config/desk';
import { useCallback, useEffect, useRef, useState } from 'react';

function parseHostPort() {
  const raw = DeskConfig.rendezvousServer;
  const [host, port] = raw.split(':');
  return { host, port: port || '21116' };
}

/** hbbs no habla HTTP: si el puerto responde y cuelga → AbortError = en línea. */
async function probeTcpPort(host: string, port: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(`http://${host}:${port}`, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return true;
    return false;
  }
}

/** Comprueba hbbs (21116) y opcionalmente WebSocket vía nginx /ws/id en :80. */
export function useDeskServerStatus(pollMs = 15000) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [wsOnline, setWsOnline] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const checking = useRef(false);

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    const { host, port } = parseHostPort();

    const hbbsOk = await probeTcpPort(host, port);
    setOnline(hbbsOk);

    const wsOk = await new Promise<boolean>((resolve) => {
      let done = false;
      const finish = (v: boolean) => {
        if (!done) {
          done = true;
          resolve(v);
        }
      };
      try {
        const ws = new WebSocket(`ws://${host}/ws/id`);
        const t = setTimeout(() => finish(false), 4000);
        ws.onopen = () => {
          clearTimeout(t);
          ws.close();
          finish(true);
        };
        ws.onerror = () => {
          clearTimeout(t);
          finish(false);
        };
      } catch {
        finish(false);
      }
    });
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
