#!/usr/bin/env bash
# Nginx + Let's Encrypt para cliente web RustDesk (WSS) en desk.albesa.tech
# Ejecutar en el servidor ATS (requiere sudo).
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
EMAIL="${LETSENCRYPT_EMAIL:-info@albesa.tech}"
WEB_ROOT="${DESK_WEB_ROOT:-/var/www/ats-desk-web}"

echo "==> Instalando nginx y certbot..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "==> Directorio web estático..."
sudo mkdir -p "$WEB_ROOT"
if [[ ! -f "$WEB_ROOT/index.html" ]]; then
  echo "Copia aquí el build del cliente web RustDesk (flutter build web) o extrae web_deps."
  sudo tee "$WEB_ROOT/index.html" >/dev/null <<EOF
<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=https://rustdesk.com/web/" /></head>
<body>ATS Desk Web — despliega el cliente en ${WEB_ROOT}</body></html>
EOF
fi

echo "==> Config nginx..."
sudo tee "/etc/nginx/sites-available/${DOMAIN}.conf" >/dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    root ${WEB_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
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
}
NGINX

sudo ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/"
sudo nginx -t

if [[ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
  echo "==> Certificado Let's Encrypt..."
  sudo certbot certonly --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
fi

sudo systemctl reload nginx
echo "Listo: https://${DOMAIN}  ·  WSS /ws/id y /ws/relay"
