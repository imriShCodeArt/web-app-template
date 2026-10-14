import type { ReactNode } from 'react';
import AppBar, { type AppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

import { Container } from '@/components/ui/Container';

type FloatingAppBarProps = Omit<AppBarProps, 'children'> & {
  children: ReactNode;
  direction?: 'row' | 'row-reverse';
};

export function FloatingAppBar({
  children,
  sx,
  direction = 'row',
  ...props
}: FloatingAppBarProps) {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={[
        (theme) => ({
          top: { xs: 10, md: 14 },
          mx: 'auto',
          width: {
            xs: 'calc(100% - 16px)',
            sm: 'calc(100% - 32px)',
            md: 'min(1120px, calc(100% - 64px))',
          },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '20px',
          bgcolor:
            theme.palette.mode === 'dark'
              ? 'rgba(10, 10, 10, 0.72)'
              : 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 10px 30px rgba(0,0,0,0.45)'
              : '0 10px 30px rgba(0,0,0,0.10)',
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      <Container
        sx={{
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 64, md: 72 },
            justifyContent: 'space-between',
            gap: 2,
            flexDirection: direction,
          }}
        >
          {children}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
