# ATS Desk Mobile (Expo / React Native)

App móvil **Albesa Tech** para conectar a equipos ATS Desk por ID, con la misma cuenta que [ats-web](https://github.com/albesa-tech/ats-web) (Supabase Auth).

## Ubicación en el repositorio

```
mobile-expo/
├── app/                    # Expo Router (pantallas)
│   ├── _layout.tsx         # Auth guard + GestureHandler
│   ├── login.tsx           # Inicio de sesión Supabase
│   ├── (tabs)/
│   │   ├── index.tsx       # Conectar por ID
│   │   ├── sessions.tsx    # Recientes
│   │   └── settings.tsx    # Cuenta y servidor
│   └── remote/[id].tsx     # Sesión remota (WebView RustDesk empaquetado)
├── src/
│   ├── theme/albesa.ts     # Colores, espaciado, marca
│   ├── config/desk.ts      # Rendezvous, relay, clave pública
│   ├── services/
│   │   ├── supabase.ts     # Cliente Supabase + SecureStore
│   │   └── auth.tsx        # AuthProvider
│   ├── hooks/useRecentPeers.ts
│   ├── components/         # Glass UI, toolbar, teclado
│   └── remote/deskWebClient.ts  # Extrae rustdesk-web.zip + URL sesión
├── assets/rustdesk-web.zip # Cliente web RustDesk V2 (~1.6 MB)
├── app.json
├── eas.json
└── .env.example
```

## Requisitos

- Node 20+
- **Expo Go** en el móvil (SDK **54**) — no requiere cuenta Apple Developer
- Cuenta Apple Developer ($99/año) — solo para instalar dev client / TestFlight sin Expo Go

## Probar en el móvil con Expo Go (recomendado sin cuenta Apple)

El proyecto usa **Expo SDK 54**, compatible con tu Expo Go actual.

```bash
cd mobile-expo
npm install
npx expo start
```

1. Abre **Expo Go** en el iPhone/Android
2. Escanea el código QR (misma red Wi‑Fi que el PC)
3. Login con tu cuenta albesa.tech (Supabase)

> Si ves "requires a newer version of Expo Go", actualiza Expo Go en la App Store o confirma que el proyecto sigue en SDK 54 (`package.json` → `"expo": "~54.0.0"`).

## Build nativo (requiere Apple Developer)

Para instalar la app como binario propio (sin Expo Go):

```bash
eas build --platform ios --profile development
```

Necesitas cuenta [Apple Developer Program](https://developer.apple.com/programs/) y configurar credenciales en EAS.

## Configuración

```bash
cd mobile-expo
cp .env.example .env
# Editar EXPO_PUBLIC_SUPABASE_* y EXPO_PUBLIC_DESK_*
npm install
```

Variables principales:

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (mismo que ats-web) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anon/public de Supabase |
| `EXPO_PUBLIC_DESK_RENDEZVOUS` | ID server, ej. `169.155.235.85:21116` |
| `EXPO_PUBLIC_DESK_RELAY` | Relay, ej. `169.155.235.85:21117` |
| `EXPO_PUBLIC_DESK_KEY` | Clave pública del servidor hbbs |
| `EXPO_PUBLIC_DESK_WEB_BASE` | (Opcional) URL del cliente web RustDesk autoalojado |

## Desarrollo local

```bash
npx expo start
# iOS simulator (Mac): pulsar i
# Android: pulsar a
```

Con **dev client** (recomendado para WebView y builds nativos):

```bash
npx expo run:ios
# o
eas build --profile development --platform ios
```

## Build iOS (EAS) — dispositivo físico

Proyecto: [@albesatech/ats-desk-mobile](https://expo.dev/accounts/albesatech/projects/ats-desk-mobile)

Perfil **development** → `"simulator": false` (dev client para iPhone real).

```bash
cd mobile-expo
npx eas-cli login
npx eas-cli credentials:configure-build -p ios -e development
npx eas-cli build --platform ios --profile development
```

> Si Apple bloquea la cuenta tras intentos fallidos de login, desbloquéala en [iforgot.apple.com](https://iforgot.apple.com) y usa app-specific password si tienes 2FA.

Build simulador (referencia): https://expo.dev/accounts/albesatech/projects/ats-desk-mobile/builds/b583e92d-c511-4c0e-b44a-3d4be1beff4e

## Flujo de la app

1. **Login** — `signInWithPassword` contra Supabase (misma base que ats-web).
2. **Conectar** — Introducir ID ATS Desk; se guarda en recientes.
3. **Sesión remota** — Cliente web RustDesk empaquetado: vídeo, ratón, teclado nativos del cliente.

## Cliente remoto — vídeo en vivo

La app empaqueta **RustDesk Web V2** en `assets/rustdesk-web.zip`. En la primera sesión se extrae al cache y se carga vía `file://` con hash `#/ID/r@169.155.235.85:21116?key=...`.

Desde `file://` el cliente usa **ws://** directo al puerto 21118 (sin nginx/WSS). Es la vía más rápida para tener vídeo funcionando.

**Mejora futura:** `scripts/setup-desk-web-nginx.sh` en el servidor para `desk.albesa.tech` con WSS (`/ws/id`, `/ws/relay`).

## Servidor ATS Desk

Usar IP/directo o DNS tipo `desk.albesa.tech` → `169.155.235.85` (registro A, **sin** túnel Cloudflare en puertos 21116–21118). Ver `docs/ATS_DESK_DEPLOY.md`.

## Marca

- Nombre: **ATS Desk**
- Bundle iOS: `tech.albesa.atsdesk`
- Color acento: `#E8762E` (Albesa orange)
- UI: liquid glass (`expo-blur`), animaciones Reanimated

## Seguridad

- No commitear `.env` ni contraseñas Expo/Apple.
- La clave pública del servidor (`DESK_KEY`) es pública por diseño (RustDesk).
- Tokens Supabase en `expo-secure-store`.
