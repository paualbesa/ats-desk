# Scripts del servidor (`ats-server@server.albesa.tech`)

## Acceso SSH (Cloud Agent / CI)

1. **Una vez** desde tu PC (ya tienes `cloudflared access ssh`):

```powershell
ssh server.albesa.tech "curl -fsSL https://raw.githubusercontent.com/paualbesa/ats-desk/main/scripts/server/one-shot-bootstrap.sh | bash"
```

2. Tras eso, el Cloud Agent puede usar:

```bash
ssh server.albesa.tech
```

Las claves autorizadas están en `cursor-agent-pubkeys.txt` (se fusionan con `install-cloud-agent-ssh.sh`).

## Pantalla negra al conectar (sin HDMI)

```bash
bash scripts/server/fix-remote-black-screen.sh
```

En Windows (PC controlado):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\server\fix-remote-black-screen.ps1
```

Causas habituales: sin monitor físico, renderizado D3D activo (`allow-d3d-render` → `N`), falta driver de pantalla virtual.

## Todo en uno

```bash
bash scripts/server/bootstrap-all.sh
```
