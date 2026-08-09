import { ensureDeskWebClient } from '@/src/remote/deskWebClient';
import { useEffect } from 'react';

/** Precarga el cliente web al abrir la app (evita fallo Worker en la primera sesión). */
export function useWarmDeskWebClient() {
  useEffect(() => {
    ensureDeskWebClient().catch(() => {
      /* fallback remoto en desk.ts */
    });
  }, []);
}
