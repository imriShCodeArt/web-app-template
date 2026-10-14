'use client';

import { useMemo, useState } from 'react';
import GoogleIcon from '@mui/icons-material/Google';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import { defaultLocale, isLocale } from '@template/i18n';
import { signInWithGooglePopup } from '@template/auth/client';
import { track } from '@/lib/tracking/analytics';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';
import { finishGooglePopupSession } from '@/lib/auth/finishGooglePopupSession';
import { navigateAfterAuth } from '@/lib/auth/navigateAfterAuth';
import { getPathname, useRouter } from '@/i18n/routing';

import { authFieldSx } from './authFieldSx';
import { persistOAuthSignupContext } from './persistOAuthSignupContext';
import { useAuthModal } from './AuthModalProvider';

export interface SignInFormProps {
  /** After credentials success or when closing; full navigation target (pathname, possibly with locale). */
  callbackUrl?: string;
  /** NextAuth / URL `error` query value (OAuth, etc.). */
  routeError?: string;
  /** Shown between Google sign-in and the email/password form. */
  promptMessage?: string;
  /** Prefill website for new Google accounts (e.g. URL from the scan widget). */
  initialWebsite?: string;
  onForgotPassword?: (email: string) => void;
  onSwitchToSignUp?: () => void;
}

function mapRouteErrorToAuthErrorKey(
  error: string,
):
  | 'configuration'
  | 'accessDenied'
  | 'verification'
  | 'oauthAccountNotLinked'
  | 'generic' {
  if (error === 'Configuration') return 'configuration';
  if (error === 'AccessDenied') return 'accessDenied';
  if (error === 'Verification') return 'verification';
  if (error === 'OAuthAccountNotLinked') return 'oauthAccountNotLinked';
  return 'generic';
}

export function SignInForm({
  callbackUrl,
  routeError,
  promptMessage,
  initialWebsite,
  onForgotPassword,
  onSwitchToSignUp,
}: SignInFormProps) {
  const t = useTranslations('auth.signIn');
  const tAuthError = useTranslations('auth.authError');
  const theme = useTheme();
  const fieldDir = theme.direction === 'rtl' ? 'rtl' : 'ltr';
  const locale = useLocale();
  const router = useRouter();
  const { closeAuthModal } = useAuthModal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const oauthOrRouteErrorMessage = useMemo(() => {
    if (routeError === undefined || routeError === '') {
      return null;
    }
    if (routeError === 'CredentialsSignin') {
      return t('invalidCredentials');
    }
    return tAuthError(mapRouteErrorToAuthErrorKey(routeError));
  }, [routeError, t, tAuthError]);

  const alertMessage = error ?? oauthOrRouteErrorMessage;

  const afterAuthTarget = callbackUrl?.trim() || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result?.ok || result.error) {
      setError(t('invalidCredentials'));
      return;
    }

    track('login', { method: 'email' });
    navigateAfterAuth(afterAuthTarget);
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const website = initialWebsite?.trim();
    const popupCallbackUrl = getPathname({
      locale: isLocale(locale) ? locale : defaultLocale,
      href: '/auth/oauth-popup',
    });
    const result = await signInWithGooglePopup({
      popupCallbackUrl,
      fallbackCallbackUrl: afterAuthTarget,
      beforeRedirect: async () => {
        if (!website) return;
        try {
          await persistOAuthSignupContext({ website });
        } catch {
          // Non-fatal: existing Google users still sign in; new users keep the placeholder.
        }
      },
    });
    if (!result.ok) {
      setLoading(false);
      if (result.error && result.error !== 'cancelled') {
        setError(t('genericError'));
      }
      return;
    }
    await finishGooglePopupSession({
      callbackUrl: afterAuthTarget,
      closeAuthModal,
      router,
    });
    setLoading(false);
  }

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 0, sm: 1 } }}>
      {alertMessage && <Alert severity="error">{alertMessage}</Alert>}

      <Button
        variant="outlined"
        fullWidth
        startIcon={<GoogleIcon />}
        disabled={loading}
        onClick={withCtaTracking(
          () => void handleGoogle(),
          'sign_in_google',
          'auth_modal',
        )}
        sx={{
          py: 1.25,
          gap: 1,
          justifyContent: 'center',
          color: 'text.primary',
          borderColor: 'divider',
          '& .MuiButton-startIcon': {
            marginInlineStart: 0,
            marginInlineEnd: 0,
          },
          '&:hover': {
            borderColor: 'secondary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        {t('googleCta')}
      </Button>

      {promptMessage ? (
        <Alert severity="info" sx={{ width: '100%' }}>
          {promptMessage}
        </Alert>
      ) : null}

      <Divider />

      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Stack spacing={2}>
          <TextField
            label={t('emailLabel')}
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
          <TextField
            label={t('passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            slotProps={{
              htmlInput: { dir: fieldDir },
              inputLabel: { shrink: true },
            }}
            sx={authFieldSx}
          />
          {onForgotPassword ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
              <Button
                type="button"
                variant="text"
                onClick={withCtaTracking(
                  () => onForgotPassword(email),
                  'sign_in_forgot_password',
                  'auth_modal',
                )}
                sx={{
                  fontWeight: 700,
                  p: 0,
                  minWidth: 0,
                  fontSize: '0.875rem',
                }}
              >
                {t('forgotPassword')}
              </Button>
            </Box>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            onClick={withCtaTracking(undefined, 'sign_in_submit', 'auth_modal')}
            sx={{ py: 1.25 }}
          >
            {t('submit')}
          </Button>
        </Stack>
      </Box>

      {onSwitchToSignUp ? (
        <Typography
          component="div"
          variant="body2"
          sx={{ textAlign: 'center' }}
        >
          {t('noAccount')}{' '}
          <Button
            type="button"
            variant="text"
            onClick={withCtaTracking(
              onSwitchToSignUp,
              'sign_in_switch_to_sign_up',
              'auth_modal',
            )}
            sx={{
              fontWeight: 700,
              verticalAlign: 'baseline',
              p: 0,
              minWidth: 0,
            }}
          >
            {t('signUpLink')}
          </Button>
        </Typography>
      ) : null}
    </Stack>
  );
}
