#!/usr/bin/env bash
# Arregla WebSocket (21118) + nginx proxy /ws/id para cliente móvil/web.
# Ejecutar EN EL SERVIDOR con sudo donde haga falta.
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
VERSION="${RUSTDESK_VERSION:-1.1.15}"
BIN_DIR="${ATS_DESK_BIN_DIR:-$HOME/bin}"
DATA_DIR="${ATS_DESK_DATA_DIR:-$HOME/rustdesk-data}"
REPO_DIR="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"

echo "==> 1. Actualizar RustDesk server a ${VERSION}"
mkdir -p "$BIN_DIR" "$DATA_DIR"
cd /tmp
wget -q "https://github.com/rustdesk/rustdesk-server/releases/download/${VERSION}/rustdesk-server-linux-amd64.zip" -O rd-server.zip
unzip -o rd-server.zip -d rd-extract
for bin in hbbs hbbr; do
  f=$(find rd-extract -name "$bin" -type f | head -1)
  cp "$f" "$BIN_DIR/"
  chmod +x "$BIN_DIR/$bin"
done
"$BIN_DIR/hbbs" --version 2>/dev/null || true

echo "==> 2. Reiniciar PM2 (relay = ${DOMAIN})"
export RELAY_HOST="${DOMAIN}"
export RELAY_PORT="21117"
export ATS_DESK_BIN_DIR="$BIN_DIR"
export ATS_DESK_DATA_DIR="$DATA_DIR"
cd "$REPO_DIR"
pm2 delete ats-desk 2>/dev/null || true
pm2 start scripts/ecosystem.ats-desk.config.cjs
pm2 save
sleep 3

echo "==> 3. Nginx proxy WebSocket (puerto 80 → 21118/21119)"
sudo apt-get update -y -qq
sudo apt-get install -y -qq nginx

sudo tee "/etc/nginx/sites-available/${DOMAIN}.conf" >/dev/null <<NGINX
server {
    listen 80;
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
        proxy_read_timeout 86400;
    }

    location /ws/relay {
        proxy_pass http://127.0.0.1:21119;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }

    location / {
        default_type text/plain;
        return 200 'ATS Desk — ${DOMAIN}';
    }
}
NGINX

sudo ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/"
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo "==> 4. UFW (por si acaso)"
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 21115:21119/tcp 2>/dev/null || true
sudo ufw allow 21116/udp 2>/dev/null || true

echo ""
echo "==> 5. Verificación"
ss -tlnp | grep -E '2111[5-9]|:80 ' || true
echo ""
curl -s "http://127.0.0.1/health" -H "Host: ${DOMAIN}" || true
echo ""
if [[ -f "$DATA_DIR/id_ed25519.pub" ]]; then
  echo "Clave pública:"
  cat "$DATA_DIR/id_ed25519.pub"
fi
echo ""
echo "LISTO. Prueba desde el móvil: npx expo start --clear"
echo "WebSocket: ws://${DOMAIN}/ws/id"
