'use client';

import { useState } from 'react';
import GoogleIcon from '@mui/icons-material/Google';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import { defaultLocale, isLocale, type Locale } from '@template/i18n';
import { signInWithGooglePopup } from '@template/auth/client';
import { Link, getPathname, useRouter } from '@/i18n/routing';
import { stripWebsiteUrlPrefix } from '@/lib/account/websiteUrlField';
import { finishGooglePopupSession } from '@/lib/auth/finishGooglePopupSession';
import { safeInternalPath } from '@/lib/auth/safeInternalPath';
import { track } from '@/lib/tracking/analytics';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';

import { authFieldSx } from './authFieldSx';
import { persistOAuthSignupContext } from './persistOAuthSignupContext';
import { useAuthModal } from './AuthModalProvider';

export interface SignUpFormProps {
  callbackUrl?: string;
  /** Shown between Google sign-in and the registration form. */
  promptMessage?: string;
  /** Prefill the website field (e.g. URL from the scan widget). */
  initialWebsite?: string;
  onSwitchToSignIn?: () => void;
}

function signupLocale(raw: string): Locale {
  return isLocale(raw) ? raw : defaultLocale;
}

export function SignUpForm({
  callbackUrl,
  promptMessage,
  initialWebsite,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const t = useTranslations('auth.signUp');
  const theme = useTheme();
  const fieldDir = theme.direction === 'rtl' ? 'rtl' : 'ltr';
  const activeLocale = signupLocale(useLocale());
  const router = useRouter();
  const { closeAuthModal } = useAuthModal();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState(() =>
    stripWebsiteUrlPrefix(initialWebsite ?? ''),
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const afterAuthTarget = callbackUrl?.trim() || '/';
  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    website.trim().length > 0 &&
    acceptTerms;

  const termsLabel = (
    <Typography component="span" variant="body2">
      {t.rich('acceptTerms', {
        terms: (chunks) => (
          <Link href="/terms" prefetch={false} style={{ fontWeight: 700 }}>
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href="/privacy" prefetch={false} style={{ fontWeight: 700 }}>
            {chunks}
          </Link>
        ),
      })}
    </Typography>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError(t('genericError'));
      return;
    }
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email,
        password,
        website: website.trim(),
        acceptTerms: true as const,
        marketingConsent,
        locale: activeLocale,
      }),
    });

    if (res.status === 409) {
      setLoading(false);
      setError(t('emailTaken'));
      return;
    }

    if (!res.ok) {
      setLoading(false);
      setError(t('genericError'));
      return;
    }

    track('sign_up', { method: 'email' });

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    if (!signInResult?.ok || signInResult.error) {
      setLoading(false);
      setError(t('genericError'));
      return;
    }
    setLoading(false);
    const verifyParams = new URLSearchParams({ email });
    const nextPath = safeInternalPath(afterAuthTarget);
    if (nextPath && nextPath !== '/') {
      verifyParams.set('callbackUrl', nextPath);
    }
    router.push(`/verify-email?${verifyParams.toString()}`);
  }

  async function handleGoogle() {
    setError(null);
    if (!acceptTerms) {
      setError(t('termsRequired'));
      return;
    }
    setLoading(true);
    try {
      const popupCallbackUrl = getPathname({
        locale: activeLocale,
        href: '/auth/oauth-popup',
      });
      const result = await signInWithGooglePopup({
        popupCallbackUrl,
        fallbackCallbackUrl: afterAuthTarget,
        beforeRedirect: async () => {
          const persisted = await persistOAuthSignupContext({
            acceptTerms: true,
            marketingConsent,
            ...(website.trim() ? { website: website.trim() } : {}),
          });
          if (!persisted) {
            throw new Error('oauth-consent-failed');
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
    } catch {
      setLoading(false);
      setError(t('genericError'));
    }
  }

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 0, sm: 1 } }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="outlined"
        fullWidth
        startIcon={<GoogleIcon />}
        disabled={loading}
        onClick={withCtaTracking(
          () => void handleGoogle(),
          'sign_up_google',
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
            label={t('nameLabel')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            slotProps={{
              htmlInput: { dir: fieldDir, minLength: 2 },
              inputLabel: { shrink: true },
            }}
            sx={authFieldSx}
          />
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
            label={t('websiteLabel')}
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            required
            autoComplete="url"
            helperText={t('websiteHint')}
            slotProps={{
              htmlInput: { dir: fieldDir, inputMode: 'url' },
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
            slotProps={{
              htmlInput: { minLength: 8, dir: fieldDir },
              inputLabel: { shrink: true },
            }}
            autoComplete="new-password"
            sx={authFieldSx}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
            }
            label={termsLabel}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">{t('acceptMarketing')}</Typography>
            }
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !canSubmit}
            onClick={withCtaTracking(undefined, 'sign_up_submit', 'auth_modal')}
            sx={{ py: 1.25 }}
          >
            {t('submit')}
          </Button>
        </Stack>
      </Box>

      {onSwitchToSignIn ? (
        <Typography
          component="div"
          variant="body2"
          sx={{ textAlign: 'center' }}
        >
          {t('hasAccount')}{' '}
          <Button
            type="button"
            variant="text"
            onClick={withCtaTracking(
              onSwitchToSignIn,
              'sign_up_switch_to_sign_in',
              'auth_modal',
            )}
            sx={{
              fontWeight: 700,
              verticalAlign: 'baseline',
              p: 0,
              minWidth: 0,
            }}
          >
            {t('signInLink')}
          </Button>
        </Typography>
      ) : null}
    </Stack>
  );
}
