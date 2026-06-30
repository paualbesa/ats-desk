# Guía de despliegue ATS Desk

Configuración para usar ATS Desk con vuestro servidor en la oficina, sin mostrar opciones sensibles a los usuarios.

---

## 1. Configuración del servidor (sin UI)

La opción **ID/Relay Server** está oculta para custom clients (nombre de app ≠ RustDesk). El servidor se define por archivo, no por la interfaz.

### Archivo `custom_client_config.json` (recomendado, sin firma)

Colocad un archivo **`custom_client_config.json`** en la misma carpeta que el ejecutable (o indicad la ruta con la variable de entorno **`ATS_DESK_CONFIG`**). Es JSON plano, no hace falta firmar. Podéis copiar `custom_client_config.json.example` en la raíz del repo y renombrarlo a `custom_client_config.json`, luego editarlo con vuestros dominios.

**Ejemplo mínimo (servidor ID + relay de vuestra oficina):**

```json
{
  "app-name": "ATS Desk",
  "override-settings": {
    "custom-rendezvous-server": "vuestro-servidor-id.ejemplo.com:21116",
    "relay-server": "vuestro-servidor-relay.ejemplo.com:21117",
    "api-server": "https://vuestro-servidor-api.ejemplo.com"
  }
}
```

- **custom-rendezvous-server**: servidor de registro/ID (puerto típico 21116).
- **relay-server**: servidor relay (puerto típico 21117).
- **api-server**: URL del API (libreta de direcciones, login, etc.); opcional si no usáis esas funciones.

Si queréis valores por defecto que el usuario no pueda cambiar, usad **`override-settings`**. Si queréis valores iniciales que el usuario sí pueda cambiar, usad **`default-settings`**.

### Variable de entorno

- **`ATS_DESK_CONFIG`**: ruta absoluta al JSON de configuración. Si está definida, se usa este archivo en lugar de `custom_client_config.json` junto al exe.

### Config firmado (`custom.txt`)

También podéis usar el mecanismo de RustDesk: archivo **`custom.txt`** junto al ejecutable con contenido **base64(config firmado)**. Requiere la herramienta de firma de RustDesk. El JSON interno admite los mismos campos `app-name`, `default-settings`, `override-settings`.

---

## 2. Ocultar más opciones (built-in)

En el mismo `custom_client_config.json` podéis ocultar pestañas u opciones añadiendo claves en **`override-settings`** (o en **`default-settings`**). Las claves de “ocultar” son opciones **built-in** y deben ir en un objeto que se aplica a built-in; en la práctica, podéis ponerlas en **`override-settings`** y el código las asigna a built-in cuando corresponda (según el código actual).

Para ocultar por defecto en custom client sin tocar la UI, podéis usar **`default-settings`** con las claves con guiones (o la variante con guión bajo que use el código). Ejemplo de claves útiles (nombres con guión):

| Clave | Efecto |
|-------|--------|
| `hide-server-settings` | Oculta "ID/Relay Server" (ya oculto por defecto en custom client) |
| `hide-proxy-settings` | Oculta "Socks5/Http(s) Proxy" |
| `hide-websocket-settings` | Oculta "Use WebSocket" |
| `hide-security-settings` | Oculta pestaña "Safety" |
| `hide-network-settings` | Oculta pestaña "Network" |
| `hide-remote-printer-settings` | Oculta opciones de impresora remota |
| `hide-powered-by-me` | Oculta el texto "Powered by..." |
| `hide-help-cards` | Oculta tarjetas de ayuda |

Ejemplo en `override-settings` para ocultar proxy, websocket y “Powered by”:

```json
{
  "app-name": "ATS Desk",
  "override-settings": {
    "custom-rendezvous-server": "id.ats-desk.ejemplo.com:21116",
    "relay-server": "relay.ats-desk.ejemplo.com:21117",
    "api-server": "https://api.ats-desk.ejemplo.com",
    "hide-proxy-settings": "Y",
    "hide-websocket-settings": "Y",
    "hide-powered-by-me": "Y"
  }
}
```

