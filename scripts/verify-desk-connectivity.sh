#!/usr/bin/env bash
# Verifica conectividad ATS Desk y muestra IP pública vs DNS.
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
PUBLIC_IP="$(curl -4 -s --max-time 5 ifconfig.me || echo '?')"
DNS_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || echo '?')"

echo "========== ATS Desk connectivity =========="
echo "IP pública salida:  $PUBLIC_IP"
echo "DNS $DOMAIN → $DNS_IP"
echo ""

if [[ "$PUBLIC_IP" != "?" && "$DNS_IP" != "?" && "$PUBLIC_IP" != "$DNS_IP" ]]; then
  echo "⚠️  AVISO: la IP pública ($PUBLIC_IP) NO coincide con el DNS ($DNS_IP)."
  echo "   Starlink suele usar otra IP para tráfico entrante."
  echo "   Si los clientes no conectan, prueba en Cloudflare DNS:"
  echo "   $DOMAIN → A → $PUBLIC_IP (o la IP de entrada que veas en el router Starlink)"
  echo ""
fi

echo "==> Servicios locales"
curl -sf --max-time 2 "http://127.0.0.1/health" -H "Host: $DOMAIN" && echo "nginx /health OK" || echo "nginx /health FALLO"
pgrep -x hbbs >/dev/null && echo "hbbs OK" || echo "hbbs NO CORRE"
pgrep -x hbbr >/dev/null && echo "hbbr OK" || echo "hbbr NO CORRE"

echo ""
echo "==> Clave pública"
cat "${ATS_DESK_DATA_DIR:-$HOME/rustdesk-data}/id_ed25519.pub" 2>/dev/null || echo "sin clave"

echo ""
echo "==> Puertos"
ss -tlnup 2>/dev/null | grep -E '2111[5-9]|:80 ' || true

echo ""
echo "Clientes deben usar: desk.albesa.tech:21116 (NO server.albesa.tech)"
echo "=========================================="
