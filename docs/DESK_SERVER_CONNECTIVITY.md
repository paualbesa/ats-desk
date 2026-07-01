# Conexión servidor ATS Desk — checklist

Si la app muestra **sin conexión** o no conecta a equipos remotos, revisa esto en orden.

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
```

Reinicia Metro: `npx expo start --clear`

## 6. Puertos 80/443 (opcional)

No son obligatorios para RustDesk básico. Solo hacen falta si despliegas cliente web con HTTPS (`scripts/setup-desk-web-nginx.sh`).

## Test rápido desde Windows

```powershell
Test-NetConnection desk.albesa.tech -Port 21116
Test-NetConnection desk.albesa.tech -Port 21117
```

`TcpTestSucceeded : True` en ambos = red OK; si falla, el problema es firewall o hbbs parado.
