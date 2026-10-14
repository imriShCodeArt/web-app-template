'use client';

import Alert from '@mui/material/Alert';
import { useTranslations } from 'next-intl';

import { isPendingWebsite } from '@template/config';

type AccountProfileAlertsProps = {
  success: boolean;
  error: string | null;
  website: string | null;
};

export function AccountProfileAlerts({
  success,
  error,
  website,
}: AccountProfileAlertsProps) {
  const t = useTranslations('auth.account');

  return (
    <>
      {success ? <Alert severity="success">{t('profile.saved')}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {website != null && isPendingWebsite(website) ? (
        <Alert severity="warning">{t('profile.pendingWebsiteHint')}</Alert>
      ) : null}
    </>
  );
}
