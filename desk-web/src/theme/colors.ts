export const Brand = {
  orange: '#FF6B00',
  white: '#FFFFFF',
  black: '#121214',
} as const;

export type ThemeMode = 'light' | 'dark' | 'albesa';

export type ThemeColors = {
  accent: string;
  bg: string;
  bgCard: string;
  border: string;
  text: string;
  textSecondary: string;
  offline: string;
};

const light: ThemeColors = {
  accent: Brand.orange,
  bg: Brand.white,
  bgCard: Brand.white,
  border: 'rgba(18,18,20,0.12)',
  text: Brand.black,
  textSecondary: 'rgba(18,18,20,0.62)',
  offline: '#AEAEB2',
};

const dark: ThemeColors = {
  accent: Brand.orange,
  bg: Brand.black,
  bgCard: '#1E1E22',
  border: 'rgba(255,255,255,0.12)',
  text: Brand.white,
  textSecondary: 'rgba(255,255,255,0.65)',
  offline: '#636366',
};

const albesa: ThemeColors = {
  accent: Brand.white,
  bg: Brand.orange,
  bgCard: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.35)',
  text: Brand.black,
  textSecondary: 'rgba(18,18,20,0.72)',
  offline: 'rgba(18,18,20,0.45)',
};

export function palette(mode: ThemeMode): ThemeColors {
  if (mode === 'dark') return dark;
  if (mode === 'albesa') return albesa;
  return light;
}

const STORAGE = 'ats_desk_web_theme';

export function loadTheme(): ThemeMode {
  const v = localStorage.getItem(STORAGE);
  if (v === 'light' || v === 'dark' || v === 'albesa') return v;
  return 'dark';
}

export function saveTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE, mode);
}
