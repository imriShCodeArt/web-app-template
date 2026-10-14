'use client';

import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import { AccountSaveChangesButton } from '@/components/account/AccountSaveChangesButton';
import { AccountSignOutButton } from '@/components/shell/AccountSignOutButton';

type AccountFooterActionsProps = {
  activeTab: number;
  signOutLabel: string;
  settingsSaving: boolean;
  onSaveSettings: () => void;
};

export function AccountFooterActions({
  activeTab,
  signOutLabel,
  settingsSaving,
  onSaveSettings,
}: AccountFooterActionsProps) {
  const t = useTranslations('auth.account');

  if (activeTab === 0) return null;

  return (
    <>
      <Divider />
      {activeTab === 1 ? (
        <>
          <Typography variant="caption" color="text.secondary">
            {t('securityNote')}
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 1.5,
              rowGap: 1,
            }}
          >
            <AccountSaveChangesButton
              type="button"
              loading={settingsSaving}
              onClick={onSaveSettings}
            />
            <AccountSignOutButton label={signOutLabel} />
          </Stack>
        </>
      ) : (
        <AccountSignOutButton label={signOutLabel} />
      )}
    </>
  );
}
