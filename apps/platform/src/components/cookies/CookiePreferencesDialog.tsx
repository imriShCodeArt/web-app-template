'use client';

import { useEffect, useState, type ReactElement } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useTranslations } from 'next-intl';

import { useCookieConsent } from '@/components/cookies/CookieConsentContext';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

export function CookiePreferencesDialog() {
  const t = useTranslations('cookies');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { consent, preferencesOpen, closePreferences, saveCustom } =
    useCookieConsent();

  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    if (!preferencesOpen) return;
    const id = requestAnimationFrame(() => {
      if (consent) {
        setPreferences(consent.preferences);
        setAnalytics(consent.analytics);
        setMarketing(consent.marketing);
      } else {
        // Default optional categories to enabled on first open.
        setPreferences(true);
        setAnalytics(true);
        setMarketing(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [preferencesOpen, consent]);

  return (
    <Dialog
      open={preferencesOpen}
      onClose={closePreferences}
      fullWidth
      fullScreen={fullScreen}
      maxWidth="sm"
      aria-labelledby="cookie-preferences-title"
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: fullScreen ? '100%' : 'min(600px, calc(100% - 64px))',
          },
        },
      }}
    >
      <DialogTitle
        id="cookie-preferences-title"
        sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 2 } }}
      >
        {t('dialogTitle')}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={{ xs: 2.25, sm: 2.5 }}>
          <CategoryBlock
            title={t('categories.necessary.title')}
            description={t('categories.necessary.description')}
            examples={t('categories.necessary.examples')}
            locked
            checked
            switchAria={t('categories.necessary.switchAria')}
          />
          <CategoryBlock
            title={t('categories.preferences.title')}
            description={t('categories.preferences.description')}
            examples={t('categories.preferences.examples')}
            control={
              <Switch
                checked={preferences}
                onChange={(_, v) => setPreferences(v)}
                slotProps={{
                  input: {
                    'aria-label': t('categories.preferences.switchAria'),
                  },
                }}
              />
            }
          />
          <CategoryBlock
            title={t('categories.analytics.title')}
            description={t('categories.analytics.description')}
            examples={t('categories.analytics.examples')}
            control={
              <Switch
                checked={analytics}
                onChange={(_, v) => setAnalytics(v)}
                slotProps={{
                  input: {
                    'aria-label': t('categories.analytics.switchAria'),
                  },
                }}
              />
            }
          />
          <CategoryBlock
            title={t('categories.marketing.title')}
            description={t('categories.marketing.description')}
            examples={t('categories.marketing.examples')}
            control={
              <Switch
                checked={marketing}
                onChange={(_, v) => setMarketing(v)}
                slotProps={{
                  input: {
                    'aria-label': t('categories.marketing.switchAria'),
                  },
                }}
              />
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: { sm: 'flex-end' },
          '& .MuiButton-root': {
            width: { xs: '100%', sm: 'auto' },
            minHeight: 44,
            py: 1.125,
          },
        }}
      >
        <Button
          type="button"
          onClick={withCtaTracking(
            closePreferences,
            'cookie_preferences_cancel',
            'cookie_preferences_dialog',
          )}
        >
          {t('cancel')}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={withCtaTracking(
            () => saveCustom({ preferences, analytics, marketing }),
            'cookie_preferences_save',
            'cookie_preferences_dialog',
          )}
        >
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CategoryBlock({
  title,
  description,
  examples,
  locked,
  checked,
  switchAria,
  control,
}: {
  title: string;
  description: string;
  examples: string;
  locked?: boolean;
  checked?: boolean;
  switchAria?: string;
  control?: ReactElement;
}) {
  return (
    <Stack spacing={0.75}>
      <FormControlLabel
        control={
          locked ? (
            <Switch
              checked={checked}
              disabled
              size="medium"
              slotProps={{
                input: {
                  'aria-label': switchAria ?? title,
                },
              }}
            />
          ) : (
            control!
          )
        }
        label={
          <Typography
            component="span"
            variant="subtitle2"
            sx={{ fontWeight: 700 }}
          >
            {title}
          </Typography>
        }
        sx={{ alignItems: 'flex-start', ml: 0, mr: 0, gap: 1 }}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ pl: { xs: 0, sm: 5 }, textAlign: 'start' }}
      >
        {description}
      </Typography>
      <Typography
        component="pre"
        variant="caption"
        color="text.disabled"
        sx={{
          pl: { xs: 0, sm: 5 },
          m: 0,
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit',
          textAlign: 'start',
        }}
      >
        {examples}
      </Typography>
    </Stack>
  );
}
