import { DeskConfig } from '@/src/config/desk';

export function parseDeskHostPort() {
  const raw = DeskConfig.rendezvousServer;
  const [host, port] = raw.split(':');
  return { host, port: port || '21116' };
}

/** hbbs no habla HTTP: timeout/abort en fetch ⇒ puerto abierto. */
export async function probeTcpPort(host: string, port: string, timeoutMs = 4000): Promise<boolean> {
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

async function probeNginxHealth(host: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`http://${host}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const body = await res.text();
    return body.trim() === 'ok';
  } catch {
    return false;
  }
}

async function resolveHostIpv4(host: string): Promise<string | null> {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`,
      { headers: { Accept: 'application/dns-json' } },
    );
    const data = (await res.json()) as { Answer?: Array<{ type: number; data: string }> };
    const a = data.Answer?.find((row) => row.type === 1);
    return a?.data ?? null;
  } catch {
    return null;
  }
}

function probeWebSocket(url: string, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (value: boolean) => {
      if (!done) {
        done = true;
        resolve(value);
      }
    };
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        finish(false);
      }, timeoutMs);
      ws.onopen = () => {
        clearTimeout(timer);
        ws.close();
        finish(true);
      };
      ws.onerror = () => {
        clearTimeout(timer);
        finish(false);
      };
    } catch {
      finish(false);
    }
  });
}

/** Prueba nginx (:80 /ws/id) y, si falla, WebSocket directo en :21118 vía IP. */
export async function probeDeskWebSocket(host: string): Promise<boolean> {
  const directIp =
    process.env.EXPO_PUBLIC_DESK_DIRECT_IP ?? (await resolveHostIpv4(host)) ?? undefined;

  const candidates = [
    `ws://${host}/ws/id`,
    ...(directIp ? [`ws://${directIp}:21118`] : []),
    `ws://${host}:21118`,
  ];

  for (const url of candidates) {
    if (await probeWebSocket(url)) return true;
  }
  return false;
}

let cachedWebRelayHost: string | null = null;

/**
 * Host para el hash del cliente web RustDesk (`r@…`).
 * - Con nginx: dominio sin puerto → ws://dominio/ws/id
 * - Sin nginx: IP:21116 → ws://IP:21118 (conexión directa)
 */
export async function resolveDeskWebRelayHost(): Promise<string> {
  if (cachedWebRelayHost) return cachedWebRelayHost;

  const override = process.env.EXPO_PUBLIC_DESK_WEB_RELAY_HOST?.trim();
  if (override) {
    cachedWebRelayHost = override;
    return override;
  }

  const { host, port } = parseDeskHostPort();

  if (await probeNginxHealth(host)) {
    cachedWebRelayHost = host;
    return host;
  }

  const directIp =
    process.env.EXPO_PUBLIC_DESK_DIRECT_IP ??
    (await resolveHostIpv4(host)) ??
    host;
  cachedWebRelayHost = `${directIp}:${port}`;
  return cachedWebRelayHost;
}

export function clearDeskWebRelayCache() {
  cachedWebRelayHost = null;
}
