import { Suspense } from 'react';

import { AuthRouteGate } from '@/components/auth/AuthRouteGate';

function SignUpSuspenseFallback() {
  return null;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpSuspenseFallback />}>
      <AuthRouteGate mode="sign-up" />
    </Suspense>
  );
}
