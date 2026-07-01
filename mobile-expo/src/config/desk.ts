/**
 * Configuración ATS Desk (misma infra que custom_client_config.json del escritorio).
 * La clave pública del servidor hbbs.
 */
export const DeskConfig = {
  rendezvousServer: process.env.EXPO_PUBLIC_DESK_ID_SERVER ?? 'desk.albesa.tech:21116',
  relayServer: process.env.EXPO_PUBLIC_DESK_RELAY_SERVER ?? 'desk.albesa.tech:21117',
  serverKey:
    process.env.EXPO_PUBLIC_DESK_SERVER_KEY ??
    'RoldVL1Npn0FLv274f1N6zlbWlhZKoOiYUvObjDLomo=',
  /** URL del cliente web RustDesk autoalojado (opcional, fase 2) */
  webClientBase: process.env.EXPO_PUBLIC_DESK_WEB_BASE ?? '',
} as const;
