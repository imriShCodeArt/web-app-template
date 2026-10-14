/** Standard App Router page props for `[locale]` routes. */
export type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

/** `[locale]` routes that read query strings in the page component. */
export type LocaleSearchPageProps<
  TSearch extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >,
> = LocalePageProps & {
  searchParams: Promise<TSearch>;
};

/** Dynamic `[locale]/…/[id]` (or slug) routes. */
export type LocaleDynamicPageProps<TParam extends string = 'id'> =
  LocalePageProps & {
    params: Promise<{ locale: string } & Record<TParam, string>>;
  };
