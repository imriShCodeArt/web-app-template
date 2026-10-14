'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { AccountUserMenu } from '@/components/shell/AccountUserMenu';

import { Button } from '@/components/ui/Button';

type AuthEntryButtonProps = {
  fullWidth?: boolean;
  /** Tighter sizing for app bar / mobile header. */
  compact?: boolean;
  /** e.g. close mobile drawer before navigating or opening auth modal */
  onMenuInteraction?: () => void;
};

export function AuthEntryButton({
  fullWidth = false,
  compact = false,
  onMenuInteraction,
}: AuthEntryButtonProps) {
  const t = useTranslations();
  const { status } = useSession();
  const { openSignIn } = useAuthModal();

  if (status === 'authenticated') {
    return (
      <AccountUserMenu
        fullWidth={fullWidth}
        compact={compact}
        onMenuInteraction={onMenuInteraction}
      />
    );
  }

  return (
    <Button
      variant={compact ? 'text' : 'outlined'}
      color="inherit"
      size={compact && !fullWidth ? 'small' : 'medium'}
      fullWidth={fullWidth}
      trackCta={{ name: 'sign_in', location: 'header_auth' }}
      onClick={() => {
        onMenuInteraction?.();
        openSignIn();
      }}
      sx={
        compact && !fullWidth
          ? {
              flexShrink: 0,
              px: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
            }
          : undefined
      }
    >
      {t('auth.signIn.submit')}
    </Button>
  );
}
