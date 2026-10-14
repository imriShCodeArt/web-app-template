import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

import { Footer } from './Footer';
import { Header } from './Header';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Header />

      <Box
        id="main-content"
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {children}
      </Box>

      <Footer />
    </Box>
  );
}
