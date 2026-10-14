'use client';

import type { ReactNode } from 'react';
import Typography from '@mui/material/Typography';

import { MarkerHighlight } from '@/components/ui/MarkerHighlight';
import {
  pageHeroKickerSx,
  pageHeroSubtitleSx,
  pageHeroTitleSx,
  type PageHeroVariant,
} from '@/components/ui/pageHeroTokens';

type PageHeroKickerProps = {
  children: ReactNode;
};

/** Overline label with marker highlight (dense marketing heroes). */
export function PageHeroKicker({ children }: PageHeroKickerProps) {
  return (
    <Typography variant="overline" sx={pageHeroKickerSx}>
      <MarkerHighlight>{children}</MarkerHighlight>
    </Typography>
  );
}

type PageHeroTitleProps = {
  heroVariant: PageHeroVariant;
  children: ReactNode;
  id?: string;
  maxWidth?: number;
};

/** Hero heading — `variant="inherit"` so token `sx` is not overridden by MUI h1/h2 defaults. */
export function PageHeroTitle({
  heroVariant,
  children,
  id,
  maxWidth,
}: PageHeroTitleProps) {
  return (
    <Typography
      id={id}
      component="h1"
      variant="inherit"
      sx={{
        ...pageHeroTitleSx[heroVariant],
        ...(maxWidth !== undefined ? { maxWidth } : {}),
      }}
    >
      {children}
    </Typography>
  );
}

type PageHeroSubtitleProps = {
  children: ReactNode;
  /** Wider subtitle on homepage high hero. */
  maxWidth?: number;
};

export function PageHeroSubtitle({
  children,
  maxWidth = 640,
}: PageHeroSubtitleProps) {
  return (
    <Typography
      component="p"
      variant="inherit"
      color="text.secondary"
      sx={{ ...pageHeroSubtitleSx, maxWidth }}
    >
      {children}
    </Typography>
  );
}
