import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'fflate';
import { DeskConfig } from '@/src/config/desk';

const CACHE_DIR = `${FileSystem.cacheDirectory}rustdesk-web/`;
const READY_MARKER = `${CACHE_DIR}.ready`;

/** Extrae el cliente web RustDesk (bundled zip) al cache del dispositivo. */
export async function ensureDeskWebClient(): Promise<string> {
  const marker = await FileSystem.getInfoAsync(READY_MARKER);
  if (marker.exists) {
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
          const b64 = btoa(String.fromCharCode(...data));
          await FileSystem.writeAsStringAsync(out, b64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        await FileSystem.writeAsStringAsync(READY_MARKER, '1');
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });

  return `file://${CACHE_DIR}index.html`;
}

/** URL hash RustDesk. Hostname sin puerto → ws://host/ws/id (nginx en :80). */
export function buildDeskWebSessionUrl(peerId: string, password?: string): string {
  const id = peerId.replace(/\s/g, '');
  const host = DeskConfig.rendezvousServer.split(':')[0];
  const key = encodeURIComponent(DeskConfig.serverKey);
  const pass = password ? `&password=${encodeURIComponent(password)}` : '';
  return `#/${id}/r@${host}?key=${key}${pass}`;
}
