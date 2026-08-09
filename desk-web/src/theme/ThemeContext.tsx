import React, { createContext, useContext, useMemo, useState } from 'react';
import { loadTheme, palette, saveTheme, type ThemeMode } from '@/theme/colors';

type Ctx = {
  mode: ThemeMode;
  colors: ReturnType<typeof palette>;
  setMode: (m: ThemeMode) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadTheme);
  const colors = palette(mode);
  const setMode = (m: ThemeMode) => {
    setModeState(m);
    saveTheme(m);
  };
  const value = useMemo(() => ({ mode, colors, setMode }), [mode, colors]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme');
  return ctx;
}
