'use client';

import { Suspense, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { ContainerPageView } from '@/components/page/ContainerPageView';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { withCtaTracking } from '@/lib/tracking/withCtaTracking';
import { notifyGoogleOAuthPopupOpener } from '@template/auth/client';

function AuthErrorBody() {
  const t = useTranslations('auth.authError');
  const { openSignIn } = useAuthModal();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const error = errorParam ?? 'Default';

  useEffect(() => {
    notifyGoogleOAuthPopupOpener({
      ok: false,
      error: errorParam ?? 'Default',
    });
  }, [errorParam]);

  const messageKey =
    error === 'Configuration'
      ? 'configuration'
      : error === 'AccessDenied'
        ? 'accessDenied'
        : error === 'Verification'
          ? 'verification'
          : error === 'OAuthAccountNotLinked'
            ? 'oauthAccountNotLinked'
            : 'generic';

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
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
          {t('title')}
        </Typography>
        <Alert severity="error">{t(messageKey)}</Alert>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {t('codeLabel')}: {error}
        </Typography>
        <Button
          variant="contained"
          fullWidth
          sx={{ py: 1.25 }}
          onClick={withCtaTracking(
            () => openSignIn({ error: errorParam ?? undefined }),
            'auth_error_back_to_sign_in',
            'auth_error_page',
          )}
        >
          {t('backToSignIn')}
        </Button>
      </Stack>
    </Paper>
  );
}

export default function AuthErrorPage() {
  const t = useTranslations('auth.authError');

  return (
    <ContainerPageView layout="narrow">
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label={t('loading')} />
          </Box>
        }
      >
        <AuthErrorBody />
      </Suspense>
    </ContainerPageView>
  );
}
