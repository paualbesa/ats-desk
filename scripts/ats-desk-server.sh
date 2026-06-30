#!/usr/bin/env bash
# Arranca hbbs + hbbr como un único proceso supervisado por PM2 (nombre: ats-desk).
set -uo pipefail

BIN_DIR="${ATS_DESK_BIN_DIR:-${HOME}/bin}"
DATA_DIR="${ATS_DESK_DATA_DIR:-${HOME}/rustdesk-data}"
RELAY_HOST="${RELAY_HOST:-server.albesa.tech}"
RELAY_PORT="${RELAY_PORT:-21117}"

mkdir -p "$DATA_DIR"
cd "$DATA_DIR"

HBBS="${BIN_DIR}/hbbs"
HBBR="${BIN_DIR}/hbbr"

if [[ ! -x "$HBBS" || ! -x "$HBBR" ]]; then
  echo "ERROR: No se encuentran hbbs/hbbr en $BIN_DIR"
  exit 1
fi

HBBS_PID=""
HBBR_PID=""

shutdown() {
  [[ -n "$HBBS_PID" ]] && kill "$HBBS_PID" 2>/dev/null || true
  [[ -n "$HBBR_PID" ]] && kill "$HBBR_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap shutdown EXIT INT TERM

echo "[ats-desk] Iniciando hbbs (ID) -> relay ${RELAY_HOST}:${RELAY_PORT}"
"$HBBS" -r "${RELAY_HOST}:${RELAY_PORT}" &
HBBS_PID=$!

echo "[ats-desk] Iniciando hbbr (relay)"
"$HBBR" &
HBBR_PID=$!

# Si uno cae, salimos y PM2 reinicia el conjunto completo.
wait -n "$HBBS_PID" "$HBBR_PID" 2>/dev/null || wait
EXIT_CODE=$?
echo "[ats-desk] Un proceso terminó (código $EXIT_CODE), reiniciando..."
exit "${EXIT_CODE:-1}"
