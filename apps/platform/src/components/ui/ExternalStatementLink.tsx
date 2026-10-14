'use client';

import type { ReactNode } from 'react';

import MuiLink from '@mui/material/Link';
import type { LinkProps } from '@mui/material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';

export function ExternalStatementLink({
  href,
  children,
  opensNewWindowLabel,
  color = 'secondary',
}: {
  href: string;
  children: ReactNode;
  opensNewWindowLabel: string;
  color?: LinkProps['color'];
}) {
  return (
    <MuiLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      color={color}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        verticalAlign: 'baseline',
      }}
    >
      {children}
      <OpenInNewIcon
        aria-hidden
        sx={{ fontSize: '1rem', flexShrink: 0, opacity: 0.85 }}
      />
      <Box
        component="span"
        sx={{
          border: 0,
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          height: '1px',
          margin: '-1px',
          overflow: 'hidden',
          padding: 0,
          position: 'absolute',
          width: '1px',
          whiteSpace: 'nowrap',
        }}
      >
        {opensNewWindowLabel}
      </Box>
    </MuiLink>
  );
}
