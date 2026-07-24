# desk.albesa.tech vía Cloudflare Tunnel (solo HTTP / WebSocket)

**Si tienes Starlink sin reenvío de puertos**, esto **no** sustituye un servidor RustDesk. Lee primero: **`docs/DESK_STARLINK_SIN_PUERTOS.md`** (VPS recomendado).

Si ya tienes **hbbs en un VPS** con IP pública, puedes usar el túnel CF **además** para HTTPS en el móvil, o servir `/health` y `/ws/id` por el túnel.

Si desde fuera de la red **21116 TCP funciona** pero **HTTP/WebSocket en :80 falla** (típico en Starlink con puertos abiertos), expón `desk.albesa.tech` por el **mismo túnel** que `server.albesa.tech`.

## En Cloudflare Zero Trust

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**
2. Abre el túnel que usa el servidor (el que tiene `server.albesa.tech`)
3. **Public Hostname** → **Add a public hostname**:
   - **Subdomain:** `desk`
   - **Domain:** `albesa.tech`
   - **Service type:** HTTP
   - **URL:** `http://localhost:80`
4. Guarda

## En Cloudflare DNS

1. **DNS** → registro `desk.albesa.tech`
2. Si hay un **A** a `169.155.235.85`, **elimínalo** (el túnel crea CNAME automático)
3. Debe quedar **Proxied** (nube naranja) apuntando al túnel

## RustDesk TCP (21116–21119)

Sin **VPS** o **reenvío de puertos** en el router, el túnel HTTP **no** registra IDs RustDesk. En Starlink residencial usa `docs/DESK_STARLINK_SIN_PUERTOS.md`.

Si hbbs está en un **VPS**, abre en el firewall del proveedor y en el VPS:

| Puerto | Protocolo |
|--------|-----------|
| 21116 | TCP + **UDP** |
| 21117–21119 | TCP |
| 21115 | TCP |

Reenvío → `192.168.110.224` (IP LAN del servidor).

## Verificación

```bash
curl https://desk.albesa.tech/health   # debe devolver ok
```

En el móvil/escritorio el servidor sigue siendo `desk.albesa.tech:21116` (no `server.albesa.tech`).
