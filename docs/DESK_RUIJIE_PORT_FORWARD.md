# Mapeo de puertos — Ruijie Reyee AX3000 → servidor ATS

El servidor ATS Desk está en **`192.168.110.224`** (LAN detrás del router `192.168.110.1`).

En el panel del **Reyee AX3000** (app o web `192.168.110.1`):

**NAT / Port forwarding / Virtual server** — crea **una regla por puerto** (o rango si el router lo permite):

| Puerto WAN | Protocolo | IP interna | Puerto LAN | Servicio |
|------------|-----------|------------|------------|----------|
| **80** | TCP | 192.168.110.224 | 80 | nginx (health + WebSocket móvil) |
| 21115 | TCP | 192.168.110.224 | 21115 | hbbs NAT test |
| **21116** | **TCP + UDP** | 192.168.110.224 | 21116 | **hbbs ID (obligatorio UDP)** |
| 21117 | TCP | 192.168.110.224 | 21117 | hbbr relay |
| 21118 | TCP | 192.168.110.224 | 21118 | WebSocket ID |
| 21119 | TCP | 192.168.110.224 | 21119 | WebSocket relay |

Sin **UDP 21116**, los clientes suelen fallar aunque TCP “conecte”.

## IP pública y DNS

1. En el router Ruijie, mira la **IP WAN** (entrada desde Starlink).
2. En **Cloudflare DNS** → `desk.albesa.tech`:
   - Tipo **A**
   - IP = la **WAN del Ruijie** (puede diferir de `curl ifconfig.me` en el servidor)
   - **Solo DNS (nube gris)** — sin proxy naranja

Actualizar DNS desde el servidor (si tienes token API):

```bash
CLOUDFLARE_API_TOKEN=xxx DESK_PUBLIC_IP=<IP_WAN_RUIJIE> bash scripts/cloudflare-desk-dns.sh
```

## Comprobar que el reenvío llega al servidor

En el servidor (SSH):

```bash
cd ~/albesa/ats-desk && bash scripts/diagnose-desk-portforward.sh
```

Mientras corre el script, desde **4G o fuera de casa** (no Wi‑Fi local):

```powershell
curl http://<IP_PUBLICA>/health -H "Host: desk.albesa.tech"
Test-NetConnection <IP_PUBLICA> -Port 21116
```

- Si el script dice **NO llegó tráfico**, el mapeo del Ruijie está mal (IP interna, protocolo UDP, o WAN incorrecta).
- `Test-NetConnection` puede mostrar `TcpTestSucceeded` aunque el reenvío falle (el router acepta TCP y no reenvía). Confía en `diagnose-desk-portforward.sh` y en `curl /health`.

Estado rápido:

```bash
bash scripts/check-desk-status.sh
```

## Comprobar desde Windows

```powershell
nslookup desk.albesa.tech
Test-NetConnection desk.albesa.tech -Port 21116
Test-NetConnection desk.albesa.tech -Port 21117
curl http://desk.albesa.tech/health
```

- `health` → `ok`
- `21116` y `21117` → `TcpTestSucceeded : True`

## Si el puerto 80 no llega (típico con Starlink)

Añade en **Cloudflare Zero Trust** (mismo túnel que `server.albesa.tech`):

- Hostname: `desk.albesa.tech`
- Service: **HTTP** → `http://localhost:80`

Quita el registro **A** de `desk` si choca con el túnel. Ver `docs/DESK_CLOUDFLARE_TUNNEL.md`.

```powershell
curl https://desk.albesa.tech/health
```

RustDesk **21116/21117** siguen necesitando reenvío en el Ruijie (o un VPS). El túnel CF **no** sustituye UDP/TCP RustDesk.

## Errores frecuentes en el Reyee

| Síntoma | Causa probable |
|---------|----------------|
| TCP “conecta” pero `/health` timeout | Reenvío a IP incorrecta o solo regla en Starlink (debe estar en el Ruijie WAN) |
| Escritorio no registra ID | Falta **UDP 21116** o DNS apunta a IP antigua de Starlink |
| Móvil sin WebSocket | Puerto 80 no reenviado → usa túnel CF |
| Funciona en LAN, no fuera | Normal sin reenvío; usa `diagnose-desk-portforward.sh` |
