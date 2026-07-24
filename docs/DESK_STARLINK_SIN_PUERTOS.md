# ATS Desk sin abrir puertos en Starlink

Starlink **residencial** (sin plan Business) **no permite reenvío de puertos**. RustDesk necesita que Internet llegue a los puertos **21116 (TCP+UDP)** y **21117–21119 (TCP)**. Por eso la app **nunca** conectará si `hbbs` solo corre en el PC de casa detrás del Starlink.

**No hace falta** que hagas nada en el router. La solución habitual es un **VPS barato con IP pública** solo para el servidor ID/relay.

---

## Qué tienes ahora (resumen)

| Pieza | Dónde | ¿Sirve para RustDesk? |
|--------|--------|------------------------|
| `server.albesa.tech` | Túnel Cloudflare → PC Starlink | **No** (solo SSH / web interna) |
| `desk.albesa.tech` → IP antigua | Apuntaba al Starlink | **No** sin puertos abiertos |
| `hbbs` en el Starlink | PM2 `ats-desk` | Solo funciona **en tu LAN**, no desde móvil/otros sitios |

---

## Solución recomendada: VPS pequeño (~3–6 €/mes)

Un servidor en la nube con IP pública. Tus PCs y el móvil siguen en Starlink; **solo el registro de IDs** vive en el VPS.

```
┌─────────────────────┐          ┌──────────────────────────┐
│  VPS (Hetzner, OVH…) │          │  Casa / oficina Starlink  │
│  hbbs + hbbr         │  ◄────── │  ATS Desk (cliente)       │
│  desk.albesa.tech    │  IDs     │  server.albesa.tech (SSH) │
└─────────────────────┘          └──────────────────────────┘
```

### Paso 1 — Contratar VPS

Cualquier proveedor con **Ubuntu 22.04/24.04** y **IP pública**:

- [Hetzner CX22](https://www.hetzner.com/cloud) (~4 €/mes)
- [OVH VPS](https://www.ovhcloud.com/es/vps/)
- [Oracle Cloud](https://www.oracle.com/cloud/free/) (capa gratuita, más laborioso)

Anota la **IP pública** del VPS (ej. `95.xxx.xxx.xxx`).

### Paso 2 — DNS en Cloudflare

1. [Cloudflare](https://dash.cloudflare.com/) → dominio **albesa.tech** → **DNS**
2. Registro **`desk`**:
   - Tipo **A**
   - Contenido: **IP del VPS**
   - Proxy: **solo DNS (nube gris)** — importante
3. Si había un A a `169.155.235.85` (Starlink), **cámbialo** por la IP del VPS

### Paso 3 — Instalar servidor en el VPS

Conéctate por SSH al VPS (no al Starlink):

```bash
ssh root@IP_DEL_VPS
```

En el VPS:

```bash
apt update && apt install -y git curl
git clone https://github.com/paualbesa/ats-desk.git
cd ats-desk
sudo bash scripts/setup-desk-vps.sh
```

El script instala `hbbs`/`hbbr`, PM2, nginx (WebSocket móvil) y abre el firewall del VPS.

Al final imprime la **clave pública** (`id_ed25519.pub`). Debe coincidir con `custom_client_config.json` y la app móvil.

### Paso 4 — Clientes (Windows + móvil)

1. **`git pull`** en tu repo local
2. Copia `custom_client_config.json` junto a **ATS-Desk.exe** (ya usa `desk.albesa.tech:21116`)
3. Si la clave del VPS **cambió** tras la instalación, actualiza `key` en:
   - `custom_client_config.json`
   - `mobile-expo/.env` o variables EAS (`EXPO_PUBLIC_DESK_SERVER_KEY`)

### Paso 5 — Comprobar desde Windows

```powershell
nslookup desk.albesa.tech
# Debe ser la IP del VPS, NO 104.21.x.x (Cloudflare proxy)

Test-NetConnection desk.albesa.tech -Port 21116
Test-NetConnection desk.albesa.tech -Port 21117
# TcpTestSucceeded : True

curl http://desk.albesa.tech/health
# ok
```

### Paso 6 — Starlink (opcional)

En el PC Starlink puedes **parar** el servidor local para no liar:

```bash
ssh server.albesa.tech
pm2 stop ats-desk
```

El VPS pasa a ser el único servidor ID. SSH y el resto de servicios en Starlink **no se tocan**.

---

## ¿Y el túnel Cloudflare que ya tengo?

Sigue perfecto para **`server.albesa.tech` (SSH)**. Para RustDesk:

| Método | Sin abrir puertos en Starlink |
|--------|-------------------------------|
| Túnel CF solo HTTP (`desk` → localhost:80) | Ayuda al **vídeo web** del móvil, **no** sustituye el servidor ID |
| Túnel CF TCP 21116 | El cliente ATS Desk **no** usa `cloudflared`; no es viable |
| **VPS con IP pública** | **Sí** — lo que necesitas |

Guía extra HTTP por túnel (opcional, con VPS o sin él): `docs/DESK_CLOUDFLARE_TUNNEL.md`

---

## Preguntas frecuentes

**¿Puedo evitar pagar un VPS?**  
Solo con algo que reenvíe TCP+UDP (plan Business Starlink, otro enlace con IP pública, o un túnel tipo `frp` hacia un VPS). Para ATS Desk normal, el VPS es lo más simple.

**¿El móvil necesita `.env`?**  
No obligatorio; los valores por defecto ya apuntan a `desk.albesa.tech`. Tras mover el servidor al VPS, basta `npx expo start --clear`.

**¿Por qué antes decía que funcionaba el servidor?**  
En la red local el puerto 21116 responde; desde fuera (4G, otro WiFi) sin VPS o sin puertos, no.

---

## Referencias en el repo

- Instalación VPS: `scripts/setup-desk-vps.sh`
- Tras instalar: `scripts/verify-desk-connectivity.sh`
- Despliegue completo: `docs/ATS_DESK_DEPLOY.md`