*(En el código actual, las opciones built-in se aplican desde el mismo mapa de `override-settings` cuando la clave está en `KEYS_BUILDIN_SETTINGS`.)*

---

## 3. Cuenta / login y API

- **api-server**: debe coincidir con la URL base del API de vuestro backend (libreta compartida, login, etc.).
- Comprobad en la app que el **login** y la **libreta de direcciones** usan esa URL (ya leen `api_server` del config).
- Si no usáis login ni libreta compartida, podéis omitir `api-server` o dejarlo vacío.

---

## 4. Permisos y aprobación de conexión

En Ajustes → **Safety** (si no está oculta) se pueden fijar:

- **Access Mode**: quién puede conectar (p. ej. solo con contraseña).
- **Approve mode**: si las conexiones requieren aprobación (p. ej. “password-click”).
- **Permanent password**: contraseña fija del equipo.

Para **fijar valores por despliegue** sin que el usuario los cambie, usad **`override-settings`** en `custom_client_config.json` con las claves correspondientes (por ejemplo `access-mode`, `approve-mode`). Los nombres exactos están en `libs/hbb_common/src/config.rs` (KEYS_SETTINGS / opciones de seguridad).

Si queréis ocultar toda la pestaña Safety, usad `"hide-security-settings": "Y"` en override-settings.

---

## 5. Branding y textos

- **app-name**: en `custom_client_config.json` define el nombre que ve el usuario (p. ej. "ATS Desk").
- **hide-powered-by-me**: `"Y"` oculta el texto “Powered by…” en la UI.
- Iconos y recursos: sustituid los recursos de la build Flutter (iconos de la app, splash, etc.) según vuestro branding.

---

## 6. Pruebas con vuestro servidor

Cuando tengáis el servidor en la oficina:

1. **Configurar**  
   - Poned `custom_client_config.json` (o `ATS_DESK_CONFIG`) con `custom-rendezvous-server`, `relay-server` y, si aplica, `api-server` apuntando al servidor real.

2. **Registro de IDs**  
   - Comprobad que los equipos obtienen ID a través de vuestro servidor (que el cliente usa el rendezvous configurado).

3. **Conexión**  
   - Prueba conexión **entrante** (alguien conecta a un equipo que tiene ATS Desk).  
   - Prueba conexión **saliente** (conectar desde ATS Desk a otro ID).  
   - Comprobad que el tráfico pasa por vuestro relay (no por servidores públicos).

4. **UI**  
   - Verificad que **no** aparece la opción “ID/Relay Server” en Ajustes (ya oculta para custom client).  
   - Verificad que el nombre de la app y el resto del branding son los esperados.

5. **Opciones ocultas**  
   - Si habéis puesto `hide-proxy-settings`, `hide-websocket-settings`, etc., comprobad que esas opciones no se muestran.

6. **Login / libreta** (si aplica)  
   - Probad inicio de sesión y libreta de direcciones contra vuestro `api-server`.

---

## Resumen rápido

| Objetivo | Cómo |
|----------|------|
| Servidor de oficina sin que el usuario lo vea | `custom_client_config.json` con `custom-rendezvous-server` y `relay-server` (y opcionalmente `api-server`) en `override-settings`. La opción “ID/Relay Server” ya está oculta en custom client. |
| Ocultar proxy, websocket, seguridad, etc. | Añadir en `override-settings` las claves `hide-*-settings` o `hide-powered-by-me` con valor `"Y"`. |
| Nombre de la app y “Powered by” | `app-name` y `hide-powered-by-me` en el mismo JSON. |
| Fijar acceso/aprobación/contraseña | Claves de seguridad en `override-settings` (nombres en `config.rs`). |
| Ruta del config | Archivo `custom_client_config.json` junto al exe o variable de entorno `ATS_DESK_CONFIG`. |

---

