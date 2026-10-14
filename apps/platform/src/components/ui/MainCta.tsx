'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { MouseEvent } from 'react';

import { getPathname, usePathname } from '@/i18n/routing';
import { track } from '@/lib/tracking/analytics';
import { Button, type ButtonProps } from './Button';

type MainCtaProps = Omit<ButtonProps, 'children' | 'href'> & {
  ctaLocation?: string;
};

export function MainCta({
  ctaLocation = 'header',
  onClick,
  ...props
}: MainCtaProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  const href = getPathname({ href: '/contact', locale });

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    track('cta_click', {
      cta_name: 'contact',
      cta_location: ctaLocation,
    });
    onClick?.(event);
    if (pathname === '/contact') {
      event.preventDefault();
    }
  }

  return (
    <Button href={href} native onClick={handleClick} {...props}>
      {t('navigation.contact')}
    </Button>
  );
}
