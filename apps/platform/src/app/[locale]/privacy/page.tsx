import type { Metadata } from 'next';

import { LocalePageView } from '@/components/page/LocalePageView';
import { ContentDocument } from '@/components/shell/ContentDocument';
import { defineLocalePage, type LocalePageProps } from '@/lib/page';
import { sitemapLastModifiedByPath } from '@/config/sitemap-last-modified';

const page = defineLocalePage({
  path: '/privacy',
  namespace: 'pages.privacy',
  sitemapLastModified: sitemapLastModifiedByPath['/privacy'],
});

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  return page.generateMetadata({ params });
}

export default async function PrivacyPage({ params }: LocalePageProps) {
  const { locale, t, navT } = await page.getContext(params);

  return (
    <LocalePageView
      jsonLd={page.breadcrumbJsonLd(locale, navT('home'), [
        { name: t('heading'), path: '/privacy' },
      ])}
    >
      <ContentDocument
        heading={t('heading')}
        kicker={t('lastUpdated')}
        bodyKeys={['p1']}
        t={t}
      />
    </LocalePageView>
  );
}
