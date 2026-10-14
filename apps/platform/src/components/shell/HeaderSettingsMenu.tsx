'use client';

import { useState, type MouseEvent } from 'react';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import { useAppThemeMode } from '@template/ui';
import { isLocale, localeLabels, locales, type Locale } from '@template/i18n';
import { usePathname, useRouter } from '@/i18n/routing';
import { getRouterReplaceTarget } from '@/lib/i18n/router-path';
import { track } from '@/lib/tracking/analytics';

const localeFlagSrc: Record<Locale, string> = {
  en: '/flags/us.svg',
  he: '/flags/il.svg',
};

type HeaderSettingsMenuProps = {
  size?: 'small' | 'medium' | 'large';
};

export function HeaderSettingsMenu({
  size = 'medium',
}: HeaderSettingsMenuProps) {
  const t = useTranslations();
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : 'he';
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { mode, toggleMode } = useAppThemeMode();
  const isDark = mode === 'dark';
  const menuHorizontal = theme.direction === 'rtl' ? 'left' : 'right';

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  function handleOpen(event: MouseEvent<HTMLElement>) {
    track('cta_click', {
      cta_name: 'settings_menu_open',
      cta_location: 'header_settings',
    });
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleThemeToggle() {
    toggleMode();
    handleClose();
  }

  function handleLocaleSelect(nextLocale: (typeof locales)[number]) {
    handleClose();
    if (nextLocale === locale) return;
    track('cta_click', {
      cta_name: `language_${nextLocale}`,
      cta_location: 'header_settings',
    });
    router.replace(getRouterReplaceTarget(pathname, params), {
      locale: nextLocale,
    });
  }

  return (
    <>
      <IconButton
        color="inherit"
        size={size}
        onClick={handleOpen}
        aria-label={t('common.settings.openMenu')}
        aria-controls={open ? 'header-settings-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <SettingsOutlinedIcon />
      </IconButton>
      <Menu
        id="header-settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: menuHorizontal }}
        transformOrigin={{ vertical: 'top', horizontal: menuHorizontal }}
      >
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {isDark ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {isDark
              ? t('common.theme.switchToLight')
              : t('common.theme.switchToDark')}
          </ListItemText>
        </MenuItem>
        <Divider />
        {locales.map((itemLocale) => (
          <MenuItem
            key={itemLocale}
            selected={itemLocale === locale}
            onClick={() => handleLocaleSelect(itemLocale)}
          >
            <ListItemIcon>
              <Box
                component="img"
                src={localeFlagSrc[itemLocale]}
                alt=""
                aria-hidden="true"
                sx={{
                  width: 24,
                  height: 18,
                  borderRadius: 0.5,
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.16)',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </ListItemIcon>
            <ListItemText>{localeLabels[itemLocale]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
