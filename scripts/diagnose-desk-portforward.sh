#!/usr/bin/env bash
# Comprueba si el tráfico WAN del router llega al servidor (Ruijie / Starlink).
# Ejecutar EN EL SERVIDOR mientras alguien prueba desde fuera (móvil 4G o Windows):
#   Test-NetConnection <IP_PUBLICA> -Port 80
#   curl http://<IP_PUBLICA>/health -H "Host: desk.albesa.tech"
set -euo pipefail

DOMAIN="${DESK_DOMAIN:-desk.albesa.tech}"
LAN_IP="${DESK_LAN_IP:-192.168.110.224}"
PUBLIC_OUT="$(curl -4 -s --max-time 5 ifconfig.me || echo '?')"
DNS_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || echo '?')"
WAIT_SEC="${DIAG_WAIT_SEC:-15}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========== Diagnóstico reenvío de puertos =========="
echo "Servidor LAN:     ${LAN_IP}"
echo "IP salida:        ${PUBLIC_OUT}"
echo "DNS ${DOMAIN}: ${DNS_IP}"
echo ""
echo "Desde fuera de tu red, en otra ventana ejecuta (sustituye IP si hace falta):"
echo "  curl -m 8 http://${PUBLIC_OUT}/health -H \"Host: ${DOMAIN}\""
echo "  Test-NetConnection ${PUBLIC_OUT} -Port 21116"
echo ""
echo "Escuchando tráfico entrante en puertos 80 y 21116 durante ${WAIT_SEC}s..."
echo ""

if ! command -v tcpdump >/dev/null; then
  echo "Instalando tcpdump..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq tcpdump
fi

CAPTURE=$(
  sudo timeout "${WAIT_SEC}" tcpdump -i any -n \
    "dst host ${LAN_IP} and (tcp port 80 or tcp port 21116 or udp port 21116)" -c 3 2>&1 \
    | grep -c "IP " || true
)

echo ""
if [[ "${CAPTURE:-0}" -gt 0 ]]; then
  echo -e "${GREEN}✓${NC} Llegaron paquetes al servidor — el reenvío del Ruijie parece OK."
  echo "  Si los clientes siguen fallando, revisa DNS (debe apuntar a la IP WAN del router)."
else
  echo -e "${RED}✗${NC} NO llegó tráfico al servidor en ${WAIT_SEC}s."
  echo ""
  echo "El reenvío en el Reyee AX3000 (192.168.110.1) no está llegando a ${LAN_IP}."
  echo "Revisa en el router:"
  echo "  1. IP interna exacta: ${LAN_IP} (no otra IP DHCP)"
  echo "  2. Puerto 21116: regla TCP **y** UDP por separado si el router no permite ambos"
  echo "  3. Puerto 80 TCP → ${LAN_IP}:80"
  echo "  4. IP WAN del Ruijie (no la de salida del servidor si difieren)"
  echo "  5. Sin DMZ a otro dispositivo que robe el tráfico"
  echo ""
  echo "Mientras tanto, HTTP/WebSocket móvil puede ir por túnel CF:"
  echo "  docs/DESK_CLOUDFLARE_TUNNEL.md"
fi

if [[ "$PUBLIC_OUT" != "?" && "$DNS_IP" != "?" && "$PUBLIC_OUT" != "$DNS_IP" ]]; then
  echo ""
  echo -e "${YELLOW}!${NC} DNS (${DNS_IP}) ≠ IP salida (${PUBLIC_OUT})."
  echo "  Actualiza el registro A en Cloudflare con la IP WAN del Ruijie (nube gris)."
  echo "  CLOUDFLARE_API_TOKEN=xxx DESK_PUBLIC_IP=<IP_WAN> bash scripts/cloudflare-desk-dns.sh"
fi
echo "===================================================="
