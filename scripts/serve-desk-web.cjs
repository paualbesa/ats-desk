/**
 * Sirve desk-web/dist: SPA React en / y archivos estáticos en /rustdesk-web/
 * (serve -s reenvía todo a index.html y rompe el cliente RustDesk embebido).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../desk-web/dist');
const PORT = Number(process.env.DESK_WEB_PORT || 3080);
const RUSTDESK_ROOT = path.join(ROOT, 'rustdesk-web');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safeJoin(base, urlPath) {
  const rel = urlPath.split('?')[0].split('#')[0];
  const decoded = decodeURIComponent(rel);
  const joined = path.normalize(path.join(base, decoded));
  if (!joined.startsWith(base)) return null;
  return joined;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/health') {
    send(res, 200, 'ok', { 'Content-Type': 'text/plain' });
    return;
  }

  if (url.startsWith('/rustdesk-web/') || url === '/rustdesk-web') {
    const sub = url === '/rustdesk-web' ? '/index.html' : url.slice('/rustdesk-web'.length);
    const file = safeJoin(RUSTDESK_ROOT, sub || '/index.html');
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      send(res, 404, 'rustdesk-web not found');
      return;
    }
    serveFile(res, file);
    return;
  }

  const file = safeJoin(ROOT, url);
  if (file && fs.existsSync(file) && !fs.statSync(file).isDirectory()) {
    serveFile(res, file);
    return;
  }

  const index = path.join(ROOT, 'index.html');
  if (fs.existsSync(index)) {
    serveFile(res, index);
    return;
  }

  send(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`desk-web static server on :${PORT} (root=${ROOT})`);
});
