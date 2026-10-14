import { Suspense } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { redirect } from 'next/navigation';

import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { ContainerPageView } from '@/components/page/ContainerPageView';
import { safeInternalPath } from '@/lib/auth/safeInternalPath';
import { auth } from '@template/auth/server';
import { userIdRequiresEmailVerification } from '@template/auth';

import type { LocaleSearchPageProps } from '@/lib/page';

type SearchParams = { email?: string; callbackUrl?: string };

async function VerifyEmailContent({
  email,
  callbackUrl,
}: {
  email: string | undefined;
  callbackUrl: string | null;
}) {
  const session = await auth();
  const afterVerify = callbackUrl ?? '/';

  if (session?.user?.id) {
    if (session.user.emailVerified) {
      redirect(afterVerify);
    }
    const needsVerification = await userIdRequiresEmailVerification(
      session.user.id,
    );
    if (!needsVerification) {
      redirect(afterVerify);
    }
  }

  return (
    <VerifyEmailForm email={email} callbackUrl={callbackUrl ?? undefined} />
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: LocaleSearchPageProps<SearchParams>) {
  const { email, callbackUrl: rawCallback } = await searchParams;

  return (
    <ContainerPageView layout="narrow">
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        }
      >
        <VerifyEmailContent
          email={email}
          callbackUrl={safeInternalPath(rawCallback)}
        />
      </Suspense>
    </ContainerPageView>
  );
}
