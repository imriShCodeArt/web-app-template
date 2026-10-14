/** UUID path or query segment (scan IDs, share tokens, nested callback URLs). */
export const ANALYTICS_UUID_SEGMENT_PATTERN =
  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

/** Query keys that must never reach GA4 (`page_location` / `page_referrer`). */
export const ANALYTICS_SENSITIVE_QUERY_KEYS = [
  'email',
  'token',
  'callbackUrl',
  'scanUrl',
  'code',
  'state',
  'verification_code',
  'reset_token',
  'secret',
  'otp',
  'q',
] as const;

/** Analytics-only titles so scan IDs and scanned URLs never enter `page_title`. */
export const ANALYTICS_AUDIT_PAGE_TITLE = 'Audit';
export const ANALYTICS_SHARE_PAGE_TITLE = 'Shared audit';

/** Last sanitized page context, shared between the GTM bootstrap and SPA session. */
export const ANALYTICS_PAGE_CONTEXT_WINDOW_KEY = '__cwAnalyticsPageContext';

const EMAIL_VALUE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUDIT_ID_PATH_PATTERN = /(?:^|\/)audit\/:id(?:\/|$)/;
const SHARE_ID_PATH_PATTERN = /(?:^|\/)share\/:id(?:\/|$)/;
const MAX_NESTED_URL_DEPTH = 3;

export type AnalyticsLocation = {
  origin: string;
  pathname: string;
  search?: string;
  /** Ignored. Hash fragments are never sent to GA4. */
  hash?: string;
  title?: string;
  referrer?: string;
};

export type AnalyticsPageFields = {
  page_path: string;
  page_location: string;
  page_title: string;
  page_referrer: string;
};

function uuidMaskRegex(): RegExp {
  return new RegExp(ANALYTICS_UUID_SEGMENT_PATTERN, 'gi');
}

function maskAnalyticsUuids(value: string): string {
  return value.replace(uuidMaskRegex(), ':id');
}

function stripEmailsInText(value: string): string {
  return value
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sensitiveQueryKeySet(): Set<string> {
  return new Set(
    ANALYTICS_SENSITIVE_QUERY_KEYS.map((key) => key.toLowerCase()),
  );
}

/**
 * Replace every UUID with `:id`. Locale prefixes stay (`/en/audit/:id`).
 */
export function sanitizeAnalyticsPath(pathname: string): string {
  return maskAnalyticsUuids(pathname);
}

function sanitizeQueryValue(value: string, depth: number): string {
  if (depth > MAX_NESTED_URL_DEPTH) return maskAnalyticsUuids(value);

  try {
    if (/^https?:\/\//i.test(value)) {
      return sanitizeAnalyticsHref(value, depth);
    }
    if (value.startsWith('/')) {
      const nested = new URL(value, 'https://sanitize.invalid');
      const path = sanitizeAnalyticsPath(nested.pathname);
      const search = sanitizeAnalyticsSearch(nested.search, depth);
      return `${path}${search}`;
    }
  } catch {
    // Fall through to UUID masking.
  }

  return maskAnalyticsUuids(value);
}

/**
 * Drop auth/PII query keys, email-shaped values, and UUIDs (including nested
 * callback URLs). Keeps campaign params such as `utm_source=email`.
 */
export function sanitizeAnalyticsSearch(search: string, depth = 0): string {
  if (!search) return '';
  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (!raw) return '';

  const drop = sensitiveQueryKeySet();
  const next = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(raw).entries()) {
    if (drop.has(key.toLowerCase())) continue;
    if (EMAIL_VALUE_PATTERN.test(value)) continue;
    next.append(key, sanitizeQueryValue(value, depth + 1));
  }

  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

/** Sanitize an absolute or relative URL for `page_location` / `page_referrer`. */
export function sanitizeAnalyticsHref(href: string, depth = 0): string {
  const trimmed = href.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const page_path = sanitizeAnalyticsPath(url.pathname);
    const search = sanitizeAnalyticsSearch(url.search, depth);
    return `${url.origin}${page_path}${search}`;
  } catch {
    return stripEmailsInText(maskAnalyticsUuids(trimmed.split('#')[0] ?? ''));
  }
}

export function sanitizeAnalyticsTitle(
  pathname: string,
  documentTitle: string,
): string {
  const page_path = sanitizeAnalyticsPath(pathname);
  if (AUDIT_ID_PATH_PATTERN.test(page_path)) return ANALYTICS_AUDIT_PAGE_TITLE;
  if (SHARE_ID_PATH_PATTERN.test(page_path)) return ANALYTICS_SHARE_PAGE_TITLE;
  return stripEmailsInText(maskAnalyticsUuids(documentTitle));
}

