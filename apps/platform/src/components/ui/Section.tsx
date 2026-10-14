'use client';

import Box, { type BoxProps } from '@mui/material/Box';

export type SectionProps = BoxProps & {
  muted?: boolean;
};

export function Section({
  children,
  muted = false,
  sx,
  ...props
}: SectionProps) {
  return (
    <Box
      component="section"
      sx={[
        {
          py: { xs: 6, md: 10 },
          bgcolor: muted ? 'action.hover' : 'transparent',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Box>
  );
}
