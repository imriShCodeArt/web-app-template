import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LocalePageView } from '@/components/page/LocalePageView';
import { PageHero } from '@/components/ui/PageHero';
import {
  PageHeroSubtitle,
  PageHeroTitle,
} from '@/components/ui/PageHeroTypography';
import { createLocalePageMetadata, type LocalePageProps } from '@/lib/page';
import { buildSiteGraphJsonLd } from '@/lib/seo/json-ld';
import { resolvePageLocale } from '@/lib/seo/resolve-locale';

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = resolvePageLocale((await params).locale);
  const siteT = await getTranslations({ locale, namespace: 'site' });
  const keywords = siteT('keywords')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return createLocalePageMetadata({
    params,
    path: '/',
    namespace: 'pages.home',
    keywords,
  });
}

export default async function Home({ params }: LocalePageProps) {
  const locale = resolvePageLocale((await params).locale);
  const pageT = await getTranslations({ locale, namespace: 'pages.home' });

  return (
    <LocalePageView
      jsonLd={buildSiteGraphJsonLd({
        locale,
        path: '/',
        name: pageT('metaTitle'),
        description: pageT('metaDescription'),
      })}
    >
      <PageHero variant="high">
        <PageHeroTitle heroVariant="high">{pageT('heading')}</PageHeroTitle>
        <PageHeroSubtitle>{pageT('intro')}</PageHeroSubtitle>
      </PageHero>
    </LocalePageView>
  );
}
