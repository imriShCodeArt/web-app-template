'use client';

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { GOOGLE_OAUTH_POPUP_CALLBACK_PATH } from '@template/auth/client';
import { usePathname } from '@/i18n/routing';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher';

import { ACCOUNT_CONSENTS_UPDATED_EVENT } from './TermsAcceptancePrompt';

export function MarketingPreferencePrompt() {
  const t = useTranslations('auth.marketingPrompt');
  const theme = useTheme();
  const fieldDir = theme.direction === 'rtl' ? 'rtl' : 'ltr';
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const onOAuthPopupPage = pathname === GOOGLE_OAUTH_POPUP_CALLBACK_PATH;

  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/account/marketing-prompt-status', {
        cache: 'no-store',
        signal,
      });
      if (!res.ok) return;
      const data = (await res.json()) as { needsPrompt?: boolean };
      if (data.needsPrompt === true) {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || onOAuthPopupPage) return;
    const abort = new AbortController();
    void Promise.resolve().then(() => loadStatus(abort.signal));
    const onConsentsUpdated = () => {
      void loadStatus(abort.signal);
    };
    window.addEventListener(ACCOUNT_CONSENTS_UPDATED_EVENT, onConsentsUpdated);
    return () => {
      abort.abort();
      window.removeEventListener(
        ACCOUNT_CONSENTS_UPDATED_EVENT,
        onConsentsUpdated,
      );
    };
  }, [status, loadStatus, onOAuthPopupPage]);

  async function submitPreference(marketingConsent: boolean) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketingConsent,
          acknowledgeMarketingPreference: true as const,
        }),
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (status !== 'authenticated' || onOAuthPopupPage || !open) {
    return null;
  }

  return (
    <Dialog
      open
      disableEnforceFocus
      onClose={(_event, reason) => {
        if (reason === 'escapeKeyDown' || reason === 'backdropClick') {
          return;
        }
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby="marketing-prompt-title"
    >
      <DialogTitle
        variant="h3"
        id="marketing-prompt-title"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          columnGap: 2,
        }}
      >
        <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
          {t('title')}
        </Box>
        <LanguageSwitcher compact />
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography
            variant="h5"
            color="text.primary"
            sx={{ pb: 0.5, lineHeight: 1.6 }}
          >
            {t('intro')}
          </Typography>
          {error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'start' }}>
            <Checkbox
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <Typography variant="body2" sx={{ direction: fieldDir }}>
              {t('marketingLabel')}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          justifyContent: 'stretch',
          gap: 1,
          px: 3,
          pb: 2,
          '& > :not(style) ~ :not(style)': { ml: { sm: 0 } },
        }}
      >
        <Button
          variant="text"
          color="inherit"
          fullWidth
          disabled={submitting}
          onClick={withCtaTracking(
            () => void submitPreference(false),
            'marketing_preference_skip',
            'account',
          )}
          sx={{ opacity: 0.7 }}
        >
          {t('skip')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={submitting}
          onClick={withCtaTracking(
            () => void submitPreference(checked),
            'marketing_preference_continue',
            'account',
          )}
        >
          {t('continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
