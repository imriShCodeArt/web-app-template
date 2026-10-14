'use client';

import { useState } from 'react';
import EmailIcon from '@mui/icons-material/Email';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useTranslations } from 'next-intl';

import { withCtaTracking } from '@/lib/tracking/withCtaTracking';
import { Link } from '@/i18n/routing';

import { authFieldSx } from './authFieldSx';

export interface ForgotPasswordFormProps {
  initialEmail?: string;
  /** When set, shown as a button instead of a link to `/sign-in`. */
  onBackToSignIn?: () => void;
  /** Compact layout for the auth modal (no card chrome). */
  embedded?: boolean;
}

export function ForgotPasswordForm({
  initialEmail = '',
  onBackToSignIn,
  embedded = false,
}: ForgotPasswordFormProps) {
  const t = useTranslations('auth.forgotPassword');
  const tSignIn = useTranslations('auth.signIn');
  const theme = useTheme();
  const fieldDir = theme.direction === 'rtl' ? 'rtl' : 'ltr';

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError(t('genericError'));
        return;
      }

      setSubmitted(true);
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  const backControl = onBackToSignIn ? (
    <Button
      type="button"
      variant="text"
      onClick={withCtaTracking(
        onBackToSignIn,
        'forgot_password_back_to_sign_in',
        embedded ? 'auth_modal' : 'forgot_password_page',
      )}
      sx={{ fontWeight: 700, p: 0, minWidth: 0 }}
    >
      {t('backToSignIn')}
    </Button>
  ) : (
    <Button
      component={Link}
      href="/sign-in"
      variant="text"
      onClick={withCtaTracking(
        undefined,
        'forgot_password_back_to_sign_in',
        'forgot_password_page',
      )}
      sx={{ fontWeight: 700, p: 0, minWidth: 0 }}
    >
      {t('backToSignIn')}
    </Button>
  );

  const content = submitted ? (
    <Stack spacing={2} sx={{ alignItems: embedded ? 'stretch' : 'center' }}>
      {!embedded ? <EmailIcon color="primary" sx={{ fontSize: 48 }} /> : null}
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, textAlign: embedded ? 'start' : 'center' }}
      >
        {t('successTitle')}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ textAlign: embedded ? 'start' : 'center' }}
      >
        {t('successBody')}
      </Typography>
      <Box sx={{ textAlign: embedded ? 'start' : 'center' }}>{backControl}</Box>
    </Stack>
  ) : (
    <Stack spacing={3}>
      {!embedded ? (
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <EmailIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, textAlign: 'center' }}
          >
            {t('title')}
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ textAlign: 'center' }}
          >
            {t('subtitle')}
          </Typography>
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="body2">
          {t('subtitle')}
        </Typography>
      )}

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <Stack spacing={2}>
          <TextField
            label={tSignIn('emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            slotProps={{
              htmlInput: { dir: fieldDir },
              inputLabel: { shrink: true },
            }}
            sx={authFieldSx}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            onClick={withCtaTracking(
              undefined,
              'forgot_password_submit',
              embedded ? 'auth_modal' : 'forgot_password_page',
            )}
            sx={{ py: 1.25 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('submit')
            )}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ textAlign: 'center' }}>{backControl}</Box>
    </Stack>
  );

  if (embedded) {
    return (
      <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 0, sm: 1 } }}>
        {content}
      </Stack>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
      }}
    >
      {content}
    </Paper>
  );
}
