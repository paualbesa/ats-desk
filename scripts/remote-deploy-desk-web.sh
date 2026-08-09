#!/usr/bin/env bash
set -euo pipefail
REPO="/home/ats-server/albesa/ats-desk"
cd "$REPO"
echo "==> git pull"
git fetch origin main
git reset --hard origin/main
echo "==> build desk-web"
bash scripts/build-desk-web.sh
DESK_WEB_DIR="$HOME/www/desk.albesa.tech"
mkdir -p "$DESK_WEB_DIR"
rsync -a --delete desk-web/dist/ "$DESK_WEB_DIR/"
echo "Deployed to $DESK_WEB_DIR"
if command -v pm2 >/dev/null; then
  pm2 delete desk-web 2>/dev/null || true
  DESK_WEB_PORT=3080 pm2 start scripts/ecosystem.desk-web.config.cjs
  pm2 save
fi
if command -v sudo >/dev/null; then
  sudo mkdir -p /var/www/desk.albesa.tech
  sudo rsync -a --delete "$DESK_WEB_DIR/" /var/www/desk.albesa.tech/
  sudo DESK_DOMAIN=desk.albesa.tech bash scripts/fix-desk-websocket.sh
fi
curl -sf --max-time 5 http://127.0.0.1/health -H 'Host: desk.albesa.tech' && echo "local health OK"
curl -sf --max-time 8 https://desk.albesa.tech/health && echo "public health OK" || true
echo "DEPLOY_OK"
