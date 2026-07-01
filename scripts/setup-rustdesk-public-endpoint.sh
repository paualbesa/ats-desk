#!/usr/bin/env bash
# Configura RustDesk en el servidor Starlink: relay por IP pública + PM2.
# Ejecutar en el servidor: bash scripts/setup-rustdesk-public-endpoint.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOME_DIR="${HOME:-/home/ats-server}"
PUBLIC_IP="$(curl -4 -s --max-time 8 ifconfig.me || true)"

if [[ -z "$PUBLIC_IP" ]]; then
  echo "ERROR: No se pudo obtener la IP pública."
  exit 1
fi

echo "==> IP pública detectada: $PUBLIC_IP"

# Instalar binarios si faltan
if [[ ! -x "$HOME_DIR/bin/hbbs" ]]; then
  echo "==> Instalando hbbs/hbbr..."
  bash "$ROOT/scripts/setup-rustdesk-pm2.sh"
fi

export RELAY_HOST="$PUBLIC_IP"
export RELAY_PORT="21117"
export ATS_DESK_BIN_DIR="$HOME_DIR/bin"
export ATS_DESK_DATA_DIR="$HOME_DIR/rustdesk-data"

echo "==> Reiniciando PM2 ats-desk (relay -> ${RELAY_HOST}:${RELAY_PORT})"
pm2 delete ats-desk 2>/dev/null || true
cd "$ROOT"
pm2 start scripts/ecosystem.ats-desk.config.cjs
pm2 save

sleep 2
echo ""
echo "==> Estado"
pm2 list | grep ats-desk || true
ss -tulpn | grep -E '2111[5-9]' || true
echo ""
echo "Clave pública (para custom_client_config.json):"
cat "$ATS_DESK_DATA_DIR/id_ed25519.pub" 2>/dev/null || echo "(se generará al primer arranque)"
echo ""
echo "==> Config cliente recomendada"
cat <<EOF
{
  "custom-rendezvous-server": "${PUBLIC_IP}:21116",
  "relay-server": "${PUBLIC_IP}:21117",
  "key": "$(cat "$ATS_DESK_DATA_DIR/id_ed25519.pub" 2>/dev/null || echo 'PEGAR_CLAVE')"
}
EOF
echo ""
echo "Opcional: crea DNS A desk.albesa.tech -> ${PUBLIC_IP} (nube gris) y usa desk.albesa.tech en lugar de la IP."
echo "Script DNS: CLOUDFLARE_API_TOKEN=... bash scripts/cloudflare-desk-dns.sh"
