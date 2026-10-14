'use client';

import type { ElementType, ForwardedRef, MouseEvent } from 'react';
import { forwardRef } from 'react';
import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from '@mui/material/Button';

import { Link } from '@/i18n/routing';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

export type ButtonProps = MuiButtonProps & {
  href?: string;
  prefetch?: boolean;
  external?: boolean;
  /**
   * Render a real `<a>` without the App Router Link interceptor.
   * Use for in-app hash targets (e.g. `/#scan-website`).
   */
  native?: boolean;
  target?: string;
  rel?: string;
  /** When set, records a `cta_click` analytics event before `onClick`. */
  trackCta?: { name: string; location: string };
};

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  {
    href,
    prefetch,
    external = false,
    native = false,
    target,
    rel,
    variant = 'contained',
    color = 'primary',
    trackCta,
    onClick,
    ...props
  },
  ref,
) {
  const handleClick = trackCta
    ? withCtaTracking(
        onClick as ((event: MouseEvent) => void) | undefined,
        trackCta.name,
        trackCta.location,
      )
    : onClick;

  if (!href) {
    return (
      <MuiButton
        ref={ref as ForwardedRef<HTMLButtonElement>}
        variant={variant}
        color={color}
        onClick={handleClick}
        {...props}
      />
    );
  }

  if (external || native) {
    return (
      <MuiButton
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        component="a"
        href={href}
        target={external ? (target ?? '_blank') : target}
        rel={external ? (rel ?? 'noopener noreferrer') : rel}
        variant={variant}
        color={color}
        onClick={handleClick}
        {...props}
      />
    );
  }

  return (
    <MuiButton
      ref={ref as ForwardedRef<HTMLAnchorElement>}
      component={Link as ElementType}
      href={href}
      prefetch={prefetch ?? false}
      variant={variant}
      color={color}
      onClick={handleClick}
      {...props}
    />
  );
});
