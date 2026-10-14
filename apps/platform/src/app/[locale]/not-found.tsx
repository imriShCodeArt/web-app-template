import type { Metadata } from 'next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { AppProviders } from '@/components/providers/AppProviders';
import { defaultLocale, isLocale, type Locale } from '@template/i18n';
import { auth } from '@template/auth/server';
import { createPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return createPageMetadata({
    locale,
    path: '/404',
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: { index: false, follow: false },
  });
}

export default async function LocaleNotFound() {
  const rawLocale = await getLocale();
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <AppProviders locale={locale} messages={messages} initialSession={session}>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
        }}
      >
        <Stack
          spacing={2}
          sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto' }}
        >
          <Typography variant="h3" component="h1">
            404
          </Typography>
          <Typography variant="h6" component="p">
            {t('title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('description')}
          </Typography>
          <Typography variant="body1">
            <Link href="/" prefetch={false}>
              {t('backHome')}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AppProviders>
  );
}
