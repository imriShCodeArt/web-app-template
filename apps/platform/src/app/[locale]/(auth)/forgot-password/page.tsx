import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ContainerPageView } from '@/components/page/ContainerPageView';
import { createLocalePageMetadata, type LocalePageProps } from '@/lib/page';

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  return createLocalePageMetadata({
    params,
    path: '/forgot-password',
    namespace: 'auth.forgotPassword',
    private: true,
  });
}

export default function ForgotPasswordPage() {
  return (
    <ContainerPageView layout="narrow">
      <ForgotPasswordForm />
    </ContainerPageView>
  );
}
