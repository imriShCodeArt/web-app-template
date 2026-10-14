'use client';
import Box from '@mui/material/Box';
import type { BoxProps } from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

/** Highlight span for headings: yellow marker-style underline using theme primary. */
export type MarkerHighlightProps = Omit<BoxProps, 'component'> & {
  component?: BoxProps['component'];
  color?: string;
};

export function MarkerHighlight({
  sx,
  children,
  component = 'span',
  color = '#FFF',
  ...props
}: MarkerHighlightProps) {
  const theme = useTheme();
  return (
    <Box
      component={component}
      sx={[
        {
          color,
          px: 1.6,
          borderRadius: 9,
          // Static gradient (theme callbacks in sx break RSC → Client serialization).
          backgroundImage: `linear-gradient(-3deg, ${theme.palette.primary.main + 'bb'} 4%, ${theme.palette.primary.main} 40%, ${theme.palette.primary.main + '99'} 99%)`,
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          'html[data-theme="dark"] &': {
            color: 'var(--mui-palette-text-primary)',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Box>
  );
}
