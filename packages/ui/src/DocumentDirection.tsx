'use client';

import { useEffect } from 'react';

import type { Locale } from '@template/i18n';
import { getLocaleDirection } from '@template/i18n';

/**
 * Sets `dir` and `lang` on `<html>` so the whole document (including MUI portaled
 * elements like Dialog/Modal, tooltips, popovers) respects the active locale.
 */
export function DocumentDirection({ locale }: { locale: Locale }) {
  useEffect(() => {
    const dir = getLocaleDirection(locale);
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', locale);
  }, [locale]);

  return null;
}
