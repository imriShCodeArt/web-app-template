'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { createAppTheme, type Direction } from './theme';

type ThemeProviderProps = {
  children: ReactNode;
  direction: Direction;
  initialColorMode?: 'light' | 'dark';
};

type AppThemeModeContextValue = {
  mode: 'light' | 'dark';
  toggleMode: () => void;
};

const AppThemeModeContext = createContext<AppThemeModeContextValue | null>(
  null,
);
const THEME_STORAGE_KEY = 'app-color-mode';
const THEME_COOKIE_NAME = 'app-color-mode';

function persistColorMode(mode: 'light' | 'dark') {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  document.cookie = `${THEME_COOKIE_NAME}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeProvider({
  children,
  direction,
  initialColorMode,
}: ThemeProviderProps) {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(
    initialColorMode ?? 'light',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode;
    document.documentElement.style.colorScheme = colorMode;
  }, [colorMode]);

  const toggleMode = useCallback(() => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      persistColorMode(next);
      return next;
    });
  }, []);

  const value = useMemo<AppThemeModeContextValue>(
    () => ({ mode: colorMode, toggleMode }),
    [colorMode, toggleMode],
  );

  const theme = useMemo(
    () => createAppTheme(direction, colorMode),
    [direction, colorMode],
  );

  return (
    <AppThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </AppThemeModeContext.Provider>
  );
}

export function useAppThemeMode() {
  const context = useContext(AppThemeModeContext);
  if (!context) {
    throw new Error('useAppThemeMode must be used inside ThemeProvider');
  }
  return context;
}
