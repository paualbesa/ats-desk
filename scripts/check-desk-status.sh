#!/usr/bin/env bash
# Comprueba desde el servidor que ATS Desk está listo y qué falta en DNS / puertos.
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
LAN_IP="${DESK_LAN_IP:-192.168.110.224}"
PUBLIC_OUT="$(curl -4 -s --max-time 5 ifconfig.me || echo '?')"
DNS_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || echo '?')"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; }

echo "========== ATS Desk — estado =========="
echo "Servidor LAN:     ${LAN_IP}"
echo "IP salida:        ${PUBLIC_OUT}"
echo "DNS ${DOMAIN}: ${DNS_IP}"
echo ""

if pgrep -x hbbs >/dev/null; then ok "hbbs en ejecución"; else fail "hbbs NO corre — pm2 restart ats-desk"; fi
if pgrep -x hbbr >/dev/null; then ok "hbbr en ejecución"; else fail "hbbr NO corre"; fi
if curl -sf --max-time 2 "http://127.0.0.1/health" -H "Host: ${DOMAIN}" >/dev/null; then
  ok "nginx /health local"
else
  fail "nginx /health local — ejecuta fix-desk-websocket.sh"
fi

KEY_FILE="${ATS_DESK_DATA_DIR:-$HOME/rustdesk-data}/id_ed25519.pub"
if [[ -f "$KEY_FILE" ]]; then
  ok "Clave: $(cat "$KEY_FILE")"
else
  fail "Sin clave pública hbbs"
fi

echo ""
if [[ "$PUBLIC_OUT" != "?" && "$DNS_IP" != "?" && "$PUBLIC_OUT" != "$DNS_IP" ]]; then
  warn "DNS (${DNS_IP}) ≠ IP salida (${PUBLIC_OUT})."
  warn "Mira la IP WAN en el Ruijie/Starlink y pon esa en Cloudflare (registro A, nube gris)."
  echo "  docs/DESK_RUIJIE_PORT_FORWARD.md"
fi

echo ""
echo "Puertos en escucha:"
ss -tlnup 2>/dev/null | grep -E '2111[5-9]|:80 ' || true

echo ""
echo "Reenvío WAN → servidor: bash scripts/diagnose-desk-portforward.sh"
echo ""
echo "Desde Windows (fuera de tu red):"
echo "  curl http://${DOMAIN}/health"
echo "  Test-NetConnection ${DOMAIN} -Port 21116"
echo ""
echo "Si health falla → túnel CF (docs/DESK_CLOUDFLARE_TUNNEL.md) o reenvío puerto 80 en Ruijie"
echo "Si 21116 falla → mapeo TCP+UDP 21116 → ${LAN_IP} en Reyee AX3000"
echo "========================================"
