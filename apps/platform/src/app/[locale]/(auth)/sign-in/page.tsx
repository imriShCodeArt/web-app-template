import { Suspense } from 'react';

import { AuthRouteGate } from '@/components/auth/AuthRouteGate';

function SignInSuspenseFallback() {
  return null;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInSuspenseFallback />}>
      <AuthRouteGate mode="sign-in" />
    </Suspense>
  );
}
