#!/usr/bin/env bash
# ProxyCommand para SSH vía Cloudflare Access (igual que Windows).
CF="${CLOUDFLARED_BIN:-/tmp/cloudflared}"
ARGS=(access ssh --hostname "${1:-server.albesa.tech}")
if [[ -n "${CF_ACCESS_CLIENT_ID:-}" && -n "${CF_ACCESS_CLIENT_SECRET:-}" ]]; then
  ARGS+=(--service-token-id "$CF_ACCESS_CLIENT_ID" --service-token-secret "$CF_ACCESS_CLIENT_SECRET")
fi
exec "$CF" "${ARGS[@]}"
