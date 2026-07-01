/** Paleta ATS Desk — claro / oscuro */
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

const shared = {
  accent: '#E8762E',
  accentLight: '#FF9A4D',
  accentDark: '#C45E1A',
  success: '#30D158',
  danger: '#FF453A',
};

export const AlbesaColors = {
  light: {
    ...shared,
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
    offline: '#AEAEB2',
    shadow: 'rgba(0, 0, 0, 0.08)',
    bgDark: '#0D0D0F',
    bgElevated: '#1C1C1E',
    surface: '#2C2C2E',
    borderDark: 'rgba(255,255,255,0.12)',
    textOnDark: '#F2F2F7',
    textSecondaryOnDark: '#8E8E93',
    gradient: ['#FFF8F4', '#F2F2F7', '#ECECF0'] as [string, string, string],
    headerBlur: 'light' as const,
  },
  dark: {
    ...shared,
    accentGlass: 'rgba(232, 118, 46, 0.22)',
    accentMuted: '#636366',
    bg: '#0D0D0F',
    bgCard: '#1C1C1E',
    bgGlass: 'rgba(28, 28, 30, 0.82)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    text: '#F2F2F7',
    textSecondary: '#AEAEB2',
    textTertiary: '#636366',
    offline: '#636366',
    shadow: 'rgba(0, 0, 0, 0.35)',
    bgDark: '#0D0D0F',
    bgElevated: '#1C1C1E',
    surface: '#2C2C2E',
    borderDark: 'rgba(255,255,255,0.12)',
    textOnDark: '#F2F2F7',
    textSecondaryOnDark: '#8E8E93',
    gradient: ['#1a1410', '#0D0D0F', '#121214'] as [string, string, string],
    headerBlur: 'dark' as const,
  },
  // Compatibilidad con componentes que usan AlbesaColors.* directamente
  ...({
    ...shared,
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
    offline: '#AEAEB2',
    shadow: 'rgba(0, 0, 0, 0.08)',
    bgDark: '#0D0D0F',
    bgElevated: '#1C1C1E',
    surface: '#2C2C2E',
    borderDark: 'rgba(255,255,255,0.12)',
    textOnDark: '#F2F2F7',
    textSecondaryOnDark: '#8E8E93',
  } as Omit<ThemeColors, 'gradient' | 'headerBlur'>),
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

export function accentForOnline(online: boolean, isDark = false) {
  if (!online) return isDark ? AlbesaColors.dark.offline : AlbesaColors.light.offline;
  return shared.accent;
}
