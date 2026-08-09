#!/usr/bin/env bash
# Despliega desk-web en el servidor ats-server (sin sudo: PM2 + nginx manual).
set -euo pipefail
REPO="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"
cd "$REPO"
git fetch origin main
git reset --hard origin/main
bash scripts/build-desk-web.sh
DESK_WEB_DIR="$HOME/www/desk.albesa.tech"
mkdir -p "$DESK_WEB_DIR"
rsync -a --delete desk-web/dist/ "$DESK_WEB_DIR/"
pm2 delete desk-web 2>/dev/null || true
DESK_WEB_PORT=3080 pm2 start scripts/ecosystem.desk-web.config.cjs
pm2 save
echo "desk-web en :3080 — recarga nginx: sudo DESK_DOMAIN=desk.albesa.tech bash scripts/fix-desk-websocket.sh"
