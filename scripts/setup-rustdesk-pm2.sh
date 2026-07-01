#!/usr/bin/env bash
# Instala RustDesk server y lo arranca con PM2 como UN solo proceso: ats-desk
set -euo pipefail

RELAY_HOST="${RELAY_HOST:-server.albesa.tech}"
RELAY_PORT="${RELAY_PORT:-21117}"
VERSION="${RUSTDESK_VERSION:-1.1.15}"
BIN_DIR="${HOME}/bin"
DATA_DIR="${HOME}/rustdesk-data"
REPO_DIR="${ATS_DESK_REPO:-${HOME}/albesa/ats-desk}"

mkdir -p "$BIN_DIR" "$DATA_DIR"

if [[ ! -f "$BIN_DIR/hbbs" ]]; then
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

chmod +x "$REPO_DIR/scripts/ats-desk-server.sh" 2>/dev/null || true

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: PM2 no instalado. Instala con: npm install -g pm2"
  exit 1
fi

echo "==> Deteniendo procesos antiguos..."
pm2 delete rustdesk-hbbs 2>/dev/null || true
pm2 delete rustdesk-hbbr 2>/dev/null || true
pm2 delete ats-desk 2>/dev/null || true

echo "==> Iniciando proceso único PM2: ats-desk"
cd "$REPO_DIR"
export RELAY_HOST RELAY_PORT
export ATS_DESK_BIN_DIR="$BIN_DIR"
export ATS_DESK_DATA_DIR="$DATA_DIR"
pm2 start scripts/ecosystem.ats-desk.config.cjs
pm2 save

echo ""
pm2 describe ats-desk 2>/dev/null | head -20 || pm2 list
echo ""
if [[ -f "$DATA_DIR/id_ed25519.pub" ]]; then
  echo "Clave pública:"
  cat "$DATA_DIR/id_ed25519.pub"
fi
echo ""
echo "Puertos: 21115/tcp, 21116/tcp+udp, 21117/tcp, 21118/tcp, 21119/tcp"
