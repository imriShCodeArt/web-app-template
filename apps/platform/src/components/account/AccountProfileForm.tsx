'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import { AccountProfileAlerts } from '@/components/account/AccountProfileAlerts';
import { AccountProfileFields } from '@/components/account/AccountProfileFields';
import { AccountSaveChangesButton } from '@/components/account/AccountSaveChangesButton';
import type { AccountProfilePayload } from '@/components/account/accountTypes';
import { useAccountProfileForm } from '@/components/account/useAccountProfileForm';
import { authFieldSx } from '@/components/auth/authFieldSx';
import { AccountSignOutButton } from '@/components/shell/AccountSignOutButton';

export type { AccountProfilePayload } from '@/components/account/accountTypes';

type AccountProfileFormProps = {
  profile: AccountProfilePayload;
  signOutLabel: string;
  marketingConsent: boolean;
};

export function AccountProfileForm({
  profile,
  signOutLabel,
  marketingConsent,
}: AccountProfileFormProps) {
  const t = useTranslations('auth.account');
  const { values, setters, errors, status, onSubmit } = useAccountProfileForm({
    profile,
    marketingConsent,
  });

  return (
    <Stack component="form" spacing={2.25} onSubmit={onSubmit} noValidate>
      <AccountProfileAlerts
        success={status.success}
        error={errors.error}
        website={profile.website}
      />

      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {t('signedInWith')}
        </Typography>
        <TextField
          label={t('email')}
          value={profile.email ?? ''}
          disabled
          fullWidth
          required
          sx={authFieldSx}
          helperText={t('profile.emailHint')}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <AccountProfileFields
        values={values}
        errors={{
          nameError: errors.nameError,
          websiteError: errors.websiteError,
        }}
        saving={status.saving}
        onNameChange={setters.setName}
        onCompanyChange={setters.setCompany}
        onJobTitleChange={setters.setJobTitle}
        onPhoneChange={setters.setPhone}
        onAddressChange={setters.setAddress}
        onWebsiteChange={setters.setWebsite}
        onLocaleChange={setters.setLocale}
        onNameErrorClear={() => setters.setNameError(null)}
        onWebsiteErrorClear={() => setters.setWebsiteError(null)}
      />

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
        <AccountSaveChangesButton type="submit" loading={status.saving} />
        <AccountSignOutButton label={signOutLabel} />
      </Stack>
    </Stack>
  );
}
