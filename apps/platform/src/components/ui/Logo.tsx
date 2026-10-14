'use client';

import { type ElementType, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { useAppThemeMode } from '@template/ui';
import { siteConfig } from '@template/config';
import { Link } from '@/i18n/routing';

/** Intrinsic dimensions of `public/logo.webp` (display is much smaller). */
const LOGO_INTRINSIC_WIDTH = 294;
const LOGO_INTRINSIC_HEIGHT = 84;

type LogoProps = {
  href?: string;
  showText?: boolean;
  onClick?: () => void;
  size?: number;
  shrinkOnScroll?: boolean;
  /** Set on above-the-fold header logo (LCP). */
  priority?: boolean;
};

export function Logo({
  href = '/',
  showText = true,
  onClick,
  size,
  shrinkOnScroll = false,
  priority = false,
}: LogoProps) {
  const t = useTranslations();
  const [isScrolled, setIsScrolled] = useState(false);
  const { mode } = useAppThemeMode();
  const { direction } = useTheme();
  const isRtl = direction === 'rtl';
  const logoSrc =
    mode === 'dark'
      ? isRtl
        ? '/logo_image_dark-rtl.svg'
        : '/logo_image_dark.svg'
      : isRtl
        ? '/logo-rtl.svg'
        : siteConfig.logoSrc;
  const siteName = t(siteConfig.nameKey);
  const baseLogoHeight = size ?? siteConfig.logoHeight;
  const logoHeight =
    shrinkOnScroll && isScrolled
      ? Math.round(baseLogoHeight * 0.86)
      : baseLogoHeight;
  const mobileLogoHeight = Math.round(logoHeight * 0.72);

  useEffect(() => {
    if (!shrinkOnScroll) return;

    function updateScrolledState() {
      setIsScrolled(window.scrollY > 8);
    }

    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrolledState);
    };
  }, [shrinkOnScroll]);

  return (
    <Box
      component={Link as ElementType}
      href={href}
      onClick={onClick}
      aria-label={siteName}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        color: 'inherit',
        textDecoration: 'none',
        '&:focus-visible': {
          outline: 2,
          outlineColor: 'primary.main',
          outlineOffset: 4,
          borderRadius: 2,
        },
      }}
    >
      {logoSrc ? (
        <Box
          sx={{
            height: { xs: mobileLogoHeight, md: logoHeight },
            flexShrink: 0,
            transition: 'height 180ms ease',
          }}
        >
          <Image
            src={logoSrc}
            alt={siteName}
            width={LOGO_INTRINSIC_WIDTH}
            height={LOGO_INTRINSIC_HEIGHT}
            priority={priority}
            sizes="(max-width: 900px) 180px, 294px"
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>
      ) : null}

      {!logoSrc ? (
        <Box
          aria-hidden="true"
          sx={{
            display: 'grid',
            placeItems: 'center',
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: 16,
            fontWeight: 800,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {siteConfig.shortName.slice(0, 1)}
        </Box>
      ) : null}

      {showText && !logoSrc ? (
        <Typography
          component="span"
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            letterSpacing: -0.2,
          }}
        >
          {siteName}
        </Typography>
      ) : null}
    </Box>
  );
}
