import type { Locale } from '@template/i18n';
import {
  getLocalizedUrl,
  getSchemaSiteRootUrl,
  siteConfig,
} from '@template/config';

export type BreadcrumbItem = {
  name: string;
  path: string;
};

const SCHEMA_LANGUAGE: Record<Locale, string> = {
  he: 'he-IL',
  en: 'en',
};

function toSchemaLanguage(locale: Locale) {
  return SCHEMA_LANGUAGE[locale];
}

function getSchemaEntityId(fragment: string) {
  const base = siteConfig.url.replace(/\/$/, '');
  return `${base}/${fragment}`;
}

function buildOrganizationNode() {
  const orgId = getSchemaEntityId('#organization');
  const phone = siteConfig.contact.phone.replace(/^0/, '+972-');

  return {
    '@type': 'Organization',
    '@id': orgId,
    name: siteConfig.shortName,
    url: getSchemaSiteRootUrl(),
    description: siteConfig.ogImage.alt,
    email: siteConfig.contact.email,
    telephone: phone,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: phone,
      email: siteConfig.contact.email,
      availableLanguage: ['Hebrew', 'English'],
    },
  };
}

function buildWebSiteNode(locale: Locale) {
  return {
    '@type': 'WebSite',
    '@id': getSchemaEntityId('#website'),
    name: siteConfig.shortName,
    url: getSchemaSiteRootUrl(),
    inLanguage: toSchemaLanguage(locale),
    publisher: {
      '@id': getSchemaEntityId('#organization'),
    },
  };
}

function buildWebPageNode({
  locale,
  path,
  name,
  description,
}: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
}) {
  const url = getLocalizedUrl(locale, path);
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: toSchemaLanguage(locale),
    isPartOf: {
      '@id': getSchemaEntityId('#website'),
    },
    about: {
      '@id': getSchemaEntityId('#organization'),
    },
  };
}

function buildServiceNode({
  name,
  serviceType,
  description,
  locale,
}: {
  name: string;
  serviceType: string;
  description?: string;
  locale?: Locale;
}) {
  return {
    '@type': 'Service',
    '@id': getSchemaEntityId('#service'),
    name,
    serviceType,
    ...(description ? { description } : {}),
    provider: {
      '@id': getSchemaEntityId('#organization'),
    },
    ...(locale ? { url: getLocalizedUrl(locale, '/') } : {}),
  };
}

function buildFaqNode({
  items,
  locale,
  path,
}: {
  items: Array<{ question: string; answer: string }>;
  locale: Locale;
  path: string;
}) {
  const url = getLocalizedUrl(locale, path);

  return {
    '@type': 'FAQPage',
    '@id': `${url}#faqpage`,
    url,
    inLanguage: toSchemaLanguage(locale),
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

/**
 * Builds a single `@graph` block for the homepage: Organization, WebSite,
 * WebPage, Service, and FAQPage in one script tag.
 */
export function buildSiteGraphJsonLd({
  locale,
  path,
  name,
  description,
  faqItems,
  service,
}: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  faqItems?: Array<{ question: string; answer: string }>;
  service?: {
    name: string;
    serviceType: string;
    description?: string;
  };
}) {
  const graph = [
    buildOrganizationNode(),
    buildWebSiteNode(locale),
    buildWebPageNode({ locale, path, name, description }),
    ...(service
      ? [
          buildServiceNode({
            name: service.name,
            serviceType: service.serviceType,
            description: service.description,
            locale,
          }),
        ]
      : []),
    ...(faqItems?.length
      ? [buildFaqNode({ items: faqItems, locale, path })]
      : []),
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/** Standalone Organization schema for pages that need it independently. */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    ...buildOrganizationNode(),
  };
}

/** Standalone WebSite schema, for use outside of a `@graph` context. */
export function buildWebSiteJsonLd(locale: Locale) {
  return { '@context': 'https://schema.org', ...buildWebSiteNode(locale) };
}

/** Standalone WebPage schema, for use outside of a `@graph` context. */
export function buildWebPageJsonLd(args: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
}) {
  return { '@context': 'https://schema.org', ...buildWebPageNode(args) };
}

export function buildBreadcrumbJsonLd(locale: Locale, items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getLocalizedUrl(locale, item.path),
    })),
  };
}

export function buildFaqJsonLd({
  items,
  locale,
  path,
}: {
  items: Array<{ question: string; answer: string }>;
  locale: Locale;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    ...buildFaqNode({ items, locale, path }),
  };
}
