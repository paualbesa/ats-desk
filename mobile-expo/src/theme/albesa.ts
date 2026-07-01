/** Paleta ATS Desk — modo claro estilo AnyDesk + naranja Albesa */
export const AlbesaColors = {
  accent: '#E8762E',
  accentLight: '#FF9A4D',
  accentDark: '#C45E1A',
  accentGlass: 'rgba(232, 118, 46, 0.14)',
  accentMuted: '#8E8E93',
  bg: '#F2F2F7',
  bgCard: '#FFFFFF',
  bgGlass: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.12)',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',
  success: '#30D158',
  danger: '#FF453A',
  offline: '#AEAEB2',
  shadow: 'rgba(0, 0, 0, 0.08)',
  /** Tema oscuro (login, remoto) */
  bgDark: '#0D0D0F',
  bgElevated: '#1C1C1E',
  surface: '#2C2C2E',
  borderDark: 'rgba(255,255,255,0.12)',
  textOnDark: '#F2F2F7',
  textSecondaryOnDark: '#8E8E93',
} as const;

export const AlbesaSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Radios tipo squircle Apple (continuous) */
export const AlbesaRadius = {
  sm: 14,
  md: 20,
  lg: 26,
  xl: 32,
  squircle: 22,
  pill: 999,
} as const;

export function accentForOnline(online: boolean) {
  return online ? AlbesaColors.accent : AlbesaColors.offline;
}

export function accentGlassForOnline(online: boolean) {
  return online ? AlbesaColors.accentGlass : 'rgba(142, 142, 147, 0.14)';
}
