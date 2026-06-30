#!/usr/bin/env bash
# Instala y configura RustDesk server (hbbs + hbbr) con PM2 en Ubuntu.
# Ejecutar en el servidor: bash setup-rustdesk-pm2.sh
set -euo pipefail

RUSTDESK_DIR="${RUSTDESK_DIR:-/opt/rustdesk-server}"
RUSTDESK_VERSION="${RUSTDESK_VERSION:-1.1.11-1}"

echo "==> Instalando dependencias..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y -qq curl wget unzip

echo "==> Instalando Node.js LTS (para PM2)..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

echo "==> Instalando PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "==> Descargando RustDesk server ${RUSTDESK_VERSION}..."
sudo mkdir -p "$RUSTDESK_DIR"
cd /tmp
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)  DEB="rustdesk-server-hbbs_${RUSTDESK_VERSION}_amd64.deb" ;;
  aarch64) DEB="rustdesk-server-hbbs_${RUSTDESK_VERSION}_arm64.deb" ;;
  *) echo "Arquitectura no soportada: $ARCH"; exit 1 ;;
esac
wget -q "https://github.com/rustdesk/rustdesk-server/releases/download/${RUSTDESK_VERSION}/${DEB}" -O "$DEB"
sudo dpkg -i "$DEB" || sudo apt-get install -f -y -qq

echo "==> Configurando PM2 para hbbs y hbbr..."
sudo mkdir -p /var/lib/rustdesk
cd /var/lib/rustdesk

# Detener instancias previas si existen
pm2 delete rustdesk-hbbs 2>/dev/null || true
pm2 delete rustdesk-hbbr 2>/dev/null || true

# hbbs: ID server (puerto 21116 TCP/UDP, 21115 TCP, 21118 TCP WebSocket)
pm2 start hbbs --name rustdesk-hbbs -- -r server.albesa.tech:21117

# hbbr: relay server (puerto 21117 TCP, 21119 TCP WebSocket)
pm2 start hbbr --name rustdesk-hbbr

pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$(whoami)" --hp "$HOME" | tail -1 | bash || true

echo ""
echo "==> RustDesk server en ejecución con PM2"
pm2 status
echo ""
echo "Clave pública (copiar a custom_client_config si usas key):"
if [ -f /var/lib/rustdesk/id_ed25519.pub ]; then
  cat /var/lib/rustdesk/id_ed25519.pub
else
  echo "(se generará en el primer arranque de hbbs)"
fi
echo ""
echo "Puertos a abrir en firewall:"
echo "  21115/tcp, 21116/tcp+udp, 21117/tcp, 21118/tcp, 21119/tcp"