## 7. Build rápido para pruebas (ATS-Desk.exe en la raíz)

Para probar sin buscar el ejecutable en carpetas de build:

**Windows (recomendado):**
```bat
BUILD_ATS_DESK.bat
```
O manualmente:
```bat
python build_ats_desk.py --release --flutter
```

**Linux / macOS:**
```bash
python3 build_ats_desk.py --release --flutter
```

El script genera en la **raíz del proyecto**:
- `ATS-Desk.exe` (Windows) o `ATS-Desk` (Linux)
- En Windows también copia las DLL de plugins, `flutter_windows.dll`, `librustdesk.dll` y la carpeta `data/` (necesarios para ejecutar)
- Copia `custom_client_config.json` junto al ejecutable

Requisitos Windows: Rust con feature `flutter`, Flutter SDK, Visual Studio Build Tools.

---

## 8. Servidor RustDesk con PM2 (Ubuntu)

Script incluido: `scripts/setup-rustdesk-pm2.sh`

En el servidor Ubuntu (acceso SSH directo, sin proxy Cloudflare en el puerto 22):

```bash
scp scripts/setup-rustdesk-pm2.sh ats-server@server.albesa.tech:~/
ssh ats-server@server.albesa.tech
bash setup-rustdesk-pm2.sh
```

El script instala Node.js, PM2, RustDesk server (hbbs + hbbr) y los deja corriendo siempre.

**Puertos a abrir:** 21115/tcp, 21116/tcp+udp, 21117/tcp, 21118/tcp, 21119/tcp

**Config del cliente** (`custom_client_config.json`):
```json
{
  "app-name": "ATS Desk",
  "override-settings": {
    "custom-rendezvous-server": "server.albesa.tech:21116",
    "relay-server": "server.albesa.tech:21117",
    "key": "CLAVE_PUBLICA_DE_id_ed25519.pub"
  }
}
```

La clave `key` es obligatoria con servidor propio. En el servidor:
```bash
cat ~/rustdesk-data/id_ed25519.pub
```

> **Nota:** Si `server.albesa.tech` está detrás de Cloudflare, los registros DNS deben estar en **solo DNS** (nube gris), no proxy naranja. RustDesk usa TCP/UDP en 21115–21119 y no funciona a través del proxy de Cloudflare.

### Cloudflare Tunnel (`cfargotunnel.com`) — importante

Si el registro DNS de `server` es un **CNAME** a `….cfargotunnel.com`, **no basta con poner nube gris**. Todo el tráfico pasa por el túnel de Cloudflare. El túnel solo expone lo que configuraste en **Public Hostnames** (normalmente solo SSH). Por eso:

- `Test-NetConnection server.albesa.tech -Port 22` puede funcionar (SSH vía túnel).
- `Test-NetConnection server.albesa.tech -Port 21116` falla (`TcpTestSucceeded: False`).
- `nslookup` devuelve IPs de Cloudflare (`104.21.x.x`), no la IP del VPS.

**Solución recomendada:** usar **dos nombres distintos**:

| Subdominio | Tipo DNS | Destino | Uso |
|------------|----------|---------|-----|
| `server.albesa.tech` | CNAME | `….cfargotunnel.com` | SSH (como ahora) |
| `desk.albesa.tech` | **A** | **IP pública real del VPS** | RustDesk (nube gris) |

Pasos:

1. Conectado por SSH al VPS, obtén la IP pública:
   ```bash
   curl -4 ifconfig.me
   ```
2. En Cloudflare → DNS → **Crear registro**:
   - Tipo: **A**
   - Nombre: `desk` (queda `desk.albesa.tech`)
   - Contenido: la IP del paso 1
   - Proxy: **Solo DNS (gris)**
3. Abre puertos en el VPS y en el panel del proveedor: `21115–21119`.
4. Actualiza `custom_client_config.json`:
   ```json
   "custom-rendezvous-server": "desk.albesa.tech:21116",
   "relay-server": "desk.albesa.tech:21117"
   ```
