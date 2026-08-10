import { DeskConfig } from '@/src/config/desk';
import { resolveDeskWebRelayHost } from '@/src/config/deskWs';
import { WORKER_POLYFILL_SCRIPT } from '@/src/remote/workerPolyfill';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'fflate';

const CACHE_DIR = `${FileSystem.cacheDirectory}rustdesk-web/`;
const READY_MARKER = `${CACHE_DIR}.ready_v6`;

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function buildCustomConfigIni(): string {
  const [host, port] = DeskConfig.rendezvousServer.split(':');
  const relay = DeskConfig.relayServer;
  return [
    '[default-settings]',
    `custom-rendezvous-server=${host}:${port || '21116'}`,
    `relay-server=${relay}`,
    `key=${DeskConfig.serverKey}`,
    'force-always-relay=Y',
    '',
  ].join('\n');
}

function buildMobileShellHtml(): string {
  const customIni = buildCustomConfigIni();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <base href="./" />
  <style>
    html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
    #ats-canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    #div-background, #root { display: none !important; }
  </style>
  <script id="ats-worker-polyfill">${WORKER_POLYFILL_SCRIPT}</script>
  <script id="custom-config" type="text/plain">${customIni}</script>
  <script type="module" crossorigin src="js/dist/index.js"></script>
  <link rel="modulepreload" href="js/dist/vendor.js" />
</head>
<body>
  <canvas id="ats-canvas"></canvas>
  <div id="root"></div>
</body>
</html>`;
}

function patchIndexHtml(html: string): string {
  // Reemplazar por shell móvil mínimo (sin Flutter/service worker ni UI duplicada).
  if (html.includes('ats-mobile-shell')) return html;
  return buildMobileShellHtml().replace('<html>', '<html data-ats-mobile-shell="1">');
}

async function patchExtractedClient() {
  const indexPath = `${CACHE_DIR}index.html`;
  const info = await FileSystem.getInfoAsync(indexPath);
  if (!info.exists) return;
  const html = await FileSystem.readAsStringAsync(indexPath);
  const patched = patchIndexHtml(html);
  if (patched !== html) {
    await FileSystem.writeAsStringAsync(indexPath, patched);
  }
}

/** Valida base remota: debe apuntar a rustdesk-web, no a la SPA desk-web. */
export function normalizeWebClientBase(raw?: string): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase().replace(/\/$/, '');
  if (lower.endsWith('/rustdesk-web')) return lower;
  // Rechazar raíz desk.albesa.tech — carga la SPA React (UI duplicada).
  if (/^https?:\/\/[^/]+$/i.test(lower) || lower.endsWith('/index.html')) {
    console.warn('[ATS] webClientBase ignorado (SPA desk-web):', trimmed);
    return null;
  }
  if (lower.includes('/rustdesk-web')) return lower.split('/rustdesk-web')[0] + '/rustdesk-web';
  return null;
}

/** Extrae el cliente web RustDesk (bundled zip) al cache del dispositivo. */
export async function ensureDeskWebClient(): Promise<string> {
  const remote = normalizeWebClientBase(DeskConfig.webClientBase);
  if (remote) {
    return `${remote}/index.html`;
  }

  const marker = await FileSystem.getInfoAsync(READY_MARKER);
  if (marker.exists) {
    await patchExtractedClient();
    return `file://${CACHE_DIR}index.html`;
  }

  await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });

  const asset = Asset.fromModule(require('../../assets/rustdesk-web.zip'));
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('No se pudo cargar rustdesk-web.zip');

  const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  await new Promise<void>((resolve, reject) => {
    unzip(binary, async (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        for (const [path, data] of Object.entries(files)) {
          const out = `${CACHE_DIR}${path.replace(/^rustdesk-web\//, '')}`;
          const dir = out.substring(0, out.lastIndexOf('/'));
          if (dir.length > CACHE_DIR.length - 1) {
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          }
          await FileSystem.writeAsStringAsync(out, uint8ToBase64(data), {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        await patchExtractedClient();
        await FileSystem.writeAsStringAsync(READY_MARKER, '1');
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });

  return `file://${CACHE_DIR}index.html`;
}

/** URL completa para WebView (base + hash RustDesk). */
export function buildDeskWebViewUri(base: string, hash: string): string {
  const trimmed = base.trim();
  if (trimmed.includes('#')) {
    const [root] = trimmed.split('#');
    return `${root}${hash.startsWith('#') ? hash : `#${hash}`}`;
  }
  return `${trimmed}${hash.startsWith('#') ? hash : `#${hash}`}`;
}

/** ID de sesión RustDesk (id/r@host?key=…). */
export function buildSessionPeerId(
  peerId: string,
  relayHost: string,
  password?: string,
): string {
  const id = peerId.replace(/\D/g, '').slice(0, 6);
  const key = encodeURIComponent(DeskConfig.serverKey);
  const pass = password ? `&password=${encodeURIComponent(password)}` : '';
  return `${id}/r@${relayHost}?key=${key}${pass}`;
}

/** Hash RustDesk (#/id/r@host?key=…). */
export async function buildDeskWebSessionUrl(peerId: string, password?: string): Promise<string> {
  const relayHost = await resolveDeskWebRelayHost();
  const peer = buildSessionPeerId(peerId, relayHost, password);
  return `#/${peer}`;
}
