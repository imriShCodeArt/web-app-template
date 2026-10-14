import type { ReactNode } from 'react';

import { JsonLd } from '@/components/seo/JsonLd';

type JsonLdPayload = Record<string, unknown> | Record<string, unknown>[];

type LocalePageViewProps = {
  /** Structured data for the page. Omit when not needed. */
  jsonLd?: JsonLdPayload | null;
  children: ReactNode;
};

/**
 * Standard shell for public `[locale]` pages: optional JSON-LD, then page body.
 * Keep route files thin — put UI in `src/components/<feature>/`.
 */
export function LocalePageView({ jsonLd, children }: LocalePageViewProps) {
  return (
    <>
      {jsonLd != null ? <JsonLd data={jsonLd} /> : null}
      {children}
    </>
  );
}
