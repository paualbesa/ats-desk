#!/usr/bin/env bash
# Arranque completo en ats-server: claves agente, desk-web, estado RustDesk.
set -euo pipefail

REPO="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"
cd "$REPO"
git fetch origin main
git reset --hard origin/main

bash scripts/server/install-cloud-agent-ssh.sh
bash scripts/server/fix-remote-black-screen.sh
bash scripts/remote-deploy-desk-web.sh

echo "=== PM2 ==="
pm2 list

echo "=== RustDesk ==="
pm2 describe ats-desk 2>/dev/null | head -15 || echo "ats-desk no en PM2"

echo "=== desk-web rustdesk shell ==="
curl -sS http://127.0.0.1:3080/rustdesk-web/index.html | head -3
