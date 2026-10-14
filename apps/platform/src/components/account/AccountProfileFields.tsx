'use client';

import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { useTranslations } from 'next-intl';

import { authFieldSx } from '@/components/auth/authFieldSx';
import { WebsiteUrlField } from '@/components/ui/WebsiteUrlField';
import { localeLabels, locales, type Locale } from '@template/i18n';

type AccountProfileFieldsProps = {
  values: {
    name: string;
    company: string;
    jobTitle: string;
    phone: string;
    address: string;
    website: string;
    locale: Locale;
  };
  errors: {
    nameError: string | null;
    websiteError: string | null;
  };
  saving: boolean;
  onNameChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onLocaleChange: (value: Locale) => void;
  onNameErrorClear: () => void;
  onWebsiteErrorClear: () => void;
};

export function AccountProfileFields({
  values,
  errors,
  saving,
  onNameChange,
  onCompanyChange,
  onJobTitleChange,
  onPhoneChange,
  onAddressChange,
  onWebsiteChange,
  onLocaleChange,
  onNameErrorClear,
  onWebsiteErrorClear,
}: AccountProfileFieldsProps) {
  const t = useTranslations('auth.account');

  return (
    <Grid container spacing={2.25} columns={12}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('name')}
          name="name"
          value={values.name}
          required
          error={Boolean(errors.nameError)}
          helperText={errors.nameError ?? undefined}
          onChange={(e) => {
            onNameChange(e.target.value);
            onNameErrorClear();
          }}
          autoComplete="name"
          fullWidth
          disabled={saving}
          sx={authFieldSx}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { maxLength: 200 },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('profile.company')}
          name="company"
          value={values.company}
          onChange={(e) => onCompanyChange(e.target.value)}
          autoComplete="organization"
          fullWidth
          disabled={saving}
          sx={authFieldSx}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { maxLength: 200 },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('profile.jobTitle')}
          name="jobTitle"
          value={values.jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          autoComplete="organization-title"
          fullWidth
          disabled={saving}
          sx={authFieldSx}
          helperText={t('profile.jobTitleHint')}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { maxLength: 120 },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <WebsiteUrlField
          label={t('profile.website')}
          name="website"
          value={values.website}
          required
          error={Boolean(errors.websiteError)}
          helperText={errors.websiteError ?? t('profile.websiteHint')}
          onChange={(host) => {
            onWebsiteChange(host);
            onWebsiteErrorClear();
          }}
          disabled={saving}
          placeholder={t('profile.websiteHostPlaceholder')}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth disabled={saving}>
          <InputLabel id="account-locale-label">
            {t('profile.localeLabel')}
          </InputLabel>
          <Select<Locale>
            labelId="account-locale-label"
            label={t('profile.localeLabel')}
            value={values.locale}
            onChange={(e) => onLocaleChange(e.target.value as Locale)}
          >
            {locales.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {localeLabels[loc]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label={t('profile.phone')}
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          autoComplete="tel"
          fullWidth
          disabled={saving}
          sx={authFieldSx}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { maxLength: 40 },
          }}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextField
          label={t('profile.address')}
          name="address"
          value={values.address}
          onChange={(e) => onAddressChange(e.target.value)}
          autoComplete="street-address"
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          disabled={saving}
          sx={authFieldSx}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { maxLength: 500 },
          }}
        />
      </Grid>
    </Grid>
  );
}
