import type { SxProps, Theme } from '@mui/material/styles';

export type PageHeroVariant = 'high' | 'dense';

const heroBackground = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
  bgcolor: 'background.muted',
  backgroundImage:
    'radial-gradient(circle at top center, rgba(33,132,90,0.08), transparent 55%), url(/home-bg.svg)',
  backgroundRepeat: 'no-repeat, no-repeat',
  backgroundSize: 'cover, cover',
  backgroundPosition: 'center top, center top',
  textAlign: 'center' as const,
  'html[data-theme="dark"] &': {
    backgroundImage:
      'radial-gradient(circle at top center, rgba(33,132,90,0.12), transparent 55%), url(/home-bg-dark.svg)',
  },
};

export const pageHeroTitleSx: Record<PageHeroVariant, SxProps<Theme>> = {
  high: {
    maxWidth: 920,
    fontWeight: 700,
    fontSize: { xs: '2rem', md: '3rem' },
    lineHeight: 1.2,
    color: 'text.primary',
  },
  dense: {
    fontWeight: 800,
    fontSize: { xs: '2.1rem', md: '3rem' },
    lineHeight: 1.15,
    letterSpacing: -0.5,
    color: 'text.primary',
  },
};

export const pageHeroSubtitleSx: SxProps<Theme> = {
  maxWidth: 640,
  fontWeight: 400,
  lineHeight: 1.65,
  fontSize: { xs: '1rem', md: '1.1rem' },
};

export const pageHeroKickerSx: SxProps<Theme> = {
  fontWeight: 700,
  letterSpacing: 1.2,
  color: 'primary.main',
};

type PageHeroLayout = {
  sectionSx: SxProps<Theme>;
  containerSx: SxProps<Theme>;
  stackSpacing: number;
  containerMaxWidth: 'md' | 'lg';
};

export const pageHeroLayout: Record<PageHeroVariant, PageHeroLayout> = {
  high: {
    sectionSx: {
      ...heroBackground,
      pt: { xs: 8, md: 11 },
      pb: { xs: 15, md: 11 },
      px: 2,
    },
    containerSx: {
      minHeight: '65dvh',
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
    },
    stackSpacing: 3,
    containerMaxWidth: 'lg',
  },
  dense: {
    sectionSx: {
      ...heroBackground,
      pt: { xs: 20, md: 10 },
      /** Keep modest — large `pb` here stacks with page `Container` `pt` and looks like double padding. */
      pb: { xs: 6, md: 8 },
      px: 2,
      overflow: 'visible',
    },
    containerSx: {},
    stackSpacing: 2.5,
    containerMaxWidth: 'md',
  },
};
