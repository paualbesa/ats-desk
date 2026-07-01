#!/usr/bin/env bash
# Crea/actualiza desk.albesa.tech -> IP pública del servidor (DNS only, sin proxy).
# Uso: CLOUDFLARE_API_TOKEN=xxx bash scripts/cloudflare-desk-dns.sh
set -euo pipefail

ZONE_NAME="${CLOUDFLARE_ZONE:-albesa.tech}"
RECORD_NAME="${CLOUDFLARE_RECORD:-desk}"
TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: Define CLOUDFLARE_API_TOKEN (permiso Zone.DNS Edit)."
  echo "Manual: Cloudflare DNS -> A record '${RECORD_NAME}' -> IP pública (curl -4 ifconfig.me) -> Solo DNS (gris)"
  exit 1
fi

PUBLIC_IP="${DESK_PUBLIC_IP:-$(curl -4 -s --max-time 8 ifconfig.me)}"
if [[ -z "$PUBLIC_IP" ]]; then
  echo "ERROR: No se pudo detectar IP pública. Usa DESK_PUBLIC_IP=..."
  exit 1
fi

ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'])")

FQDN="${RECORD_NAME}.${ZONE_NAME}"
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&name=${FQDN}" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json")

RECORD_ID=$(echo "$EXISTING" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(r[0]['id'] if r else '')")

PAYLOAD=$(python3 -c "import json; print(json.dumps({'type':'A','name':'${RECORD_NAME}','content':'${PUBLIC_IP}','ttl':120,'proxied':False}))")

if [[ -n "$RECORD_ID" ]]; then
  echo "Actualizando ${FQDN} -> ${PUBLIC_IP}"
  curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    --data "$PAYLOAD" | python3 -m json.tool
else
  echo "Creando ${FQDN} -> ${PUBLIC_IP}"
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    --data "$PAYLOAD" | python3 -m json.tool
fi

echo "Listo. Prueba: nslookup ${FQDN}  &&  Test-NetConnection ${FQDN} -Port 21116"
