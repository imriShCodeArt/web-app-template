import {
  ANALYTICS_PAGE_CONTEXT_WINDOW_KEY,
  getAnalyticsPageContext,
  hasPathDerivedAnalyticsTitle,
  type AnalyticsLocation,
  type AnalyticsPageFields,
} from '@/lib/tracking/sanitizeAnalyticsPath';

export { ANALYTICS_PAGE_CONTEXT_WINDOW_KEY };

/** App-owned SPA page hit. GTM should listen for this instead of History Change. */
export const ANALYTICS_PAGE_READY_EVENT = 'cw_analytics_page_ready';

/** Retry a pending flush after this delay. Never publishes the unchanged source title. */
export const TITLE_READY_FALLBACK_MS = 500;

declare global {
  interface Window {
    [ANALYTICS_PAGE_CONTEXT_WINDOW_KEY]?: AnalyticsPageFields;
  }
}

let lastPublished: AnalyticsPageFields | undefined;
/** Actual `document.title` from the last seed/publish, not the synthetic analytics title. */
let lastSourceDocumentTitle: string | undefined;
/** Raw `document.title` captured once when a destination navigation begins. */
let navigationSourceDocumentTitle: string | undefined;
/** Sanitized `page_location` for the in-flight destination navigation. */
let pendingDestinationPageLocation: string | undefined;
let historyHooksInstalled = false;
let titleObserver: MutationObserver | undefined;
let navigationGeneration = 0;
let readyTimer: ReturnType<typeof setTimeout> | undefined;

function persist(context: AnalyticsPageFields | undefined): void {
  lastPublished = context;
  if (typeof window === 'undefined') return;
  if (context) {
    window[ANALYTICS_PAGE_CONTEXT_WINDOW_KEY] = context;
  } else {
    delete window[ANALYTICS_PAGE_CONTEXT_WINDOW_KEY];
  }
}

function hydrateFromWindow(): void {
  if (lastPublished || typeof window === 'undefined') return;
  const stored = window[ANALYTICS_PAGE_CONTEXT_WINDOW_KEY];
  if (
    stored &&
    typeof stored.page_location === 'string' &&
    typeof stored.page_referrer === 'string' &&
    typeof stored.page_path === 'string' &&
    typeof stored.page_title === 'string'
  ) {
    lastPublished = stored;
  }
}

export function getCommittedAnalyticsPageContext():
  AnalyticsPageFields | undefined {
  hydrateFromWindow();
  return lastPublished;
}

function clearReadyTimer(): void {
  if (readyTimer === undefined) return;
  clearTimeout(readyTimer);
  readyTimer = undefined;
}

export function resetAnalyticsPageContextSession(): void {
  clearReadyTimer();
  titleObserver?.disconnect();
  titleObserver = undefined;
  navigationGeneration = 0;
  lastSourceDocumentTitle = undefined;
  navigationSourceDocumentTitle = undefined;
  pendingDestinationPageLocation = undefined;
  persist(undefined);
  historyHooksInstalled = false;
}

function rememberSourceDocumentTitle(title: string): void {
  lastSourceDocumentTitle = title;
}

function captureNavigationSourceTitle(): void {
  if (typeof document === 'undefined') return;
  navigationSourceDocumentTitle = document.title;
}

function clearPendingNavigation(): void {
  navigationSourceDocumentTitle = undefined;
  pendingDestinationPageLocation = undefined;
}

function sourceDocumentTitle(): string | undefined {
  return navigationSourceDocumentTitle ?? lastSourceDocumentTitle;
}

function buildNextContext(location: AnalyticsLocation): AnalyticsPageFields {
  hydrateFromWindow();
  const base = getAnalyticsPageContext({
    ...location,
    referrer: lastPublished ? undefined : location.referrer,
  });
  return {
    ...base,
    page_referrer: lastPublished
      ? lastPublished.page_location
      : base.page_referrer,
  };
}

function emitAnalyticsPageReady(context: AnalyticsPageFields): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: ANALYTICS_PAGE_READY_EVENT,
    page_path: context.page_path,
    page_location: context.page_location,
    page_title: context.page_title,
    page_referrer: context.page_referrer,
  });
  window.gtag?.('set', {
    page_path: context.page_path,
    page_location: context.page_location,
    page_title: context.page_title,
    page_referrer: context.page_referrer,
  });
}

/**
 * Seeds the last published page without emitting (bootstrap / test setup).
 */
export function seedAnalyticsPageContext(
  location: AnalyticsLocation,
): AnalyticsPageFields {
  const context = buildNextContext(location);
  persist(context);
  rememberSourceDocumentTitle(location.title ?? '');
  return context;
}

/**
 * Commits the initial document's sanitized context without emitting
 * `cw_analytics_page_ready`. Prefers the bootstrap window value when present.
 */
export function commitInitialAnalyticsPageContext():
  AnalyticsPageFields | undefined {
  hydrateFromWindow();
  if (lastPublished) {
    if (
      lastSourceDocumentTitle === undefined &&
      typeof document !== 'undefined'
    ) {
      rememberSourceDocumentTitle(document.title);
    }
    return lastPublished;
  }
  const location = locationFromWindow();
  if (!location) return undefined;
  return seedAnalyticsPageContext(location);
}

