import { siteConfig } from '@template/config';

type ClassValue = string | number | false | null | undefined;

/**
 * Small className helper.
 *
 * Example:
 * cn('base-class', isActive && 'active-class')
 */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates an absolute URL from a relative path.
 *
 * Example:
 * absoluteUrl('/about') => 'https://example.com/about'
 */
export function absoluteUrl(path = '/') {
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

export function isExternalUrl(href: string) {
  return href.startsWith('http://') || href.startsWith('https://');
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
