#!/usr/bin/env bash
# Bootstrap remoto sin git previo — ejecutar desde Windows:
#   ssh server.albesa.tech 'bash -s' < scripts/server/one-shot-bootstrap.sh
# o:
#   ssh server.albesa.tech "curl -fsSL https://raw.githubusercontent.com/paualbesa/ats-desk/main/scripts/server/one-shot-bootstrap.sh | bash"
set -euo pipefail

REPO="${ATS_DESK_REPO:-$HOME/albesa/ats-desk}"
BRANCH="${ATS_DESK_BRANCH:-main}"
RAW_BASE="https://raw.githubusercontent.com/paualbesa/ats-desk/${BRANCH}"

mkdir -p "$(dirname "$REPO")"
if [[ ! -d "$REPO/.git" ]]; then
  echo "==> Clonando repo en $REPO"
  git clone --depth 1 -b "$BRANCH" https://github.com/paualbesa/ats-desk.git "$REPO"
else
  echo "==> git pull en $REPO"
  cd "$REPO"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

cd "$REPO"
bash scripts/server/install-cloud-agent-ssh.sh
bash scripts/server/fix-remote-black-screen.sh

if [[ -x scripts/remote-deploy-desk-web.sh ]]; then
  bash scripts/remote-deploy-desk-web.sh || echo "desk-web deploy omitido (sin node/pm2?)"
fi

echo "==> Bootstrap completo. Probar desde el agente: ssh server.albesa.tech hostname"
