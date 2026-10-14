'use client';

import { signOutAndClearUserId } from '@/lib/auth/signOutAndClearUserId';

import { Button } from '@/components/ui/Button';

type AccountSignOutButtonProps = {
  label: string;
};

export function AccountSignOutButton({ label }: AccountSignOutButtonProps) {
  return (
    <Button
      type="button"
      variant="outlined"
      color="inherit"
      trackCta={{ name: 'sign_out', location: 'account' }}
      onClick={() => void signOutAndClearUserId({ callbackUrl: '/' })}
    >
      {label}
    </Button>
  );
}
