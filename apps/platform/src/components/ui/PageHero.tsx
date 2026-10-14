'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';

import {
  pageHeroLayout,
  type PageHeroVariant,
} from '@/components/ui/pageHeroTokens';

export type { PageHeroVariant } from '@/components/ui/pageHeroTokens';

type PageHeroProps = {
  variant: PageHeroVariant;
  id?: string;
  children: ReactNode;
  /** Override default max width for the variant (`lg` for high, `md` for dense). */
  maxWidth?: 'md' | 'lg';
  /** Absolutely-positioned decorative content rendered behind the main content. */
  decoration?: ReactNode;
};

/**
 * Full-width page hero shell with shared background and two density presets.
 * - `high`: homepage (tall, scan CTA)
 * - `dense`: inner marketing pages (services, knowledge index, …)
 */
export function PageHero({
  variant,
  id,
  children,
  maxWidth,
  decoration,
}: PageHeroProps) {
  const layout = pageHeroLayout[variant];
  const resolvedMaxWidth = maxWidth ?? layout.containerMaxWidth;

  return (
    <Box id={id} component="section" sx={layout.sectionSx}>
      {decoration ?? null}
      <Container maxWidth={resolvedMaxWidth} sx={layout.containerSx}>
        <Stack
          spacing={layout.stackSpacing}
          sx={{
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {children}
        </Stack>
      </Container>
    </Box>
  );
}
