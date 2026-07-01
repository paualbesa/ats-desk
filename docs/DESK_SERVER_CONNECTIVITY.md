# Conexión servidor ATS Desk — checklist

Si la app muestra **sin conexión** o no conecta a equipos remotos, revisa esto en orden.

## App móvil: servidor OK pero WebSocket no

La app comprueba **hbbs (21116)** y **WebSocket** (nginx `:80/ws/id` o directo `:21118`).

- Si solo falla WebSocket, el vídeo móvil usa **fallback automático** vía IP (`ws://IP:21118`) aunque nginx no esté activo.
- Para mejor rendimiento y WSS en el futuro, arregla nginx en el servidor:

```bash
cd ~/albesa/ats-desk
git pull
bash scripts/diagnose-desk-server.sh
bash scripts/fix-desk-websocket.sh
```

El script `fix-desk-websocket.sh`:
1. **Para PM2 y hbbs/hbbr** (evita error "Text file busy")
2. Actualiza hbbs/hbbr a **1.1.15**
3. Reinicia PM2 con relay `desk.albesa.tech`
4. Instala y **arranca** nginx en puerto **80** con `/ws/id` → 21118

Si el puerto 80 acepta conexión pero no responde (`curl http://desk.albesa.tech/health` cuelga), nginx no está sirviendo: revisa `sudo systemctl status nginx` y `ss -tlnp | grep ':80'`.

Si solo quieres parar el servicio antes de copiar binarios a mano:

```bash
bash scripts/stop-ats-desk.sh
```

Tras nginx correcto, la app móvil mostrará **ID + WebSocket** en verde/naranja.

## Escritorio no conecta al servidor ATS

1. **`custom_client_config.json` junto al `.exe`** (misma carpeta que `ATS-Desk.exe`), o variable `ATS_DESK_CONFIG` con ruta absoluta.
2. **Recompilar y desplegar** con `python3 build_ats_desk.py --release --flutter` — copia el JSON automáticamente.
3. **Clave pública** debe coincidir con el servidor:
   ```bash
   cat ~/rustdesk-data/id_ed25519.pub
   ```
   Actualiza `key` en `custom_client_config.json` y en la app móvil si cambió tras reinstalar hbbs.
4. **UDP 21116** abierto (hbbs usa UDP para registro de ID; solo TCP no basta).
5. En Windows PowerShell:
   ```powershell
   Test-NetConnection desk.albesa.tech -Port 21116
   Test-NetConnection desk.albesa.tech -Port 21117
   ```
6. Si antes usaste `server.albesa.tech` (túnel Cloudflare), **no sirve para RustDesk** — usa `desk.albesa.tech:21116`.
7. Borra configuración antigua si el cliente guardó otro servidor: cierra ATS Desk, verifica que no haya otro `custom-rendezvous-server` en el perfil de usuario (el `override-settings` del JSON debería forzarlo).

## 1. DNS (ya hecho si creaste el A record)

```
desk.albesa.tech  →  A  →  169.155.235.85
```

En Cloudflare: **solo DNS (nube gris)**. No proxificar (nube naranja) los puertos RustDesk.

Comprobar desde tu PC:

```bash
nslookup desk.albesa.tech
# Debe devolver 169.155.235.85
```

## 2. Puertos en el firewall del servidor

Abre **entrada** en el VPS / router (Starlink):

| Puerto | Protocolo | Servicio |
|--------|-----------|----------|
| 21115 | TCP | NAT type test |
| 21116 | TCP + **UDP** | ID / señalización (hbbs) |
| 21117 | TCP | Relay (hbbr) |
| 21118 | TCP | WebSocket ID |
| 21119 | TCP | WebSocket relay |

En Ubuntu con UFW:

```bash
sudo ufw allow 21115:21119/tcp
sudo ufw allow 21116/udp
sudo ufw reload
```

En el router Starlink: reenvío de puertos 21115–21119 → IP local del PC/servidor donde corre hbbs.

## 3. Procesos hbbs / hbbr en el servidor

```bash
pm2 list
# Debe aparecer ats-desk (o rustdesk-hbbs / rustdesk-hbbr)

pm2 logs ats-desk --lines 30
```

Relay debe apuntar a la **IP pública**, no al túnel Cloudflare:

```bash
# En hbbs: -r 169.155.235.85:21117  o  desk.albesa.tech:21117
```

## 4. Cliente ATS Desk (escritorio)

En el PC que quieres controlar, `custom_client_config.json` o Ajustes → Red:

```json
"custom-rendezvous-server": "desk.albesa.tech:21116",
"relay-server": "desk.albesa.tech:21117",
"key": "RoldVL1Npn0FLv274f1N6zlbWlhZKoOiYUvObjDLomo="
```

## 5. App móvil

Variables en `mobile-expo/.env` (o valores por defecto en código):

```
EXPO_PUBLIC_DESK_ID_SERVER=desk.albesa.tech:21116
EXPO_PUBLIC_DESK_RELAY_SERVER=desk.albesa.tech:21117
EXPO_PUBLIC_DESK_DIRECT_IP=169.155.235.85
```

Reinicia Metro: `npx expo start --clear`

## Iconos de la app

Maestros **2048×2048** en `assets/branding/`:

- `ATSDeskTransparenticon.png` — transparente (UI, splash)
- `ATSDeskicon.png` — fondo blanco (launcher, .exe)

```bash
python3 scripts/generate_ats_icons.py
```

## 6. Puertos 80/443 (opcional)

No son obligatorios para RustDesk básico. Solo hacen falta si despliegas cliente web con HTTPS (`scripts/setup-desk-web-nginx.sh`).

## Test rápido desde Windows

```powershell
Test-NetConnection desk.albesa.tech -Port 21116
Test-NetConnection desk.albesa.tech -Port 21117
```

`TcpTestSucceeded : True` en ambos = red OK; si falla, el problema es firewall o hbbs parado.
