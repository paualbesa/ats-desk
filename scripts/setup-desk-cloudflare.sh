#!/usr/bin/env bash
# Configura desk.albesa.tech en Cloudflare: túnel HTTP + DNS (sin registro A conflictivo).
# Requiere API token con: Zone DNS Edit, Cloudflare Tunnel Edit (cuenta).
#
# Uso:
#   CLOUDFLARE_API_TOKEN=xxx bash scripts/setup-desk-cloudflare.sh
#
# Opcional:
#   DESK_PUBLIC_IP=150.228.85.130   # solo si mantienes registro A (nube gris) además del túnel
#   DESK_TUNNEL_MODE=http           # http (default) | dns-only
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-}"
ZONE_NAME="${CLOUDFLARE_ZONE:-albesa.tech}"
RECORD_NAME="${CLOUDFLARE_RECORD:-desk}"
FQDN="${RECORD_NAME}.${ZONE_NAME}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-f000a0d872b09f71e294ac20d1510251}"
TUNNEL_ID="${CLOUDFLARE_TUNNEL_ID:-774d36ad-38a1-48e5-bf4d-f65fde774cd0}"
MODE="${DESK_TUNNEL_MODE:-http}"

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: Define CLOUDFLARE_API_TOKEN"
  echo ""
  echo "Crear token: https://dash.cloudflare.com/profile/api-tokens"
  echo "  Permisos: Zone DNS Edit (albesa.tech) + Account Cloudflare Tunnel Edit"
  exit 1
fi

api() {
  local method="$1" path="$2"
  shift 2
  curl -s -X "$method" "https://api.cloudflare.com/client/v4${path}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

echo "==> Verificar token"
api GET /user/tokens/verify | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d.get('success'):
    print('Token inválido:', d.get('errors'))
    sys.exit(1)
print('Token OK')
"

echo "==> Zone ID"
ZONE_ID=$(api GET "/zones?name=${ZONE_NAME}" | python3 -c "
import sys, json
r = json.load(sys.stdin)['result']
print(r[0]['id'] if r else '')
")
[[ -n "$ZONE_ID" ]] || { echo "Zone no encontrada: ${ZONE_NAME}"; exit 1; }
echo "   ${ZONE_ID}"

if [[ "$MODE" == "http" ]]; then
  echo "==> Configuración actual del túnel ${TUNNEL_ID}"
  CURRENT=$(api GET "/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations")
  echo "$CURRENT" | python3 -m json.tool | head -40

  echo "==> Añadir hostname ${FQDN} → http://localhost:80 (conservando reglas existentes)"
  PAYLOAD=$(echo "$CURRENT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cfg = d.get('result', {}).get('config', {}) or {}
ingress = list(cfg.get('ingress') or [])
# quitar regla desk previa y catch-all final
ingress = [r for r in ingress if r.get('hostname') != '${FQDN}']
ingress = [r for r in ingress if r.get('service') != 'http_status:404']
ingress.append({'hostname': '${FQDN}', 'service': 'http://localhost:80'})
ingress.append({'service': 'http_status:404'})
print(json.dumps({'config': {'ingress': ingress}}))
")

  api PUT "/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations" --data "$PAYLOAD" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Túnel actualizado' if d.get('success') else d)
sys.exit(0 if d.get('success') else 1)
"

  echo "==> DNS: eliminar registro A de ${FQDN} (el túnel usa CNAME proxied)"
  EXISTING=$(api GET "/zones/${ZONE_ID}/dns_records?type=A&name=${FQDN}")
  echo "$EXISTING" | python3 -c "
import sys, json
for r in json.load(sys.stdin).get('result', []):
    print(r['id'])
" | while read -r rid; do
    [[ -n "$rid" ]] || continue
    echo "   Borrando A record ${rid}"
    api DELETE "/zones/${ZONE_ID}/dns_records/${rid}" >/dev/null
  done
  echo "   (Si el CNAME del túnel no aparece solo, añádelo en Zero Trust → Tunnels → Public Hostname)"
fi

if [[ "$MODE" == "dns-only" ]]; then
  PUBLIC_IP="${DESK_PUBLIC_IP:-$(curl -4 -s --max-time 8 ifconfig.me)}"
  [[ -n "$PUBLIC_IP" ]] || { echo "Define DESK_PUBLIC_IP"; exit 1; }
  echo "==> DNS A ${FQDN} → ${PUBLIC_IP} (proxied=false)"
  EXISTING=$(api GET "/zones/${ZONE_ID}/dns_records?type=A&name=${FQDN}")
  RECORD_ID=$(echo "$EXISTING" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(r[0]['id'] if r else '')")
  BODY=$(python3 -c "import json; print(json.dumps({'type':'A','name':'${RECORD_NAME}','content':'${PUBLIC_IP}','ttl':120,'proxied':False}))")
  if [[ -n "$RECORD_ID" ]]; then
    api PUT "/zones/${ZONE_ID}/dns_records/${RECORD_ID}" --data "$BODY" | python3 -m json.tool
  else
    api POST "/zones/${ZONE_ID}/dns_records" --data "$BODY" | python3 -m json.tool
  fi
fi

echo ""
echo "==> Comprobación"
echo "DNS:"
dig +short "${FQDN}" A CNAME || true
echo ""
echo "Health (túnel HTTPS o A directo):"
curl -sS -m 10 "https://${FQDN}/health" 2>/dev/null || curl -sS -m 10 "http://${FQDN}/health" 2>/dev/null || echo "(aún no responde — espera 1-2 min o revisa Ruijie para 21116)"
echo ""
echo "Listo."
