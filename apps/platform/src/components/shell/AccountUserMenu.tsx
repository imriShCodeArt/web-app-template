'use client';

import type { ElementType, MouseEvent } from 'react';
import { useCallback, useId, useState } from 'react';
import AccountIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { getFirstNameOrLocalPart } from '@template/auth';

import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { accountHref } from '@/lib/account/accountTabQuery';
import { signOutAndClearUserId } from '@/lib/auth/signOutAndClearUserId';
import { track } from '@/lib/tracking/analytics';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

type AccountUserMenuProps = {
  fullWidth?: boolean;
  compact?: boolean;
  onMenuInteraction?: () => void;
};

export function AccountUserMenu({
  fullWidth = false,
  compact = false,
  onMenuInteraction,
}: AccountUserMenuProps) {
  const t = useTranslations('auth');
  const tMenu = useTranslations('auth.userMenu');
  const theme = useTheme();
  const { data } = useSession();
  const menuAnchorHorizontal = theme.direction === 'rtl' ? 'left' : 'right';
  const menuId = useId();
  const buttonId = `${menuId}-button`;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const user = data?.user;
  const first = getFirstNameOrLocalPart(
    user?.name ?? null,
    user?.email ?? null,
  );
  const welcomeText = first ? t('welcomeNamed', { name: first }) : t('welcome');

  const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    track('cta_click', {
      cta_name: 'account_menu_open',
      cta_location: 'header_account_menu',
    });
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleNavigate = useCallback(() => {
    handleClose();
    onMenuInteraction?.();
  }, [handleClose, onMenuInteraction]);

  const handleSignOut = useCallback(() => {
    handleClose();
    onMenuInteraction?.();
    void signOutAndClearUserId({ callbackUrl: '/' });
  }, [handleClose, onMenuInteraction]);

  const nameMaxWidth = compact
    ? { xs: 72, sm: 100, md: 160 }
    : { xs: 120, sm: 140, md: 160 };
  const avatarSize = compact ? 28 : 32;

  const trigger = fullWidth ? (
    <Button
      type="button"
      fullWidth
      variant="outlined"
      color="secondary"
      onClick={handleOpen}
      id={buttonId}
      aria-haspopup="menu"
      aria-expanded={open ? 'true' : 'false'}
      aria-controls={open ? menuId : undefined}
    >
      {t('myAccount')}
    </Button>
  ) : (
    <ButtonBase
      id={buttonId}
      onClick={handleOpen}
      aria-haspopup="menu"
      aria-expanded={open ? 'true' : 'false'}
      aria-controls={open ? menuId : undefined}
      aria-label={`${welcomeText}. ${tMenu('ariaLabel')}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 1,
        maxWidth: '100%',
        px: compact ? 0.25 : 0.5,
        py: 0.25,
        borderRadius: 1,
        minHeight: compact ? 36 : 40,
        flexShrink: compact ? 1 : undefined,
        minWidth: 0,
        '&:hover': { bgcolor: 'action.hover' },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Typography
        variant={compact ? 'caption' : 'body2'}
        component="span"
        color="text.primary"
        sx={{
          maxWidth: nameMaxWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {welcomeText}
      </Typography>
      <Avatar
        alt=""
        sx={{
          width: avatarSize,
          height: avatarSize,
          bgcolor: 'transparent',
          border: '1px solid #CCC',
          flexShrink: 0,
        }}
      >
        <AccountIcon
          color="action"
          aria-hidden
          sx={compact ? { fontSize: 18 } : undefined}
        />
      </Avatar>
    </ButtonBase>
  );

  return (
    <>
      {trigger}
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: menuAnchorHorizontal,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: menuAnchorHorizontal,
        }}
        slotProps={{
          list: { 'aria-labelledby': buttonId },
        }}
      >
        <MenuItem
          component={Link as ElementType}
          href={accountHref('profile')}
          onClick={withCtaTracking(
            handleNavigate,
            'account_menu_profile',
            'header_account_menu',
          )}
        >
          {tMenu('profile')}
        </MenuItem>
        <MenuItem
          component={Link as ElementType}
          href={accountHref('settings')}
          onClick={withCtaTracking(
            handleNavigate,
            'account_menu_settings',
            'header_account_menu',
          )}
        >
          {tMenu('settings')}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={withCtaTracking(
            handleSignOut,
            'sign_out',
            'header_account_menu',
          )}
        >
          {t('signOut')}
        </MenuItem>
      </Menu>
    </>
  );
}
