#!/usr/bin/env bash
# Instala RustDesk server (hbbs + hbbr) con PM2 — sin sudo (instala en ~/bin y ~/rustdesk-data).
# Ejecutar en el servidor: bash scripts/setup-rustdesk-pm2.sh
set -euo pipefail

RELAY_HOST="${RELAY_HOST:-server.albesa.tech}"
RELAY_PORT="${RELAY_PORT:-21117}"
VERSION="${RUSTDESK_VERSION:-1.1.11-1}"
BIN_DIR="${HOME}/bin"
DATA_DIR="${HOME}/rustdesk-data"

mkdir -p "$BIN_DIR" "$DATA_DIR"

if [ ! -f "$BIN_DIR/hbbs" ]; then
  echo "==> Descargando RustDesk server ${VERSION}..."
  cd /tmp
  wget -q "https://github.com/rustdesk/rustdesk-server/releases/download/${VERSION}/rustdesk-server-linux-amd64.zip" -O rd-server.zip
  unzip -o rd-server.zip -d rd-server-extract
  for bin in hbbs hbbr; do
    f=$(find rd-server-extract -name "$bin" -type f | head -1)
    cp "$f" "$BIN_DIR/"
    chmod +x "$BIN_DIR/$bin"
  done
fi

export PATH="$BIN_DIR:$PATH"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: PM2 no instalado. Instala con: npm install -g pm2"
  exit 1
fi

cd "$DATA_DIR"
pm2 delete rustdesk-hbbs 2>/dev/null || true
pm2 delete rustdesk-hbbr 2>/dev/null || true

pm2 start "$BIN_DIR/hbbs" --name rustdesk-hbbs -- -r "${RELAY_HOST}:${RELAY_PORT}"
pm2 start "$BIN_DIR/hbbr" --name rustdesk-hbbr
pm2 save

echo ""
pm2 status | grep -E "rustdesk|name" || pm2 status
echo ""
if [ -f "$DATA_DIR/id_ed25519.pub" ]; then
  echo "Clave pública (añadir al cliente si se requiere):"
  cat "$DATA_DIR/id_ed25519.pub"
fi
echo ""
echo "Puertos: 21115/tcp, 21116/tcp+udp, 21117/tcp, 21118/tcp, 21119/tcp"
