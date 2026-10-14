'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslations } from 'next-intl';

import { AccountDangerZone } from '@/components/account/AccountDangerZone';

type AccountSettingsPanelProps = {
  marketingConsent: boolean;
  settingsSaveSuccess: boolean;
  settingsSaveError: string | null;
  onMarketingConsentChange: (value: boolean) => void;
  onDismissSuccess: () => void;
  onDismissError: () => void;
};

export function AccountSettingsPanel({
  marketingConsent,
  settingsSaveSuccess,
  settingsSaveError,
  onMarketingConsentChange,
  onDismissSuccess,
  onDismissError,
}: AccountSettingsPanelProps) {
  const t = useTranslations('auth.account');

  return (
    <Stack spacing={2.25}>
      <Accordion
        defaultExpanded={false}
        elevation={0}
        variant="outlined"
        disableGutters
        sx={{
          borderRadius: 1,
          '&:before': { display: 'none' },
          bgcolor: 'action.hover',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon fontSize="small" sx={{ opacity: 0.7 }} />}
          sx={{ px: 1.5, minHeight: 44, py: 0.5 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            component="span"
            sx={{ letterSpacing: 0.2 }}
          >
            {t('settings.agreementsAccordion')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={marketingConsent}
                  onChange={(e) => onMarketingConsentChange(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  {t('profile.marketingOptIn')}
                </Typography>
              }
            />
            <Typography variant="caption" color="text.disabled">
              {t('settings.marketingSaveHint')}
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {settingsSaveSuccess ? (
        <Alert severity="success" onClose={onDismissSuccess}>
          {t('profile.saved')}
        </Alert>
      ) : null}
      {settingsSaveError ? (
        <Alert severity="error" onClose={onDismissError}>
          {settingsSaveError}
        </Alert>
      ) : null}

      <AccountDangerZone />
    </Stack>
  );
}
