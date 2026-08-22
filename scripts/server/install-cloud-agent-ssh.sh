#!/usr/bin/env bash
# Instala claves SSH del Cloud Agent en ats-server (ejecutar EN EL SERVIDOR como ats-server).
set -euo pipefail

REPO="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"
KEYS_FILE="${REPO}/scripts/server/cursor-agent-pubkeys.txt"
AUTH="${HOME}/.ssh/authorized_keys"

mkdir -p "${HOME}/.ssh"
chmod 700 "${HOME}/.ssh"
touch "$AUTH"
chmod 600 "$AUTH"

if [[ ! -f "$KEYS_FILE" ]]; then
  echo "No encuentro $KEYS_FILE — haz git pull en $REPO"
  exit 1
fi

added=0
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] && continue
  if grep -qxF "$line" "$AUTH" 2>/dev/null; then
    echo "ya presente: ${line:0:60}…"
  else
    echo "$line" >> "$AUTH"
    echo "añadida: ${line:0:60}…"
    added=$((added + 1))
  fi
done < "$KEYS_FILE"

echo "Listo ($added nuevas). Probar desde el agente:"
echo "  ssh server.albesa.tech hostname"
