'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import { notifyGoogleOAuthPopupOpener } from '@template/auth/client';

export default function OAuthPopupPage() {
  const t = useTranslations('auth.oauthPopup');

  useEffect(() => {
    notifyGoogleOAuthPopupOpener({ ok: true });
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal + 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress aria-label={t('completing')} />
      <Typography variant="body2" color="text.secondary">
        {t('completing')}
      </Typography>
    </Box>
  );
}
