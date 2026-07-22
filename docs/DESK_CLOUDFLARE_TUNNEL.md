# desk.albesa.tech vía Cloudflare Tunnel (WebSocket + HTTP)

Si desde fuera de la red **21116 TCP funciona** pero **HTTP/WebSocket en :80 falla** (típico en Starlink), expón `desk.albesa.tech` por el **mismo túnel** que `server.albesa.tech`.

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

El túnel HTTP **no** sustituye los puertos RustDesk. En el router Starlink sigue haciendo falta:

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
