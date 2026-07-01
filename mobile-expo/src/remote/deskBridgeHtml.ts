import { DeskConfig } from '@/src/config/desk';

/** HTML embebido para WebView: cliente web RustDesk con servidor Albesa. */
export function buildDeskBridgeHtml(peerId: string, password?: string) {
  const [host, port] = DeskConfig.rendezvousServer.split(':');
  const relayParts = DeskConfig.relayServer.split(':');
  const relayHost = relayParts[0];
  const relayPort = relayParts[1] ?? '21117';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#0D0D0F; color:#F2F2F7; font-family: -apple-system, system-ui, sans-serif; }
    #status { position:fixed; top:12px; left:12px; right:12px; z-index:10; padding:10px 14px;
      background:rgba(28,28,30,0.85); border-radius:12px; font-size:13px; border:1px solid rgba(255,255,255,0.1); }
    #frame { width:100%; height:100%; border:0; }
    #loading { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:12px; }
    .dot { width:10px; height:10px; border-radius:50%; background:#E8762E; animation:pulse 1s infinite alternate; }
    @keyframes pulse { from{opacity:.4;transform:scale(.9)} to{opacity:1;transform:scale(1.1)} }
  </style>
</head>
<body>
  <div id="loading"><div class="dot"></div><div id="status">Conectando a ${peerId}…</div></div>
  <iframe id="frame" style="display:none" allow="fullscreen"></iframe>
  <script>
    const PEER = ${JSON.stringify(peerId)};
    const PASS = ${JSON.stringify(password ?? '')};
    const ID_SERVER = ${JSON.stringify(DeskConfig.rendezvousServer)};
    const RELAY = ${JSON.stringify(DeskConfig.relayServer)};
    const KEY = ${JSON.stringify(DeskConfig.serverKey)};
    const WEB_BASE = ${JSON.stringify(DeskConfig.webClientBase)};

    function post(type, data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
      }
    }

    function setStatus(msg) {
      document.getElementById('status').textContent = msg;
      post('status', { message: msg });
    }

    // Prefer hosted RustDesk web client if configured
  if (WEB_BASE) {
      const url = WEB_BASE.replace(/\\/$/, '') + '/?id=' + encodeURIComponent(PEER);
      const f = document.getElementById('frame');
      f.src = url;
      f.style.display = 'block';
      document.getElementById('loading').style.display = 'none';
      f.onload = () => post('ready', { mode: 'web' });
    } else {
      setStatus('Servidor ID: ' + ID_SERVER + ' · Relay: ' + RELAY);
      post('ready', {
        mode: 'native-bridge',
        peer: PEER,
        idServer: ID_SERVER,
        relay: RELAY,
        key: KEY,
      });
    }

    window.addEventListener('message', (e) => {
      try {
        const cmd = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (cmd.type === 'mouse') {
          post('bridge-echo', { handled: 'mouse', ...cmd });
        } else if (cmd.type === 'key' || cmd.type === 'text') {
          post('bridge-echo', { handled: cmd.type, ...cmd });
        } else {
          post('bridge-echo', cmd);
        }
      } catch (_) {}
    });
  </script>
</body>
</html>`;
}

export type BridgeMessage =
  | { type: 'status'; message: string }
  | { type: 'ready'; mode: string; peer?: string; idServer?: string; relay?: string; key?: string }
  | { type: 'bridge-echo'; [k: string]: unknown }
  | { type: 'mouse'; x: number; y: number; button: number; action: string }
  | { type: 'key'; code: string; down: boolean }
  | { type: 'scroll'; deltaY: number };
