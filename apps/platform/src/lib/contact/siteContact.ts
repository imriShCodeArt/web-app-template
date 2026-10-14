import { siteConfig } from '@template/config';

const PUBLIC_SITE_HOSTNAMES = new Set(
  siteConfig.publicSiteUrls.map((u) => new URL(u).hostname),
);

export function isPublicSiteHostname(hostname: string): boolean {
  return PUBLIC_SITE_HOSTNAMES.has(hostname);
}

/** Builds a `tel:` href from a stored phone string (e.g. +972-50-000-0000). */
export function telHrefFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return 'tel:';
  }
  return `tel:+${digits}`;
}

/**
 * Israeli mobile display for numbers stored as +972-5X-XXX-XXXX.
 * Example: +972-50-000-0000 → 050-000-0000
 */
export function displayIsraelContactPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('972') && d.length === 12) {
    const local = d.slice(3);
    if (local.length === 9 && local.startsWith('5')) {
      return `0${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
    }
  }
  return phone;
}
