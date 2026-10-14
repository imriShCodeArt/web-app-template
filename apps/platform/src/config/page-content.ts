import type { ContainerProps } from '@mui/material/Container';

/** Standard page body shells below heroes / app chrome. */
export type PageContentLayout =
  'page' | 'document' | 'wide' | 'loose' | 'article' | 'narrow';

/** Use px/rem strings for literal sizes; numbers are MUI theme spacing steps (6 → 48px by default). */
type VerticalPadding = number | string;

type PageContentPreset = {
  maxWidth: NonNullable<ContainerProps['maxWidth']>;
  py: { xs: VerticalPadding; md: VerticalPadding };
};

export const pageContentLayout: Record<PageContentLayout, PageContentPreset> = {
  /** Default marketing / about body below a dense hero. */
  page: {
    maxWidth: 'md',
    py: { xs: 3, md: 4 },
  },
  /** Long-form legal and policy pages. */
  document: {
    maxWidth: 'md',
    py: { xs: 6, md: 10 },
  },
  /** CRM, contact, and other full-width (lg) page shells. */
  wide: {
    maxWidth: 'lg',
    py: { xs: 6, md: 8 },
  },
  /** Account and other spacious private pages. */
  loose: {
    maxWidth: 'md',
    py: { xs: 8, md: 12 },
  },
  /** Knowledge article body below the cover header. */
  article: {
    maxWidth: 'md',
    py: { xs: 5, md: 8 },
  },
  /** Narrow centered flows (e.g. auth error). */
  narrow: {
    maxWidth: 'xs',
    py: { xs: 8, md: 12 },
  },
};
