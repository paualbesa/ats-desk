#!/usr/bin/env bash
# Instala ATS Desk (hbbs + hbbr + nginx) en un VPS con IP pública.
# Uso (en el VPS, como root o con sudo):
#   curl -fsSL https://raw.githubusercontent.com/paualbesa/ats-desk/main/scripts/setup-desk-vps.sh | sudo bash
#   o: sudo bash scripts/setup-desk-vps.sh
#
# Antes: apunta desk.albesa.tech (A, nube gris) a la IP de este VPS.
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
VERSION="${RUSTDESK_VERSION:-1.1.15}"
DESK_USER="${DESK_USER:-${SUDO_USER:-root}}"
if [[ "$DESK_USER" == "root" ]]; then
  HOME_DIR="/root"
else
  HOME_DIR="/home/${DESK_USER}"
fi
BIN_DIR="${ATS_DESK_BIN_DIR:-${HOME_DIR}/bin}"
DATA_DIR="${ATS_DESK_DATA_DIR:-${HOME_DIR}/rustdesk-data}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${ATS_DESK_REPO:-$(dirname "$SCRIPT_DIR")}"

export DEBIAN_FRONTEND=noninteractive

echo "========== ATS Desk VPS setup =========="
echo "Dominio: ${DOMAIN}"
echo "Usuario: ${DESK_USER}"
echo "Datos:   ${DATA_DIR}"
echo ""

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ejecuta con sudo: sudo bash $0"
  exit 1
fi

echo "==> Paquetes base"
apt-get update -y -qq
apt-get install -y -qq curl wget unzip nginx ufw

echo "==> Firewall (solo en el VPS)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 21115:21119/tcp
ufw allow 21116/udp
ufw --force enable

mkdir -p "$BIN_DIR" "$DATA_DIR"
chown -R "${DESK_USER}:${DESK_USER}" "$BIN_DIR" "$DATA_DIR" 2>/dev/null || true

echo "==> RustDesk server ${VERSION}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
wget -q "https://github.com/rustdesk/rustdesk-server/releases/download/${VERSION}/rustdesk-server-linux-amd64.zip" -O "${TMP}/rd.zip"
unzip -q -o "${TMP}/rd.zip" -d "${TMP}/extract"
for bin in hbbs hbbr; do
  f=$(find "${TMP}/extract" -name "$bin" -type f | head -1)
  install -m 755 "$f" "${BIN_DIR}/${bin}"
done
chown "${DESK_USER}:${DESK_USER}" "${BIN_DIR}/hbbs" "${BIN_DIR}/hbbr"

echo "==> PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  if command -v npm >/dev/null 2>&1; then
    npm install -g pm2
  else
    apt-get install -y -qq nodejs npm || true
    npm install -g pm2
  fi
fi

# Detener instancias previas
sudo -u "${DESK_USER}" pm2 delete ats-desk 2>/dev/null || true
pkill -x hbbs 2>/dev/null || true
pkill -x hbbr 2>/dev/null || true
sleep 1

export RELAY_HOST="${DOMAIN}"
export RELAY_PORT="21117"
export ATS_DESK_BIN_DIR="$BIN_DIR"
export ATS_DESK_DATA_DIR="$DATA_DIR"

cd "$REPO_DIR"
if [[ ! -f scripts/ecosystem.ats-desk.config.cjs ]]; then
  echo "ERROR: no encuentro scripts/ecosystem.ats-desk.config.cjs en ${REPO_DIR}"
  echo "Clona el repo: git clone https://github.com/paualbesa/ats-desk.git && cd ats-desk && sudo bash scripts/setup-desk-vps.sh"
  exit 1
fi

sudo -u "${DESK_USER}" env RELAY_HOST="$RELAY_HOST" RELAY_PORT="$RELAY_PORT" \
  ATS_DESK_BIN_DIR="$BIN_DIR" ATS_DESK_DATA_DIR="$DATA_DIR" \
  pm2 start scripts/ecosystem.ats-desk.config.cjs
sudo -u "${DESK_USER}" pm2 save
sudo -u "${DESK_USER}" pm2 startup systemd -u "${DESK_USER}" --hp "${HOME_DIR}" 2>/dev/null | tail -1 | bash || true

sleep 3
if ! pgrep -x hbbs >/dev/null; then
  echo "ERROR: hbbs no arrancó. Revisa: sudo -u ${DESK_USER} pm2 logs ats-desk"
  exit 1
fi

echo "==> Nginx (${DOMAIN})"
tee "/etc/nginx/sites-available/${DOMAIN}.conf" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /health {
        default_type text/plain;
        return 200 'ok';
    }

    location /ws/id {
        proxy_pass http://127.0.0.1:21118;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }

    location /ws/relay {
        proxy_pass http://127.0.0.1:21119;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }

    location / {
        default_type text/plain;
        return 200 'ATS Desk — ${DOMAIN}';
    }
}
NGINX

ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl enable nginx
systemctl reload nginx

PUBLIC_IP=$(curl -4 -s --max-time 5 ifconfig.me || echo "?")
DNS_IP=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || echo "?")

echo ""
echo "========== LISTO =========="
echo "IP pública de este VPS: ${PUBLIC_IP}"
echo "DNS ${DOMAIN} → ${DNS_IP}"
if [[ "$PUBLIC_IP" != "?" && "$DNS_IP" != "?" && "$PUBLIC_IP" != "$DNS_IP" ]]; then
  echo ""
  echo "⚠️  Actualiza Cloudflare: registro A 'desk' → ${PUBLIC_IP} (nube gris)"
fi
echo ""
echo "Clave pública (ponla en custom_client_config.json y app móvil):"
cat "${DATA_DIR}/id_ed25519.pub"
echo ""
curl -sf "http://127.0.0.1/health" -H "Host: ${DOMAIN}" && echo " ← /health local OK"
echo ""
echo "Desde Windows:"
echo "  Test-NetConnection ${DOMAIN} -Port 21116"
echo "  curl http://${DOMAIN}/health"
echo ""
echo "En Starlink (opcional): pm2 stop ats-desk  — el VPS es el servidor oficial."
echo "Guía: docs/DESK_STARLINK_SIN_PUERTOS.md"
echo "=========================================="
