import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import { AlbesaColors, accentForOnline, type ThemeColors } from '@/src/theme/albesa';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  accent: (online?: boolean) => string;
};

const STORAGE_KEY = 'ats_theme_mode_v1';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveIsDark(mode: ThemeMode, system: 'light' | 'dark' | null | undefined) {
  if (mode === 'system') return system === 'dark';
  return mode === 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setReady(true);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next);
  }, []);

  const isDark = resolveIsDark(mode, system);
  const colors = isDark ? AlbesaColors.dark : AlbesaColors.light;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
      accent: (online = true) => accentForOnline(online, isDark),
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
