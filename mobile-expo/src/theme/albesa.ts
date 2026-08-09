/** Paleta corporativa Albesa Tech */
export const BrandColors = {
  orange: '#FF6B00',
  white: '#FFFFFF',
  black: '#121214',
} as const;

export type ThemeColors = {
  accent: string;
  accentLight: string;
  accentDark: string;
  accentGlass: string;
  accentMuted: string;
  bg: string;
  bgCard: string;
  bgGlass: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  success: string;
  danger: string;
  offline: string;
  shadow: string;
  bgDark: string;
  bgElevated: string;
  surface: string;
  borderDark: string;
  textOnDark: string;
  textSecondaryOnDark: string;
  gradient: [string, string, string];
  headerBlur: 'light' | 'dark';
};

const sharedStatus = {
  success: '#30D158',
  danger: '#FF453A',
};

/** Claro: fondo blanco, resalte naranja, texto negro */
const light: ThemeColors = {
  ...sharedStatus,
  accent: BrandColors.orange,
  accentLight: '#FF8533',
  accentDark: '#E05F00',
  accentGlass: 'rgba(255, 107, 0, 0.14)',
  accentMuted: '#8E8E93',
  bg: BrandColors.white,
  bgCard: BrandColors.white,
  bgGlass: 'rgba(255, 255, 255, 0.82)',
  border: 'rgba(18, 18, 20, 0.1)',
  borderStrong: 'rgba(18, 18, 20, 0.16)',
  text: BrandColors.black,
  textSecondary: 'rgba(18, 18, 20, 0.62)',
  textTertiary: 'rgba(18, 18, 20, 0.4)',
  offline: '#AEAEB2',
  shadow: 'rgba(18, 18, 20, 0.08)',
  bgDark: BrandColors.black,
  bgElevated: '#1E1E22',
  surface: '#F2F2F4',
  borderDark: 'rgba(255,255,255,0.12)',
  textOnDark: BrandColors.white,
  textSecondaryOnDark: '#AEAEB2',
  gradient: [BrandColors.white, '#FFF8F2', '#F5F5F7'] as [string, string, string],
  headerBlur: 'light',
};

/** Oscuro: fondo negro, resalte naranja, texto blanco */
const dark: ThemeColors = {
  ...sharedStatus,
  accent: BrandColors.orange,
  accentLight: '#FF8533',
  accentDark: '#E05F00',
  accentGlass: 'rgba(255, 107, 0, 0.22)',
  accentMuted: '#636366',
  bg: BrandColors.black,
  bgCard: '#1E1E22',
  bgGlass: 'rgba(30, 30, 34, 0.88)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: BrandColors.white,
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  offline: '#636366',
  shadow: 'rgba(0, 0, 0, 0.35)',
  bgDark: BrandColors.black,
  bgElevated: '#1E1E22',
  surface: '#2A2A2E',
  borderDark: 'rgba(255,255,255,0.12)',
  textOnDark: BrandColors.white,
  textSecondaryOnDark: '#AEAEB2',
  gradient: ['#1A1208', BrandColors.black, '#18181C'] as [string, string, string],
  headerBlur: 'dark',
};

/** Albesa Tech: fondo naranja, resalte blanco, texto negro */
const albesa: ThemeColors = {
  ...sharedStatus,
  accent: BrandColors.white,
  accentLight: BrandColors.white,
  accentDark: '#F0F0F0',
  accentGlass: 'rgba(255, 255, 255, 0.22)',
  accentMuted: 'rgba(18, 18, 20, 0.5)',
  bg: BrandColors.orange,
  bgCard: 'rgba(255, 255, 255, 0.18)',
  bgGlass: 'rgba(255, 255, 255, 0.2)',
  border: 'rgba(255, 255, 255, 0.35)',
  borderStrong: 'rgba(255, 255, 255, 0.5)',
  text: BrandColors.black,
  textSecondary: 'rgba(18, 18, 20, 0.72)',
  textTertiary: 'rgba(18, 18, 20, 0.5)',
  offline: 'rgba(18, 18, 20, 0.45)',
  shadow: 'rgba(18, 18, 20, 0.15)',
  bgDark: BrandColors.black,
  bgElevated: '#E05F00',
  surface: 'rgba(255, 255, 255, 0.15)',
  borderDark: 'rgba(255,255,255,0.35)',
  textOnDark: BrandColors.white,
  textSecondaryOnDark: 'rgba(255,255,255,0.75)',
  gradient: [BrandColors.orange, '#FF7A1A', '#FF6B00'] as [string, string, string],
  headerBlur: 'light',
};

export const AlbesaColors = {
  light,
  dark,
  albesa,
  // Compatibilidad con imports legacy
  ...light,
};

export const AlbesaSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const AlbesaRadius = {
  sm: 14,
  md: 20,
  lg: 26,
  xl: 32,
  squircle: 22,
  pill: 999,
} as const;

export type ThemePalette = 'light' | 'dark' | 'albesa';

export function paletteForMode(mode: ThemePalette): ThemeColors {
  if (mode === 'dark') return dark;
  if (mode === 'albesa') return albesa;
  return light;
}

export function accentForOnline(online: boolean, mode: ThemePalette = 'light') {
  const colors = paletteForMode(mode);
  if (!online) return colors.offline;
  return colors.accent;
}
