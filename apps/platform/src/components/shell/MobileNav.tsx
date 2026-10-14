'use client';

import type { ElementType } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer, { type DrawerProps } from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import CloseIcon from '@mui/icons-material/Close';
import { useLocale, useTranslations } from 'next-intl';

import type { NavItem } from '@/config/navigation';
import { getLocaleDirection, isLocale } from '@template/i18n';
import { Link, usePathname } from '@/i18n/routing';
import { Logo } from '@/components/ui/Logo';
import { MainCta } from '@/components/ui/MainCta';
import { MarkerHighlight } from '@/components/ui/MarkerHighlight';
import { HeaderSettingsMenu } from './HeaderSettingsMenu';
import { flattenNavItems } from '@/lib/navigation/flattenNavItems';
import { isNavItemActive } from '@/lib/navigation/isNavItemActive';
import { navCtaName, withCtaTracking } from '@/lib/tracking/withCtaTracking';
import { AuthEntryButton } from './AuthEntryButton';

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
};

export function MobileNav({ open, onClose, navItems }: MobileNavProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const rawLocale = useLocale();

  const direction = isLocale(rawLocale) ? getLocaleDirection(rawLocale) : 'ltr';

  const anchor: DrawerProps['anchor'] = direction === 'rtl' ? 'right' : 'left';
  const flatNavItems = flattenNavItems(navItems);

  return (
    <Drawer
      id="mobile-navigation"
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            maxWidth: '85vw',
          },
        },
      }}
    >
      <Stack
        sx={{
          height: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            minHeight: 64,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: 2,
          }}
        >
          <Logo onClick={onClose} />

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <HeaderSettingsMenu size="small" />
            <IconButton aria-label={t('common.closeMenu')} onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 2 }}>
          <AuthEntryButton fullWidth onMenuInteraction={onClose} />
        </Box>

        <Box sx={{ px: 2, pb: 2 }}>
          <MainCta fullWidth ctaLocation="mobile_nav" onClick={onClose} />
        </Box>

        <Divider />

        <List
          component="nav"
          aria-label="Mobile navigation"
          sx={{
            px: 1,
            py: 2,
          }}
        >
          {flatNavItems.map((item) => {
            const label = t(item.titleKey);
            const active = isNavItemActive(pathname, item.href);
            const primary = active ? (
              <MarkerHighlight component="span" sx={{ px: 1, py: 0.25 }}>
                {label}
              </MarkerHighlight>
            ) : (
              label
            );

            if (item.external) {
              return (
                <ListItemButton
                  key={item.href}
                  component="a"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={item.disabled}
                  onClick={withCtaTracking(
                    onClose,
                    navCtaName(item.href),
                    'mobile_nav',
                  )}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <ListItemText primary={primary} />
                </ListItemButton>
              );
            }

            return (
              <ListItemButton
                key={item.href}
                component={Link as ElementType}
                href={item.href}
                prefetch={item.prefetch}
                disabled={item.disabled}
                onClick={withCtaTracking(
                  onClose,
                  navCtaName(item.href),
                  'mobile_nav',
                )}
                aria-current={active ? 'page' : undefined}
                sx={{
                  borderRadius: 2,
                  ...(active
                    ? {
                        '& .MuiListItemText-primary': { fontWeight: 700 },
                      }
                    : {}),
                }}
              >
                <ListItemText primary={primary} />
              </ListItemButton>
            );
          })}
        </List>
      </Stack>
    </Drawer>
  );
}