5. Comprueba desde Windows:
   ```powershell
   nslookup desk.albesa.tech
   Test-NetConnection desk.albesa.tech -Port 21116
   ```
   La IP debe ser la del VPS (no `104.21.x.x`) y `TcpTestSucceeded` debe ser `True`.

**No recomendado:** añadir Public Hostnames TCP en el túnel para 21116/21117. RustDesk usa **UDP** en 21116 y varios puertos; el túnel está pensado para SSH/HTTP, no para esto.

### Starlink / sin IP pública (CGNAT)

Si el «servidor» está en una red **Starlink** (sin IP pública), **no puedes** usar un registro DNS **A** al VPS: no hay IP fija en Internet hacia esa máquina.

Tu setup actual tiene sentido para **SSH**:

```
server.albesa.tech  →  CNAME  →  cfargotunnel.com  →  cloudflared  →  PC Starlink
```

Eso **solo** expone lo configurado en el túnel (SSH). RustDesk **no** puede usar ese mismo camino de forma fiable:

| Método | ¿Sirve para RustDesk? |
|--------|------------------------|
| CNAME al túnel Cloudflare | Solo SSH / HTTP; no TCP+UDP crudo en 21116 |
| Public Hostname TCP en túnel | El **cliente** necesitaría `cloudflared` (no vale para ATS Desk normal) |
| Registro A sin IP pública | Imposible |
| **VPS barato con IP pública** | **Sí — recomendado** |

#### Arquitectura recomendada (la más simple)

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│  VPS ~3–5 €/mes             │     │  Oficina / Starlink (CGNAT)   │
│  IP pública fija            │     │  Sin IP pública               │
│  hbbs + hbbr (pm2 ats-desk) │     │  Solo clientes ATS Desk       │
│  desk.albesa.tech → A → IP  │     │  server.albesa.tech → túnel   │
└─────────────────────────────┘     │  (solo SSH, opcional)         │
                                    └──────────────────────────────┘
```

1. Contratar un VPS pequeño (Hetzner, OVH, Oracle free tier, etc.) con **IP pública**.
2. Instalar ahí `hbbs` + `hbbr` (`scripts/setup-rustdesk-pm2.sh`).
3. DNS: `desk.albesa.tech` → **A** → IP del VPS (nube gris).
4. `custom_client_config.json`:
   ```json
   "custom-rendezvous-server": "desk.albesa.tech:21116",
   "relay-server": "desk.albesa.tech:21117"
   ```
5. Los PCs en Starlink **no alojan** el servidor; solo ejecutan ATS Desk como clientes.

El servidor RustDesk pesa muy poco (decenas de MB RAM); no hace falta que esté en el mismo sitio que Starlink.

#### Si insistes en alojar hbbs en el Starlink

Necesitas un túnel que reenvíe **TCP y UDP** en los puertos 21115–21117 (Pangolin, `frp` hacia un VPS, etc.). **Cloudflare Tunnel no es adecuado** para clientes RustDesk estándar.

### Si aparece «Failed to connect to server…: Por favor intente mas tarde»

1. **DNS:** `server.albesa.tech` debe resolver a la IP real del VPS (no a IPs de Cloudflare).
2. **Puertos abiertos** en firewall del servidor: `21115/tcp`, `21116/tcp+udp`, `21117/tcp`, `21118/tcp`, `21119/tcp`.
3. **Servidor activo:** `pm2 list` → proceso `ats-desk` en estado `online`.
4. **Clave pública:** `key` en `custom_client_config.json` debe coincidir con `~/rustdesk-data/id_ed25519.pub`.
5. **Config junto al exe:** `custom_client_config.json` debe estar en la misma carpeta que `ATS-Desk.exe`.
6. **Prueba de red** (desde el PC cliente):
   ```bat
   Test-NetConnection server.albesa.tech -Port 21116
   ```
   `TcpTestSucceeded` debe ser `True`.
