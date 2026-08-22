#!/usr/bin/env bash
# Configura SSH del Cloud Agent (cloudflared + clave + túnel TCP 2222).
# Ejecutar en la VM del agente Cursor Cloud.
set -euo pipefail

CF="${CLOUDFLARED_BIN:-/tmp/cloudflared}"
if [[ ! -x "$CF" ]]; then
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
  chmod +x /tmp/cloudflared
  CF=/tmp/cloudflared
fi

mkdir -p ~/.ssh
chmod 700 ~/.ssh

cat > ~/.ssh/config << EOF
Host server.albesa.tech
  User ats-server
  ProxyCommand ${CF} access ssh --hostname %h
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  IdentityFile ~/.ssh/ats_deploy
  IdentitiesOnly yes

Host ats-server
  HostName server.albesa.tech
  User ats-server
  ProxyCommand ${CF} access ssh --hostname %h
  IdentityFile ~/.ssh/ats_deploy
  IdentitiesOnly yes

# Túnel TCP local (alternativa a ProxyCommand)
Host ats-server-tcp
  HostName 127.0.0.1
  Port 2222
  User ats-server
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  IdentityFile ~/.ssh/ats_deploy
  IdentitiesOnly yes
EOF

if [[ ! -f ~/.ssh/ats_deploy ]]; then
  ssh-keygen -t ed25519 -N "" -f ~/.ssh/ats_deploy -C "cursor-cloud-ats-desk" -q
  echo "Nueva clave — añade a scripts/server/cursor-agent-pubkeys.txt:"
  cat ~/.ssh/ats_deploy.pub
fi

echo "SSH config listo."
echo "Inicia túnel TCP (opcional): ${CF} access tcp --hostname server.albesa.tech --url 127.0.0.1:2222"
echo "Tras autorizar clave en servidor: ssh server.albesa.tech hostname"
