#!/usr/bin/env bash
# Reinicia cloudflared (túnel SSH) y comprueba conectividad.
# Ejecutar EN EL PC del servidor cuando Cloudflare devuelve 530 / error 1033.
set -euo pipefail

echo "==> Estado cloudflared"
if command -v systemctl >/dev/null 2>&1; then
  systemctl --user status cloudflared 2>/dev/null | head -15 || true
  systemctl status cloudflared 2>/dev/null | head -15 || true
fi

echo "==> Reiniciando cloudflared"
if systemctl --user restart cloudflared 2>/dev/null; then
  echo "systemctl --user restart cloudflared OK"
elif sudo systemctl restart cloudflared 2>/dev/null; then
  echo "systemctl restart cloudflared OK"
elif command -v cloudflared >/dev/null; then
  pkill cloudflared 2>/dev/null || true
  sleep 2
  nohup cloudflared tunnel run >/tmp/cloudflared-run.log 2>&1 &
  echo "cloudflared tunnel run (manual) — revisa /tmp/cloudflared-run.log"
else
  echo "cloudflared no encontrado — instala o inicia el túnel desde el panel Cloudflare"
fi

sleep 5
echo "==> Test HTTPS server.albesa.tech"
curl -sS -m 10 -o /dev/null -w "HTTP %{http_code}\n" https://server.albesa.tech/ || echo "FALLO"

echo "==> Tras túnel OK, autorizar agente + pantalla negra:"
echo "  bash scripts/server/one-shot-bootstrap.sh"
