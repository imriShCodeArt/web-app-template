'use client';

import MuiContainer, {
  type ContainerProps as MuiContainerProps,
} from '@mui/material/Container';

import {
  pageContentLayout,
  type PageContentLayout,
} from '@/config/page-content';

export type ContainerProps = MuiContainerProps & {
  /**
   * Applies standard max-width and vertical padding for page bodies.
   * Omit for section interiors or custom shells (e.g. heroes).
   */
  layout?: PageContentLayout;
};

export type { PageContentLayout } from '@/config/page-content';

export function Container({
  maxWidth,
  layout,
  disableGutters = false,
  sx,
  ...props
}: ContainerProps) {
  const preset = layout ? pageContentLayout[layout] : undefined;
  const resolvedMaxWidth = maxWidth ?? preset?.maxWidth ?? 'lg';

  return (
    <MuiContainer
      maxWidth={resolvedMaxWidth}
      disableGutters={disableGutters}
      sx={[
        preset ? { py: preset.py } : null,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
