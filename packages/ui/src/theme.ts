import { createTheme } from '@mui/material/styles';

export type Direction = 'ltr' | 'rtl';

export function createAppTheme(
  direction: Direction,
  mode: 'light' | 'dark' = 'light',
  cssVariables = true,
) {
  return createTheme({
    direction,
    cssVariables,
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#7796CC' : '#2364D8',
      },
      secondary: {
        main: mode === 'dark' ? '#22C55E' : '#22C55E',
      },
      background: {
        default: mode === 'dark' ? '#0f1218' : '#ffffff',
        paper: mode === 'dark' ? '#161b24' : '#ffffff',
        muted: mode === 'dark' ? '#12161e' : '#F8FAFB',
      },
      text: {
        primary: mode === 'dark' ? '#f3f4f6' : '#171717',
        secondary: mode === 'dark' ? '#9ca3af' : '#526A94',
      },
      info: {
        main: '#21845a',
      },
    },
    typography: {
      fontFamily: 'var(--font-noto-sans-hebrew)',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          fullWidth: true,
        },
      },
      MuiContainer: {
        defaultProps: {
          maxWidth: 'lg',
        },
      },
    },
  });
}
