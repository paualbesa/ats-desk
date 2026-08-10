#!/usr/bin/env bash
# Despliega desk-web al servidor ats-server vía SSH (túnel CF en 127.0.0.1:2222).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_HOST="${ATS_SSH_HOST:-127.0.0.1}"
SSH_PORT="${ATS_SSH_PORT:-2222}"
SSH_USER="${ATS_SSH_USER:-ats-server}"
REMOTE_REPO="${ATS_DESK_REPO:-/home/ats-server/albesa/ats-desk}"
WEB_DIR="${ATS_DESK_WEB_DIR:-/home/ats-server/www/desk.albesa.tech}"

bash "${ROOT}/scripts/build-desk-web.sh"

SSH_OPTS=(
  -o StrictHostKeyChecking=no
  -o UserKnownHostsFile=/dev/null
  -o ConnectTimeout=30
  -p "$SSH_PORT"
)
if [[ -n "${SSH_AUTH_SOCK:-}" ]]; then
  export SSH_AUTH_SOCK
fi

echo "→ Sincronizando dist a ${SSH_USER}@${SSH_HOST}:${WEB_DIR}"
rsync -avz --delete -e "ssh ${SSH_OPTS[*]}" \
  "${ROOT}/desk-web/dist/" \
  "${SSH_USER}@${SSH_HOST}:${WEB_DIR}/"

echo "→ Reiniciando PM2 desk-web"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" bash -s <<REMOTE
set -euo pipefail
cd "${REMOTE_REPO}"
git fetch origin main
git reset --hard origin/main
pm2 delete desk-web 2>/dev/null || true
DESK_WEB_PORT=3080 pm2 start scripts/ecosystem.desk-web.config.cjs
pm2 save
REMOTE

echo "OK: https://desk.albesa.tech/rustdesk-web/index.html"
