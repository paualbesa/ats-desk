#!/usr/bin/env bash
# Configura SSH del Cloud Agent (cloudflared + config idéntico a Windows).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CF="${CLOUDFLARED_BIN:-/tmp/cloudflared}"
if [[ ! -x "$CF" ]]; then
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
  chmod +x /tmp/cloudflared
  CF=/tmp/cloudflared
fi

chmod +x "${ROOT}/scripts/ssh-cloudflared-proxy.sh"

mkdir -p ~/.ssh
chmod 700 ~/.ssh

if [[ -n "${ATS_SSH_PRIVATE_KEY:-}" ]]; then
  echo "$ATS_SSH_PRIVATE_KEY" > ~/.ssh/ats_deploy
  chmod 600 ~/.ssh/ats_deploy
  echo "Clave ATS_SSH_PRIVATE_KEY cargada en ~/.ssh/ats_deploy"
elif [[ ! -f ~/.ssh/ats_deploy ]]; then
  ssh-keygen -t ed25519 -N "" -f ~/.ssh/ats_deploy -C "cursor-cloud-ats-desk" -q
  echo "Nueva clave — añade a scripts/server/cursor-agent-pubkeys.txt:"
  cat ~/.ssh/ats_deploy.pub
fi

cat > ~/.ssh/config << EOF
Host server.albesa.tech
  User ats-server
  ProxyCommand ${ROOT}/scripts/ssh-cloudflared-proxy.sh %h
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  IdentityFile ~/.ssh/ats_deploy
  IdentitiesOnly yes

Host ats-server
  HostName server.albesa.tech
  User ats-server
  ProxyCommand ${ROOT}/scripts/ssh-cloudflared-proxy.sh %h
  IdentityFile ~/.ssh/ats_deploy
  IdentitiesOnly yes
EOF

echo "SSH listo (ProxyCommand cloudflared access ssh — igual que Windows)."
echo "Probar: ssh server.albesa.tech hostname"
