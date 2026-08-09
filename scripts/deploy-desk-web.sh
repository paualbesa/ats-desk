#!/usr/bin/env bash
# Despliega desk-web en el servidor (nginx root o PM2 serve).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
DEPLOY_DIR="${DESK_WEB_DIR:-/var/www/desk.albesa.tech}"
PORT="${DESK_WEB_PORT:-3080}"

bash "${ROOT}/scripts/build-desk-web.sh"

if [[ "${1:-}" == "--local" ]]; then
  echo "Build listo en desk-web/dist (modo local)"
  exit 0
fi

sudo mkdir -p "$DEPLOY_DIR"
sudo rsync -a --delete "${ROOT}/desk-web/dist/" "${DEPLOY_DIR}/"
echo "Desplegado en ${DEPLOY_DIR}"

if command -v pm2 >/dev/null; then
  pm2 delete desk-web 2>/dev/null || true
  pm2 start "${ROOT}/scripts/ecosystem.desk-web.config.cjs"
  pm2 save
  echo "PM2 desk-web en puerto ${PORT}"
fi

echo "Recarga nginx si usas proxy: sudo systemctl reload nginx"
echo "URL: https://${DOMAIN}"
