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
- Cuenta [Expo](https://expo.dev) (EAS Build para iOS)
- Apple Developer (para instalación en dispositivo / TestFlight)

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

## Build iOS (EAS)

Proyecto Expo: [@albesatech/ats-desk-mobile](https://expo.dev/accounts/albesatech/projects/ats-desk-mobile)

```bash
cd mobile-expo
npx eas-cli login
npx eas build --platform ios --profile development   # simulador / dev client
npx eas build --platform ios --profile preview       # dispositivo físico (requiere credenciales Apple)
```

**Build iOS completado (development / dev client):**

- ID: `b583e92d-c511-4c0e-b44a-3d4be1beff4e`
- Instalar: https://expo.dev/accounts/albesatech/projects/ats-desk-mobile/builds/b583e92d-c511-4c0e-b44a-3d4be1beff4e
- Artefacto: https://expo.dev/artifacts/eas/zu8__eCUx6SqavNulUrPQkZ0YN4IeNLprOY0NWzIDMQ.tar.gz

Para **iPhone físico** (TestFlight / Ad Hoc), ejecuta `eas build --profile preview` tras configurar credenciales Apple en [expo.dev → Credentials](https://expo.dev/accounts/albesatech/projects/ats-desk-mobile/credentials). La cuenta albesatech ha agotado créditos gratuitos del periodo; puede requerir plan de pago para builds adicionales.

## Flujo de la app

1. **Login** — `signInWithPassword` contra Supabase (misma base que ats-web).
2. **Conectar** — Introducir ID ATS Desk (9–12 dígitos); se guarda en recientes.
3. **Sesión remota** — Gestos (tap, arrastre, pinch, long press), toolbar (ratón, zoom, teclado, desconectar), hoja de teclado con atajos.

## Cliente remoto: fases

### Fase 1 (esta app) — UI + protocolo vía WebView

Si despliegas el **cliente web** de RustDesk en tu servidor y defines `EXPO_PUBLIC_DESK_WEB_BASE`, la pantalla remota carga el bridge HTML y envía eventos táctiles al cliente web.

### Fase 2 — Módulo nativo iOS/Android

Paridad total con el cliente Flutter requiere enlazar `librustdesk` (FFI) en un módulo Expo/React Native, igual que `flutter_rust_bridge` en `flutter/`. Es el camino para vídeo H.264, baja latencia y portapapeles nativo.

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
