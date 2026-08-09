import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  accentForOnline,
  paletteForMode,
  type ThemeColors,
  type ThemePalette,
} from '@/src/theme/albesa';

export type ThemeMode = ThemePalette;

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  accent: (online?: boolean) => string;
};

const STORAGE_KEY = 'ats_theme_mode_v2';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'albesa') {
        setModeState(stored);
      } else if (stored === 'system') {
        setModeState('dark');
      }
      setReady(true);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next);
  }, []);

  const isDark = mode === 'dark';
  const colors = paletteForMode(mode);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
      accent: (online = true) => accentForOnline(online, mode),
    }),
    [mode, isDark, colors, setMode],
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
