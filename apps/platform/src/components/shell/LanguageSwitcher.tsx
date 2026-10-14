'use client';

import { useState, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';

import { isLocale, localeLabels, locales, type Locale } from '@template/i18n';
import { usePathname, useRouter } from '@/i18n/routing';
import { getRouterReplaceTarget } from '@/lib/i18n/router-path';
import { track } from '@/lib/tracking/analytics';

type LanguageSwitcherProps = {
  compact?: boolean;
};

const localeFlagSrc: Record<Locale, string> = {
  en: '/flags/us.svg',
  he: '/flags/il.svg',
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : 'he';
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  function handleOpen(event: MouseEvent<HTMLElement>) {
    track('cta_click', {
      cta_name: 'language_menu_open',
      cta_location: 'header_language',
    });
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleSelect(nextLocale: (typeof locales)[number]) {
    handleClose();
    if (nextLocale === locale) return;
    track('cta_click', {
      cta_name: `language_${nextLocale}`,
      cta_location: 'header_language',
    });
    router.replace(getRouterReplaceTarget(pathname, params), {
      locale: nextLocale,
    });
  }

  return (
    <>
      {compact ? (
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-label={`Change language, current language ${localeLabels[locale]}`}
        >
          <Box
            component="img"
            src={localeFlagSrc[locale]}
            alt=""
            aria-hidden="true"
            sx={{
              width: 24,
              height: 18,
              borderRadius: { xs: 0, md: 0.5 },
              boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.16)',
              objectFit: 'cover',
            }}
          />
        </IconButton>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={handleOpen}
          endIcon={<KeyboardArrowDownIcon />}
          aria-label="Change language"
        >
          {localeLabels[locale]}
        </Button>
      )}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {locales.map((itemLocale) => (
          <MenuItem
            key={itemLocale}
            selected={itemLocale === locale}
            onClick={() => handleSelect(itemLocale)}
          >
            {localeLabels[itemLocale]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
