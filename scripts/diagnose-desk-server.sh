#!/usr/bin/env bash
# Diagnóstico ATS Desk — ejecutar EN EL SERVIDOR (ats-server@server.albesa.tech)
set -euo pipefail

echo "========== ATS Desk diagnóstico =========="
echo "Fecha: $(date -Iseconds)"
echo "Hostname: $(hostname)"
echo "IP pública: $(curl -4 -s --max-time 5 ifconfig.me || echo '?')"
echo ""

echo "==> PM2"
pm2 list 2>/dev/null || echo "PM2 no disponible"
echo ""
pm2 logs ats-desk --lines 25 --nostream 2>/dev/null || true
echo ""

echo "==> Procesos hbbs/hbbr"
ps aux | grep -E '[h]bbs|[h]bbr' || echo "NINGUNO — este es el problema"
echo ""

echo "==> Puertos en escucha"
ss -tlnp 2>/dev/null | grep -E '2111[5-9]' || netstat -tlnp 2>/dev/null | grep -E '2111[5-9]' || echo "No se ven puertos 21115-21119"
echo ""

echo "==> UFW"
sudo ufw status 2>/dev/null | head -25 || true
echo ""

DATA="${ATS_DESK_DATA_DIR:-$HOME/rustdesk-data}"
echo "==> Clave pública hbbs ($DATA/id_ed25519.pub)"
if [[ -f "$DATA/id_ed25519.pub" ]]; then
  cat "$DATA/id_ed25519.pub"
else
  echo "NO EXISTE — hbbs nunca arrancó bien"
fi
echo ""

echo "==> Test local WebSocket 21118"
if command -v python3 >/dev/null; then
  python3 - <<'PY' || true
import socket
s = socket.socket()
s.settimeout(3)
try:
    s.connect(('127.0.0.1', 21118))
    print('TCP 127.0.0.1:21118 — conexión OK (hbbs WS escuchando)')
except Exception as e:
    print('TCP 127.0.0.1:21118 — FALLO:', e)
finally:
    s.close()
PY
fi
echo ""

echo "==> Test local hbbs 21116"
python3 - <<'PY' || true
import socket
s = socket.socket()
s.settimeout(3)
try:
    s.connect(('127.0.0.1', 21116))
    print('TCP 127.0.0.1:21116 — conexión OK')
except Exception as e:
    print('TCP 127.0.0.1:21116 — FALLO:', e)
finally:
    s.close()
PY
echo ""

echo "==> Nginx"
systemctl is-active nginx 2>/dev/null || echo "nginx no activo"
echo ""
echo "Si WebSocket falla pero 21116 OK → ejecuta: bash scripts/fix-desk-websocket.sh"
echo "=========================================="
