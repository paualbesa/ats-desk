export const DeskConfig = {
  rendezvousServer: import.meta.env.VITE_DESK_ID_SERVER ?? 'rd.albesa.tech:21116',
  relayServer: import.meta.env.VITE_DESK_RELAY_SERVER ?? 'rd.albesa.tech:21117',
  serverKey:
    import.meta.env.VITE_DESK_SERVER_KEY ??
    'RoldVL1Npn0FLv274f1N6zlbWlhZKoOiYUvObjDLomo=',
  webSocketHost: import.meta.env.VITE_DESK_WS_HOST ?? 'desk.albesa.tech',
} as const;

export function buildSessionHash(peerId: string, password?: string) {
  const id = peerId.replace(/\D/g, '').slice(0, 6);
  const relayHost = DeskConfig.webSocketHost;
  const key = encodeURIComponent(DeskConfig.serverKey);
  const pass = password ? `&password=${encodeURIComponent(password)}` : '';
  return `#/${id}/r@${relayHost}?key=${key}${pass}`;
}

export function rustdeskWebUrl(hash: string) {
  return `/rustdesk-web/index.html${hash}`;
}
