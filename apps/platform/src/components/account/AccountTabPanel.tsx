'use client';

import { type ReactNode } from 'react';
import Box from '@mui/material/Box';

type AccountTabPanelProps = {
  index: number;
  activeIndex: number;
  children: ReactNode;
};

export function AccountTabPanel({
  index,
  activeIndex,
  children,
}: AccountTabPanelProps) {
  return (
    <Box
      role="tabpanel"
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      hidden={activeIndex !== index}
      sx={{ pt: 0.5 }}
    >
      {children}
    </Box>
  );
}
