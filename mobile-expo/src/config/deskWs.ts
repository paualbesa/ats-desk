import { DeskConfig } from '@/src/config/desk';

export function parseDeskHostPort() {
  const raw = DeskConfig.rendezvousServer;
  const [host, port] = raw.split(':');
  return { host, port: port || '21116' };
}

export function getWebSocketHost(): string {
  return DeskConfig.webSocketHost.trim() || 'desk.albesa.tech';
}

/** hbbs no habla HTTP: timeout/abort en fetch ⇒ puerto abierto (poco fiable en RN/iOS). */
export async function probeTcpPort(host: string, port: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(`http://${host}:${port}`, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return true;
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') return true;
      const msg = e.message.toLowerCase();
      if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('abort')) return true;
    }
    return false;
  }
}

/** Comprueba hbbs: WS :21118 (fiable en móvil) → fetch :21116 → salud nginx (túnel). */
export async function probeHbbsReachable(): Promise<boolean> {
  const { host, port } = parseDeskHostPort();
  const directIp =
    process.env.EXPO_PUBLIC_DESK_DIRECT_IP ?? (await resolveHostIpv4(host)) ?? undefined;

  const wsCandidates = [
    ...(directIp ? [`ws://${directIp}:21118`] : []),
    `ws://${host}:21118`,
  ];
  for (const url of wsCandidates) {
    if (await probeWebSocket(url)) return true;
  }

  if (await probeTcpPort(host, port)) return true;

  if (await probeNginxHealth(getWebSocketHost())) return true;

  return false;
}

async function probeNginxHealth(host: string, timeoutMs = 3000): Promise<boolean> {
  const urls = [`https://${host}/health`, `http://${host}/health`];
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const body = await res.text();
      if (body.trim() === 'ok') return true;
    } catch {
      /* try next */
    }
  }
  return false;
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

/** Prueba WSS en desk.albesa.tech (túnel) y fallback :21118 directo. */
export async function probeDeskWebSocket(wsHost?: string): Promise<boolean> {
  const host = wsHost ?? getWebSocketHost();
  const { host: rdHost } = parseDeskHostPort();
  const directIp =
    process.env.EXPO_PUBLIC_DESK_DIRECT_IP ??
    (await resolveHostIpv4(rdHost)) ??
    undefined;

  const candidates = [
    `wss://${host}/ws/id`,
    `ws://${host}/ws/id`,
    ...(directIp ? [`ws://${directIp}:21118`] : []),
    `ws://${rdHost}:21118`,
  ];

  for (const url of candidates) {
    if (await probeWebSocket(url)) return true;
  }
  return false;
}

let cachedWebRelayHost: string | null = null;

/**
 * Host para el hash del cliente web RustDesk (`r@…`).
 * Preferir desk.albesa.tech (túnel nginx) → wss://desk/ws/id
 * Fallback: IP rd + puerto hbbs → ws directo :21118
 */
export async function resolveDeskWebRelayHost(): Promise<string> {
  if (cachedWebRelayHost) return cachedWebRelayHost;

  const override = process.env.EXPO_PUBLIC_DESK_WEB_RELAY_HOST?.trim();
  if (override) {
    cachedWebRelayHost = override;
    return override;
  }

  const wsHost = getWebSocketHost();
  if (await probeNginxHealth(wsHost)) {
    cachedWebRelayHost = wsHost;
    return wsHost;
  }

  const { host, port } = parseDeskHostPort();
  const directIp =
    process.env.EXPO_PUBLIC_DESK_DIRECT_IP ?? (await resolveHostIpv4(host)) ?? host;
  cachedWebRelayHost = `${directIp}:${port}`;
  return cachedWebRelayHost;
}

export function clearDeskWebRelayCache() {
  cachedWebRelayHost = null;
}
