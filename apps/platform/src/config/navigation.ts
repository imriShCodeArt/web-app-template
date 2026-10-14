export type NavItem = {
  titleKey: string;
  href: string;
  /** Header mainNav uses true; footer and other shells default to false. */
  prefetch?: boolean;
  external?: boolean;
  disabled?: boolean;
  /** Nested links shown in a submenu. */
  children?: NavItem[];
};

export type FooterNavGroup = {
  titleKey: string;
  items: NavItem[];
};

const navPrefetchOn = { prefetch: true as const };
const navPrefetchOff = { prefetch: false as const };

/** Primary header navigation (desktop bar + mobile drawer). */
export const mainNav: NavItem[] = [
  {
    titleKey: 'navigation.home',
    href: '/',
    ...navPrefetchOn,
  },
  {
    titleKey: 'navigation.about',
    href: '/about',
    ...navPrefetchOn,
  },
  {
    titleKey: 'navigation.contact',
    href: '/contact',
    ...navPrefetchOn,
  },
];

export const footerNav: FooterNavGroup[] = [
  {
    titleKey: 'footer.company',
    items: [
      {
        titleKey: 'navigation.home',
        href: '/',
        ...navPrefetchOff,
      },
      {
        titleKey: 'navigation.about',
        href: '/about',
        ...navPrefetchOff,
      },
      {
        titleKey: 'navigation.contact',
        href: '/contact',
        ...navPrefetchOff,
      },
    ],
  },
  {
    titleKey: 'footer.legal',
    items: [
      {
        titleKey: 'navigation.privacy',
        href: '/privacy',
        ...navPrefetchOff,
      },
      {
        titleKey: 'navigation.cookies',
        href: '/cookies',
        ...navPrefetchOff,
      },
      {
        titleKey: 'navigation.terms',
        href: '/terms',
        ...navPrefetchOff,
      },
      {
        titleKey: 'navigation.accessibility',
        href: '/accessibility',
        ...navPrefetchOff,
      },
    ],
  },
];
