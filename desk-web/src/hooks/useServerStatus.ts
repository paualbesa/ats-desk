import { useEffect, useState } from 'react';
import { DeskConfig } from '@/config/desk';

export function useServerStatus() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChecking(true);
      try {
        const res = await fetch(`https://${DeskConfig.webSocketHost}/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!cancelled) setOnline(res.ok && (await res.text()).trim() === 'ok');
      } catch {
        if (!cancelled) setOnline(false);
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { online, checking };
}