/**
 * Emits one `cw_analytics_page_ready` hit when the sanitized URL changed.
 * Callers must pass a location whose title is already the destination title.
 */
export function publishAnalyticsPageReady(
  location: AnalyticsLocation,
): AnalyticsPageFields | null {
  const next = buildNextContext(location);
  if (lastPublished?.page_location === next.page_location) {
    return null;
  }
  persist(next);
  rememberSourceDocumentTitle(location.title ?? '');
  clearPendingNavigation();
  clearReadyTimer();
  emitAnalyticsPageReady(next);
  return next;
}

export function locationFromWindow(): AnalyticsLocation | undefined {
  if (typeof window === 'undefined') return undefined;
  return {
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    title: typeof document !== 'undefined' ? document.title : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  };
}

function isDestinationTitleReady(
  location: AnalyticsLocation,
  next: AnalyticsPageFields,
): boolean {
  if (hasPathDerivedAnalyticsTitle(location.pathname)) return true;
  if (!next.page_title.trim() || !(location.title ?? '').trim()) return false;

  const source = sourceDocumentTitle();
  if (source === undefined) return false;
  return (location.title ?? '') !== source;
}

/**
 * Publishes at most one SPA page hit after the destination URL is current and
 * the analytics title is ready (path-derived, or the DOM title changed from
 * the source document.title captured for this navigation).
 */
export function tryFlushAnalyticsPageReady(): AnalyticsPageFields | null {
  const location = locationFromWindow();
  if (!location) return null;

  const next = buildNextContext(location);
  if (lastPublished?.page_location === next.page_location) {
    return null;
  }

  if (!isDestinationTitleReady(location, next)) {
    return null;
  }

  if (
    !next.page_title.trim() &&
    !hasPathDerivedAnalyticsTitle(location.pathname)
  ) {
    return null;
  }

  return publishAnalyticsPageReady(location);
}

function isTitleNode(node: Node | null): boolean {
  let current = node;
  while (current) {
    if (current.nodeName === 'TITLE') return true;
    current = current.parentNode;
  }
  return false;
}

function mutationTouchesTitle(mutation: MutationRecord): boolean {
  if (isTitleNode(mutation.target)) return true;
  return [...mutation.addedNodes, ...mutation.removedNodes].some((node) =>
    isTitleNode(node),
  );
}

function ensureTitleObserver(): void {
  if (
    typeof MutationObserver === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return;
  }
  if (titleObserver) return;

  const target = document.head ?? document.documentElement;
  if (!target) return;

  titleObserver = new MutationObserver((mutations) => {
    if (!mutations.some(mutationTouchesTitle)) return;
    tryFlushAnalyticsPageReady();
  });
  titleObserver.observe(target, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}

/**
 * Tries to emit immediately. If the destination title is still the source
 * title, waits for a `<title>` mutation. A later retry does not publish the
 * unchanged source title.
 */
export function scheduleAnalyticsPageReady(): void {
  ensureTitleObserver();

  const location = locationFromWindow();
  if (!location) return;

  const next = buildNextContext(location);
  if (lastPublished?.page_location === next.page_location) {
    return;
  }

  const isSamePendingDestination =
    pendingDestinationPageLocation === next.page_location;

  if (!isSamePendingDestination) {
    pendingDestinationPageLocation = next.page_location;
    captureNavigationSourceTitle();
    navigationGeneration += 1;
    clearReadyTimer();
  }

  const generation = navigationGeneration;

  if (tryFlushAnalyticsPageReady()) {
    return;
  }

  if (readyTimer !== undefined) {
    return;
  }

  readyTimer = setTimeout(() => {
    readyTimer = undefined;
    if (generation !== navigationGeneration) return;
    tryFlushAnalyticsPageReady();
  }, TITLE_READY_FALLBACK_MS);
}

/**
 * Wraps history to detect SPA navigations. Does not publish here: the URL is
 * new but `document.title` is still the previous page.
 */
export function installAnalyticsHistoryHooks(): void {
  if (historyHooksInstalled || typeof window === 'undefined') return;
  historyHooksInstalled = true;
  commitInitialAnalyticsPageContext();
  ensureTitleObserver();

  const wrap = (method: 'pushState' | 'replaceState') => {
    const original = window.history[method].bind(window.history);
    window.history[method] = ((...args: Parameters<History['pushState']>) => {
      const result = original(...args);
      scheduleAnalyticsPageReady();
      return result;
    }) as History['pushState'];
  };

  wrap('pushState');
  wrap('replaceState');
  window.addEventListener(
    'popstate',
    () => {
      scheduleAnalyticsPageReady();
    },
    true,
  );
}

/** Next.js pathname/layout hook: URL is updated; title may still be catching up. */
export function onNextJsRouteChange(): void {
  scheduleAnalyticsPageReady();
}
