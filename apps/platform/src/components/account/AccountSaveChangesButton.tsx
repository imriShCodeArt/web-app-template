'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';

type AccountSaveChangesButtonProps =
  | {
      type: 'submit';
      loading: boolean;
    }
  | {
      type?: 'button';
      loading: boolean;
      onClick: () => void;
    };

/**
 * Primary “Save changes” control for account profile and settings (same look as the profile form).
 */
export function AccountSaveChangesButton(props: AccountSaveChangesButtonProps) {
  const t = useTranslations('auth.account');
  if (props.type === 'submit') {
    return (
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={props.loading}
        trackCta={{ name: 'account_save_profile', location: 'account' }}
        sx={{ py: 1.25, alignSelf: 'flex-start' }}
      >
        {props.loading ? t('profile.saving') : t('profile.save')}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="contained"
      color="primary"
      disabled={props.loading}
      trackCta={{ name: 'account_save_settings', location: 'account' }}
      onClick={props.onClick}
      sx={{ py: 1.25, alignSelf: 'flex-start' }}
    >
      {props.loading ? t('profile.saving') : t('profile.save')}
    </Button>
  );
}
