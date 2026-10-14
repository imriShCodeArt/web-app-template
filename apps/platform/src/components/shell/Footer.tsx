'use client';

import type { ElementType } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinkBase from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import { footerNav } from '@/config/navigation';
import { siteConfig } from '@template/config';
import { Link, usePathname } from '@/i18n/routing';
import { ContactForm } from '@/components/contact/ContactForm';
import { useCookieConsent } from '@/components/cookies/CookieConsentContext';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { navCtaName, withCtaTracking } from '@/lib/tracking/withCtaTracking';

export function Footer() {
  const t = useTranslations();
  const tCookies = useTranslations('cookies');
  const { openPreferences } = useCookieConsent();
  const pathname = usePathname();
  const showContactFormStrip = pathname !== '/contact';
  const year = new Date().getFullYear();
  const siteName = t(siteConfig.nameKey);
  const siteDescription = t(siteConfig.descriptionKey);

  return (
    <>
      {showContactFormStrip ? <ContactForm /> : null}
      <Box
        component="footer"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container
          sx={{
            py: { xs: 4, md: 6 },
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            sx={{
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'flex-start' },
            }}
          >
            <Stack spacing={2} sx={{ maxWidth: 360 }}>
              <Logo />

              <Typography
                variant="subtitle2"
                component={'h3'}
                color="text.secondary"
              >
                {siteDescription}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 3, sm: 6 }}
            >
              {footerNav.map((group) => (
                <Stack key={group.titleKey} spacing={1}>
                  <Typography
                    variant="subtitle2"
                    component={'h4'}
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {t(group.titleKey)}
                  </Typography>

                  <Stack spacing={0.75}>
                    {group.items.map((item) => {
                      if (item.external) {
                        return (
                          <LinkBase
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            color="text.secondary"
                            onClick={withCtaTracking(
                              undefined,
                              navCtaName(item.href),
                              'footer_nav',
                            )}
                            sx={{
                              fontSize: 14,
                            }}
                          >
                            {t(item.titleKey)}
                          </LinkBase>
                        );
                      }

                      return (
                        <LinkBase
                          key={item.href}
                          component={Link as ElementType}
                          href={item.href}
                          prefetch={item.prefetch}
                          underline="hover"
                          color="text.secondary"
                          onClick={withCtaTracking(
                            undefined,
                            navCtaName(item.href),
                            'footer_nav',
                          )}
                          sx={{
                            fontSize: 14,
                          }}
                        >
                          {t(item.titleKey)}
                        </LinkBase>
                      );
                    })}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            useFlexGap
            sx={{
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {year} {siteName}. {t('footer.rights')}
            </Typography>
            <Button
              type="button"
              variant="text"
              size="small"
              color="inherit"
              onClick={withCtaTracking(
                openPreferences,
                'cookie_settings',
                'footer',
              )}
              sx={{
                textTransform: 'none',
                p: 0,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 400,
              }}
            >
              {tCookies('footerLink')}
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
