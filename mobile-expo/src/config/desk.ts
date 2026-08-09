/**
 * Configuración ATS Desk (misma infra que custom_client_config.json del escritorio).
 * - RustDesk (hbbs/hbbr): rd.albesa.tech — DNS directo (A gris, puertos 21116–21119)
 * - WebSocket móvil: desk.albesa.tech — túnel Cloudflare (https/wss)
 */
export const DeskConfig = {
  rendezvousServer: process.env.EXPO_PUBLIC_DESK_ID_SERVER ?? 'rd.albesa.tech:21116',
  relayServer: process.env.EXPO_PUBLIC_DESK_RELAY_SERVER ?? 'rd.albesa.tech:21117',
  serverKey:
    process.env.EXPO_PUBLIC_DESK_SERVER_KEY ??
    'RoldVL1Npn0FLv274f1N6zlbWlhZKoOiYUvObjDLomo=',
  /** Host HTTP/WSS (túnel CF). Distinto del ID server RustDesk. */
  webSocketHost: process.env.EXPO_PUBLIC_DESK_WS_HOST ?? 'desk.albesa.tech',
  /** Cliente web alojado (evita file:// y errores Worker en RN). */
  webClientBase:
    process.env.EXPO_PUBLIC_DESK_WEB_BASE ?? 'https://desk.albesa.tech/rustdesk-web',
} as const;
