import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { AccountTabs } from '@/components/account/AccountTabs';
import { ContainerPageView } from '@/components/page/ContainerPageView';
import { requireAuth } from '@template/auth/server';
import { db, users } from '@template/db';

import { createLocalePageMetadata, type LocalePageProps } from '@/lib/page';

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  return createLocalePageMetadata({
    params,
    path: '/account',
    namespace: 'auth.account',
    titleKey: 'title',
    descriptionKey: 'subtitle',
    private: true,
  });
}

export default async function AccountPage() {
  const commonT = await getTranslations('auth');
  const session = await requireAuth({ callbackPath: '/account' });
  const user = session.user;
  if (!user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent('/account')}`);
  }

  let userRow:
    | {
        name: string;
        email: string;
        company: string | null;
        jobTitle: string | null;
        phone: string | null;
        address: string | null;
        website: string;
        locale: string;
        marketingConsent: boolean;
        updatedAt: Date;
      }
    | undefined;

  try {
    [userRow] = await db
      .select({
        name: users.name,
        email: users.email,
        company: users.company,
        jobTitle: users.jobTitle,
        phone: users.phone,
        address: users.address,
        website: users.website,
        locale: users.locale,
        marketingConsent: users.marketingConsent,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
  } catch (e) {
    if (
      process.env.NODE_ENV === 'development' &&
      e &&
      typeof e === 'object' &&
      'cause' in e
    ) {
      console.error(
        '[account] Drizzle query cause:',
        (e as { cause: unknown }).cause,
      );
    }
    throw e;
  }

  if (!userRow) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent('/account')}`);
  }

  return (
    <ContainerPageView layout="loose">
      <Suspense fallback={null}>
        <AccountTabs
          profile={{
            name: userRow.name,
            email: userRow.email,
            company: userRow.company,
            jobTitle: userRow.jobTitle,
            phone: userRow.phone,
            address: userRow.address,
            website: userRow.website,
            locale: userRow.locale,
            marketingConsent: userRow.marketingConsent,
          }}
          profileVersion={userRow.updatedAt.toISOString()}
          signOutLabel={commonT('signOut')}
        />
      </Suspense>
    </ContainerPageView>
  );
}
