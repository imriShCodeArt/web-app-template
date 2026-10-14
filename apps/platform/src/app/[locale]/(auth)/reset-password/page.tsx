import type { Metadata } from 'next';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { ContainerPageView } from '@/components/page/ContainerPageView';
import {
  createLocalePageMetadata,
  type LocaleSearchPageProps,
} from '@/lib/page';

type SearchParams = { token?: string };

export async function generateMetadata({
  params,
}: LocaleSearchPageProps<SearchParams>): Promise<Metadata> {
  return createLocalePageMetadata({
    params,
    path: '/reset-password',
    namespace: 'auth.resetPassword',
    private: true,
  });
}

export default async function ResetPasswordPage({
  searchParams,
}: LocaleSearchPageProps<SearchParams>) {
  const { token } = await searchParams;

  return (
    <ContainerPageView layout="narrow">
      <ResetPasswordForm token={token} />
    </ContainerPageView>
  );
}
