'use client';

import { useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/Check';
import LockResetIcon from '@mui/icons-material/LockReset';
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

const MIN_PASSWORD_LENGTH = 8;

export interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations('auth.resetPassword');
  const theme = useTheme();
  const fieldDir = theme.direction === 'rtl' ? 'rtl' : 'ltr';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const tokenMissing = !token?.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token?.trim()) return;

    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('tooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('mismatch'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.status === 422) {
        setError(t('invalidToken'));
        return;
      }

      if (!res.ok) {
        setError(t('genericError'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('successTitle')}
          </Typography>
          <Typography color="text.secondary">{t('successBody')}</Typography>
          <Button
            component={Link}
            href="/sign-in"
            variant="contained"
            onClick={withCtaTracking(
              undefined,
              'reset_password_sign_in',
              'reset_password_page',
            )}
            sx={{ py: 1.25, mt: 1 }}
          >
            {t('signInCta')}
          </Button>
        </Stack>
      </Paper>
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
      <Stack spacing={3}>
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <LockResetIcon color="primary" sx={{ fontSize: 48 }} />
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

        {tokenMissing ? (
          <Alert severity="error">{t('invalidToken')}</Alert>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <Stack spacing={2}>
            <TextField
              label={t('passwordLabel')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={tokenMissing || loading}
              autoComplete="new-password"
              slotProps={{
                htmlInput: { minLength: MIN_PASSWORD_LENGTH, dir: fieldDir },
                inputLabel: { shrink: true },
              }}
              sx={authFieldSx}
            />
            <TextField
              label={t('confirmPasswordLabel')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={tokenMissing || loading}
              autoComplete="new-password"
              slotProps={{
                htmlInput: { minLength: MIN_PASSWORD_LENGTH, dir: fieldDir },
                inputLabel: { shrink: true },
              }}
              sx={authFieldSx}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={tokenMissing || loading}
              onClick={withCtaTracking(
                undefined,
                'reset_password_submit',
                'reset_password_page',
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
      </Stack>
    </Paper>
  );
}
