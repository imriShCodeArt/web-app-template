'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';

import { useCookieConsent } from '@/components/cookies/CookieConsentContext';
import { Link as I18nLink } from '@/i18n/routing';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

/** WCAG-friendly minimum touch target ~44px */
const touchMin = { minHeight: 44, py: 1.125 };

export function CookieBanner() {
  const t = useTranslations('cookies');
  const { showBanner, acceptAll, rejectNonEssential, openPreferences } =
    useCookieConsent();

  if (!showBanner) return null;

  return (
    <>
      {/* Blocks interaction with the page behind the banner on small viewports */}
      <Box
        aria-hidden
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          inset: 0,
          zIndex: (theme) => theme.zIndex.modal - 2,
          bgcolor: 'rgba(0, 0, 0, 0.45)',
          pointerEvents: 'auto',
        }}
      />
      <Box
        component="section"
        role="region"
        aria-label={t('bannerAria')}
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.modal - 1,
          left: 0,
          right: 0,
          bottom: 0,
          boxSizing: 'border-box',
          pl: {
            xs: 'max(12px, env(safe-area-inset-left))',
            sm: 2.5,
          },
          pr: {
            xs: 'max(12px, env(safe-area-inset-right))',
            sm: 2.5,
          },
          pt: { xs: 2, sm: 2.5 },
          pb: {
            xs: 'max(16px, env(safe-area-inset-bottom))',
            sm: 2.5,
          },
          pointerEvents: 'none',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            pointerEvents: 'auto',
            position: 'relative',
            maxWidth: 960,
            mx: 'auto',
            p: { xs: 2.25, sm: 3 },
            borderRadius: { xs: 2.5, sm: 2 },
            border: 1,
            borderColor: 'divider',
            maxHeight: {
              xs: 'min(78dvh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 48px))',
              sm: 'none',
            },
            overflowY: { xs: 'auto', sm: 'visible' },
            WebkitOverflowScrolling: 'touch',
            pt: '2.5em!important',
          }}
        >
          <IconButton
            color="inherit"
            aria-label={t('rejectNonEssential')}
            onClick={withCtaTracking(
              rejectNonEssential,
              'cookie_reject_non_essential',
              'cookie_banner',
            )}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: 36,
              height: 36,
              color: 'text.disabled',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Stack spacing={{ xs: 2.25, sm: 2 }}>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                lineHeight: 1.65,
                textAlign: 'start',
              }}
            >
              {t('intro')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.65, textAlign: 'start' }}
            >
              {t('necessaryBlurb')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.65, textAlign: 'start' }}
            >
              {t('choiceBlurb')}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.25, sm: 1 }}
              useFlexGap
              sx={{
                flexWrap: 'wrap',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 1.25, sm: 1 },
                pt: { xs: 0.5, sm: 0 },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={withCtaTracking(
                  acceptAll,
                  'cookie_accept_all',
                  'cookie_banner',
                )}
                sx={{
                  ...touchMin,
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: 160 },
                }}
              >
                {t('acceptAll')}
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={withCtaTracking(
                  openPreferences,
                  'cookie_customize',
                  'cookie_banner',
                )}
                sx={{
                  ...touchMin,
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: 140 },
                }}
              >
                {t('customize')}
              </Button>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              useFlexGap
              sx={{
                alignItems: { xs: 'stretch', sm: 'center' },
                columnGap: 2,
                rowGap: 1,
                pt: { xs: 0.5, sm: 0 },
              }}
            >
              <Link
                component={I18nLink}
                href="/privacy"
                prefetch={false}
                underline="hover"
                color="text.secondary"
                variant="body2"
                sx={{
                  ...touchMin,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  textAlign: 'center',
                }}
              >
                {t('privacyPolicy')}
              </Link>
              <Link
                component={I18nLink}
                href="/cookies"
                prefetch={false}
                underline="hover"
                color="text.secondary"
                variant="body2"
                sx={{
                  ...touchMin,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  textAlign: 'center',
                }}
              >
                {t('cookiePolicy')}
              </Link>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
