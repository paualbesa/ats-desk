#!/usr/bin/env bash
# Para ATS Desk antes de actualizar binarios manualmente.
set -euo pipefail
echo "Deteniendo ats-desk..."
pm2 stop ats-desk 2>/dev/null || true
pm2 delete ats-desk 2>/dev/null || true
pkill -x hbbs 2>/dev/null || true
pkill -x hbbr 2>/dev/null || true
sleep 2
pkill -9 -x hbbs 2>/dev/null || true
pkill -9 -x hbbr 2>/dev/null || true
echo "Listo. Ya puedes copiar hbbs/hbbr o ejecutar fix-desk-websocket.sh"
