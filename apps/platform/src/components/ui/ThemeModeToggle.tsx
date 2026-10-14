'use client';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslations } from 'next-intl';

import { useAppThemeMode } from '@template/ui';

type ThemeModeToggleProps = {
  size?: 'small' | 'medium' | 'large';
};

export function ThemeModeToggle({ size = 'medium' }: ThemeModeToggleProps) {
  const t = useTranslations('common.theme');
  const { mode, toggleMode } = useAppThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? t('switchToLight') : t('switchToDark')}>
      <IconButton
        onClick={toggleMode}
        aria-label={isDark ? t('switchToLight') : t('switchToDark')}
        color="inherit"
        size={size}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
