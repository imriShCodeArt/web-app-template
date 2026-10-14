'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

import { useRouter } from '@/i18n/routing';

import { useAuthModal } from './AuthModalProvider';

export function AuthRouteGate({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openSignIn, openSignUp } = useAuthModal();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const callbackUrl = searchParams.get('callbackUrl') ?? undefined;
    const error = searchParams.get('error') ?? undefined;

    if (mode === 'sign-in') {
      openSignIn({ callbackUrl, error });
    } else {
      openSignUp({ callbackUrl });
    }

    router.replace('/');
  }, [mode, openSignIn, openSignUp, router, searchParams]);

  return null;
}