/** True when analytics title is derived from the path, not `document.title`. */
export function hasPathDerivedAnalyticsTitle(pathname: string): boolean {
  const page_path = sanitizeAnalyticsPath(pathname);
  return (
    AUDIT_ID_PATH_PATTERN.test(page_path) ||
    SHARE_ID_PATH_PATTERN.test(page_path)
  );
}

export function getAnalyticsPageContextFromWindow():
  AnalyticsPageFields | undefined {
  if (typeof window === 'undefined') return undefined;
  const title = typeof document !== 'undefined' ? document.title : '';
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  return getAnalyticsPageContext({
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    title,
    referrer,
  });
}

export function getAnalyticsPageContext(
  location: AnalyticsLocation,
): AnalyticsPageFields {
  const page_path = sanitizeAnalyticsPath(location.pathname);
  const search = sanitizeAnalyticsSearch(location.search ?? '');
  return {
    page_path,
    page_location: `${location.origin}${page_path}${search}`,
    page_title: sanitizeAnalyticsTitle(location.pathname, location.title ?? ''),
    page_referrer: location.referrer
      ? sanitizeAnalyticsHref(location.referrer)
      : '',
  };
}

/** True only for a `users.id` UUID. Rejects email and other PII-shaped values. */
export function isAnalyticsUserId(value: unknown): value is string {
  if (typeof value !== 'string' || value.length !== 36) return false;
  return new RegExp(`^${ANALYTICS_UUID_SEGMENT_PATTERN}$`).test(value);
}

/**
 * Runs before GTM so the Google tag picks up sanitized `page_path`,
 * `page_location`, `page_title`, and `page_referrer`.
 * Keep in sync with `getAnalyticsPageContext`.
 * Pass a validated `users.id` UUID so the first GA4 hit can include User-ID.
 */
export function buildAnalyticsContextBootstrapScript(userId?: string): string {
  const userIdScript = isAnalyticsUserId(userId)
    ? `window.dataLayer.push({user_id:'${userId}'});window.gtag('set',{user_id:'${userId}'});`
    : '';
  const keysJson = JSON.stringify([...ANALYTICS_SENSITIVE_QUERY_KEYS]);
  const auditTitle = JSON.stringify(ANALYTICS_AUDIT_PAGE_TITLE);
  const shareTitle = JSON.stringify(ANALYTICS_SHARE_PAGE_TITLE);

  return `(function(){var UUID=/${ANALYTICS_UUID_SEGMENT_PATTERN}/gi;var DROP=new Set(${keysJson}.map(function(k){return k.toLowerCase();}));function mask(s){return String(s).replace(UUID,':id');}function isEmail(s){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(s);}function dropQs(qs,depth){if(!qs)return '';var raw=qs.charAt(0)==='?'?qs.slice(1):qs;if(!raw)return '';var n=new URLSearchParams();new URLSearchParams(raw).forEach(function(v,k){if(DROP.has(String(k).toLowerCase()))return;if(isEmail(v))return;n.append(k,sanitizeVal(v,(depth||0)+1));});var s=n.toString();return s?'?'+s:'';}function sanitizeVal(v,depth){if(depth>3)return mask(v);try{if(/^https?:\\/\\//i.test(v))return sanitizeHref(v,depth);if(v.charAt(0)==='/'){var u=new URL(v,'https://sanitize.invalid');return mask(u.pathname)+dropQs(u.search,depth);}}catch(e){}return mask(v);}function sanitizeHref(href,depth){try{var u=new URL(href);return u.origin+mask(u.pathname)+dropQs(u.search,depth||0);}catch(e){return mask(String(href).split('#')[0]||'');}}var p=mask(location.pathname);var loc=location.origin+p+dropQs(location.search,0);var title=mask(document.title||'').replace(/[^\\s@]+@[^\\s@]+\\.[^\\s@]+/g,'').replace(/\\s+/g,' ').trim();if(/(?:^|\\/)audit\\/:id(?:\\/|$)/.test(p))title=${auditTitle};else if(/(?:^|\\/)share\\/:id(?:\\/|$)/.test(p))title=${shareTitle};var ref=document.referrer?sanitizeHref(document.referrer,0):'';var ctx={page_path:p,page_location:loc,page_title:title,page_referrer:ref};window.dataLayer=window.dataLayer||[];window.dataLayer.push(ctx);window.${ANALYTICS_PAGE_CONTEXT_WINDOW_KEY}=ctx;window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};window.gtag('set',ctx);${userIdScript}})();`;
}
