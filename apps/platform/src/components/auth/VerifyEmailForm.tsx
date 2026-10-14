'use client';

import { useEffect, useRef, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/Check';
import EmailIcon from '@mui/icons-material/Email';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { track } from '@/lib/tracking/analytics';
import { safeInternalPath } from '@/lib/auth/safeInternalPath';

import { authFieldSx } from './authFieldSx';

export interface VerifyEmailFormProps {
  email?: string;
  callbackUrl?: string;
}

export function VerifyEmailForm({ email, callbackUrl }: VerifyEmailFormProps) {
  const t = useTranslations('auth.verifyEmail');
  const router = useRouter();
  const afterVerify = safeInternalPath(callbackUrl) ?? '/';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const redirectedRef = useRef(false);
  const verifiedTrackedRef = useRef(false);

  useEffect(() => {
    if (verified && !redirectedRef.current) {
      redirectedRef.current = true;
      const timer = setTimeout(() => {
        router.push(afterVerify);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [verified, router, afterVerify]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || otp.length !== 6) return;
    setError(null);
    setResendMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (res.ok) {
        if (!verifiedTrackedRef.current) {
          verifiedTrackedRef.current = true;
          track('email_verified', { method: 'email' });
        }
        setVerified(true);
        return;
      }

      if (res.status === 422) {
        setError(t('invalidCode'));
      } else {
        setError(t('genericError'));
      }
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setError(null);
    setResendMessage(null);
    setResending(true);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendMessage(t('resendSuccess'));
        setOtp('');
      } else {
        setResendMessage(t('resendError'));
      }
    } catch {
      setResendMessage(t('resendError'));
    } finally {
      setResending(false);
    }
  }

  if (verified) {
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
          <CircularProgress size={20} />
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
          <EmailIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, textAlign: 'center' }}
          >
            {t('title')}
          </Typography>
          {email ? (
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ textAlign: 'center' }}
            >
              {t.rich('subtitle', {
                email,
                b: (chunks) => (
                  <Box component="b" sx={{ color: 'text.primary' }}>
                    {chunks}
                  </Box>
                ),
              })}
            </Typography>
          ) : null}
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {resendMessage && (
          <Alert
            severity={
              resendMessage === t('resendSuccess') ? 'success' : 'error'
            }
          >
            {resendMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <Stack spacing={2}>
            <TextField
              label={t('otpLabel')}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
              }}
              placeholder={t('otpPlaceholder')}
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              slotProps={{
                htmlInput: {
                  maxLength: 6,
                  dir: 'ltr',
                  style: {
                    letterSpacing: '0.3em',
                    fontSize: '1.4rem',
                    textAlign: 'center',
                  },
                },
                inputLabel: { shrink: true },
              }}
              sx={authFieldSx}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading || otp.length !== 6}
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

        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Typography variant="body2" color="text.secondary">
            {t('resendPrompt')}
          </Typography>
          <Button
            type="button"
            variant="text"
            size="small"
            disabled={resending}
            onClick={() => void handleResend()}
            sx={{ fontWeight: 700, p: 0, minWidth: 0 }}
          >
            {resending ? <CircularProgress size={14} /> : t('resendCta')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
