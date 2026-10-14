'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import type { AccountProfilePayload } from '@/components/account/accountTypes';
import { getFirstNameOrLocalPart } from '@template/auth';
function getUserInitial(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const value = name?.trim() || email?.trim();
  return value?.charAt(0).toUpperCase() || 'U';
}

type AccountHeaderProps = {
  profile: AccountProfilePayload;
};

export function AccountHeader({ profile }: AccountHeaderProps) {
  const t = useTranslations('auth.account');
  const tAuth = useTranslations('auth');
  const welcomeFirst = getFirstNameOrLocalPart(profile.name, profile.email);
  const welcomeLine = welcomeFirst
    ? tAuth('welcomeNamed', { name: welcomeFirst })
    : tAuth('welcome');

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ width: 56, height: 56 }}>
        {getUserInitial(profile.name, profile.email)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, lineHeight: 1.35 }}
        >
          {welcomeLine}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('subtitle')}
        </Typography>
      </Box>
    </Stack>
  );
}
