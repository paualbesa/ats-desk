#!/usr/bin/env bash
# Arregla WebSocket (21118) + nginx proxy /ws/id para cliente móvil/web.
# Ejecutar EN EL SERVIDOR: bash scripts/fix-desk-websocket.sh
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
VERSION="${RUSTDESK_VERSION:-1.1.15}"
BIN_DIR="${ATS_DESK_BIN_DIR:-$HOME/bin}"
DATA_DIR="${ATS_DESK_DATA_DIR:-$HOME/rustdesk-data}"
REPO_DIR="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"

stop_rustdesk() {
  echo "==> Deteniendo ATS Desk (hbbs/hbbr deben parar antes de actualizar binarios)"
  pm2 stop ats-desk 2>/dev/null || true
  pm2 delete ats-desk 2>/dev/null || true
  pkill -x hbbs 2>/dev/null || true
  pkill -x hbbr 2>/dev/null || true
  sleep 2
  if pgrep -x hbbs >/dev/null || pgrep -x hbbr >/dev/null; then
    echo "Forzando cierre de procesos restantes..."
    pkill -9 -x hbbs 2>/dev/null || true
    pkill -9 -x hbbr 2>/dev/null || true
    sleep 1
  fi
}

install_binary() {
  local src="$1"
  local dst="$2"
  install -m 755 "$src" "${dst}.new"
  mv -f "${dst}.new" "$dst"
}

echo "========== fix-desk-websocket =========="
stop_rustdesk

echo "==> 1. Descargar RustDesk server ${VERSION}"
mkdir -p "$BIN_DIR" "$DATA_DIR"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
wget -q "https://github.com/rustdesk/rustdesk-server/releases/download/${VERSION}/rustdesk-server-linux-amd64.zip" -O rd-server.zip
unzip -q -o rd-server.zip -d rd-extract

echo "==> 2. Instalar hbbs y hbbr en ${BIN_DIR}"
for bin in hbbs hbbr; do
  f=$(find rd-extract -name "$bin" -type f | head -1)
  if [[ -z "$f" ]]; then
    echo "ERROR: no se encontró $bin en el zip"
    exit 1
  fi
  install_binary "$f" "${BIN_DIR}/${bin}"
  echo "   OK ${bin}"
done
"${BIN_DIR}/hbbs" --version 2>/dev/null || true

echo "==> 3. Arrancar PM2 (relay = ${DOMAIN})"
export RELAY_HOST="${DOMAIN}"
export RELAY_PORT="21117"
export ATS_DESK_BIN_DIR="$BIN_DIR"
export ATS_DESK_DATA_DIR="$DATA_DIR"
cd "$REPO_DIR"
pm2 start scripts/ecosystem.ats-desk.config.cjs
pm2 save
sleep 4

if ! pgrep -x hbbs >/dev/null; then
  echo "ERROR: hbbs no arrancó. Revisa: pm2 logs ats-desk --lines 30"
  exit 1
fi
echo "   hbbs/hbbr en ejecución"

echo "==> 4. Nginx (proxy WebSocket en puerto 80)"
if ! command -v nginx >/dev/null; then
  sudo apt-get update -y -qq
  sudo apt-get install -y -qq nginx
fi

sudo tee "/etc/nginx/sites-available/${DOMAIN}.conf" >/dev/null <<NGINX
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

sudo ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/${DOMAIN}.conf"
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

if ! sudo nginx -t; then
  echo "ERROR: configuración nginx inválida"
  exit 1
fi

sudo systemctl enable nginx
if ! sudo systemctl start nginx; then
  echo "Intentando ver por qué nginx no arranca:"
  sudo journalctl -u nginx --no-pager -n 20 || true
  echo ""
  echo "¿Puerto 80 ocupado? ss -tlnp | grep ':80'"
  ss -tlnp | grep ':80' || true
  exit 1
fi
sudo systemctl reload nginx 2>/dev/null || true

echo "==> 5. Firewall"
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 21115:21119/tcp 2>/dev/null || true
sudo ufw allow 21116/udp 2>/dev/null || true

echo ""
echo "==> 6. Verificación"
echo "PM2:"
pm2 list | grep -E 'ats-desk|name' || pm2 list
echo ""
echo "Puertos:"
ss -tlnp 2>/dev/null | grep -E '2111[5-9]|:80 ' || netstat -tlnp 2>/dev/null | grep -E '2111[5-9]|:80 ' || true
echo ""
echo "Nginx: $(systemctl is-active nginx 2>/dev/null || echo '?')"
curl -s --max-time 3 "http://127.0.0.1/health" -H "Host: ${DOMAIN}" && echo " <- /health OK" || echo "/health falló"
echo ""
if [[ -f "$DATA_DIR/id_ed25519.pub" ]]; then
  echo "Clave pública del servidor:"
  cat "$DATA_DIR/id_ed25519.pub"
fi
echo ""
echo "========== LISTO =========="
echo "WebSocket: ws://${DOMAIN}/ws/id"
echo "En el móvil: npx expo start --clear"
