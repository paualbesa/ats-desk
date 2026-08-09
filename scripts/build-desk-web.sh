#!/usr/bin/env bash
# Extrae rustdesk-web y construye desk-web para desk.albesa.tech
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${ROOT}/mobile-expo/assets/rustdesk-web.zip"
WEB="${ROOT}/desk-web"
PUBLIC="${WEB}/public/rustdesk-web"

if [[ ! -f "$ZIP" ]]; then
  echo "ERROR: no existe $ZIP"
  exit 1
fi

rm -rf "$PUBLIC"
mkdir -p "$PUBLIC"
unzip -q -o "$ZIP" -d "$PUBLIC"
# zip suele incluir carpeta rustdesk-web/
if [[ -d "${PUBLIC}/rustdesk-web" ]]; then
  mv "${PUBLIC}/rustdesk-web"/* "${PUBLIC}/"
  rmdir "${PUBLIC}/rustdesk-web" 2>/dev/null || rm -rf "${PUBLIC}/rustdesk-web"
fi

cd "$WEB"
npm install
npm run build
echo "OK: ${WEB}/dist"
