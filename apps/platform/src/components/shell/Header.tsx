'use client';

import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTranslations } from 'next-intl';

import { mainNav } from '@/config/navigation';
import { Button as NavButton } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { MainCta } from '@/components/ui/MainCta';
import { MarkerHighlight } from '@/components/ui/MarkerHighlight';
import { usePathname } from '@/i18n/routing';
import { isNavItemActive } from '@/lib/navigation/isNavItemActive';
import { navCtaName } from '@/lib/tracking/withCtaTracking';
import { AuthEntryButton } from './AuthEntryButton';
import { FloatingAppBar } from './FloatingAppBar';
import { HeaderSettingsMenu } from './HeaderSettingsMenu';
import { MobileNav } from './MobileNav';
import { NavMenuGroup } from './NavMenuGroup';

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = mainNav.filter((item) => !item.disabled);

  return (
    <>
      <FloatingAppBar>
        <Logo shrinkOnScroll priority />

        <Stack
          component="nav"
          direction={'row'}
          spacing={1}
          aria-label="Main navigation"
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              justifyContent: 'space-around',
              display: 'flex',
              px: '2em',
            }}
          >
            {navItems.map((item) => {
              if (item.children?.length) {
                return <NavMenuGroup key={item.href} item={item} />;
              }

              const label = t(item.titleKey);
              const active = isNavItemActive(pathname, item.href);

              return (
                <NavButton
                  key={item.href}
                  href={item.href}
                  prefetch={item.prefetch}
                  external={item.external}
                  variant="text"
                  color="inherit"
                  size="medium"
                  aria-current={active ? 'page' : undefined}
                  trackCta={{
                    name: navCtaName(item.href),
                    location: 'header_nav',
                  }}
                  sx={{
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {active ? (
                    <MarkerHighlight sx={{ px: 1, py: 0.25 }}>
                      {label}
                    </MarkerHighlight>
                  ) : (
                    label
                  )}
                </NavButton>
              );
            })}
          </Box>
          <HeaderSettingsMenu />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AuthEntryButton />
            <MainCta size="medium" ctaLocation="header" />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 0.5,
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <HeaderSettingsMenu size="small" />
          <AuthEntryButton compact />
          <IconButton
            edge="end"
            color="inherit"
            aria-label={t('common.openMenu')}
            aria-controls="mobile-navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </FloatingAppBar>

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
      />
    </>
  );
}
