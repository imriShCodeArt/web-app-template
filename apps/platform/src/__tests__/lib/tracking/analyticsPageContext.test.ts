import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ANALYTICS_PAGE_READY_EVENT,
  TITLE_READY_FALLBACK_MS,
  installAnalyticsHistoryHooks,
  onNextJsRouteChange,
  publishAnalyticsPageReady,
  resetAnalyticsPageContextSession,
  scheduleAnalyticsPageReady,
  seedAnalyticsPageContext,
  tryFlushAnalyticsPageReady,
} from '@/lib/tracking/analyticsPageContext';
import { ANALYTICS_AUDIT_PAGE_TITLE } from '@/lib/tracking/sanitizeAnalyticsPath';

const ORIGIN = 'https://example.com';
const SCAN_ID = '143cc5d8-9da9-4cc2-9e35-69b00f365f64';

describe('SPA page_referrer session', () => {
  beforeEach(() => {
    resetAnalyticsPageContextSession();
  });

  afterEach(() => {
    resetAnalyticsPageContextSession();
  });

  it('Homepage → Contact → Homepage uses the previous sanitized page_location', () => {
    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
      referrer: 'https://www.google.com/',
    });

    const contact = publishAnalyticsPageReady({
      origin: ORIGIN,
      pathname: '/contact',
      title: 'Contact',
    });
    expect(contact).toEqual({
      page_path: '/contact',
      page_location: `${ORIGIN}/contact`,
      page_title: 'Contact',
      page_referrer: `${ORIGIN}/`,
    });

    const homeAgain = publishAnalyticsPageReady({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
    });
    expect(homeAgain).toEqual({
      page_path: '/',
      page_location: `${ORIGIN}/`,
      page_title: 'Web App',
      page_referrer: `${ORIGIN}/contact`,
    });
  });

  it('/audit/{uuid} → /contact uses a masked audit referrer and generic audit title', () => {
    const audit = publishAnalyticsPageReady({
      origin: ORIGIN,
      pathname: `/audit/${SCAN_ID}`,
      title: `Audit ${SCAN_ID} | Web App`,
      referrer: '',
    });
    expect(audit).toEqual({
      page_path: '/audit/:id',
      page_location: `${ORIGIN}/audit/:id`,
      page_title: ANALYTICS_AUDIT_PAGE_TITLE,
      page_referrer: '',
    });
    expect(JSON.stringify(audit)).not.toContain(SCAN_ID);

    const contact = publishAnalyticsPageReady({
      origin: ORIGIN,
      pathname: '/contact',
      title: 'Contact',
    });
    expect(contact).toEqual({
      page_path: '/contact',
      page_location: `${ORIGIN}/contact`,
      page_title: 'Contact',
      page_referrer: `${ORIGIN}/audit/:id`,
    });
    expect(JSON.stringify(contact)).not.toContain(SCAN_ID);
  });

  it('does not emit a second hit when the sanitized URL is unchanged', () => {
    publishAnalyticsPageReady({
      origin: ORIGIN,
      pathname: '/contact',
      title: 'Contact',
    });
    expect(
      publishAnalyticsPageReady({
        origin: ORIGIN,
        pathname: '/contact',
        title: 'Contact | Web App',
      }),
    ).toBeNull();
  });
});

describe('destination title readiness', () => {
  afterEach(() => {
    resetAnalyticsPageContextSession();
    vi.unstubAllGlobals();
  });

  function stubWindow(options: {
    pathname: string;
    title: string;
    dataLayer?: Array<Record<string, unknown>>;
  }) {
    const dataLayer = options.dataLayer ?? [];
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}${options.pathname}`,
      pathname: options.pathname,
      search: '',
      hash: '',
    };
    vi.stubGlobal('window', {
      location,
      dataLayer,
      history: {
        pushState() {},
        replaceState() {},
      },
      addEventListener() {},
    });
    vi.stubGlobal('document', {
      title: options.title,
      referrer: '',
      querySelector: () => null,
      head: null,
    });
    return { dataLayer, location };
  }

  it('waits until document.title matches the destination before emitting Contact', () => {
    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
      referrer: 'https://www.google.com/',
    });

    const { dataLayer } = stubWindow({
      pathname: '/contact',
      title: 'Web App',
    });

    expect(tryFlushAnalyticsPageReady()).toBeNull();
    expect(dataLayer).toEqual([]);

    vi.stubGlobal('document', {
      title: 'Contact',
      referrer: '',
      querySelector: () => null,
      head: null,
    });

    const ready = tryFlushAnalyticsPageReady();
    expect(ready).toEqual({
      page_path: '/contact',
      page_location: `${ORIGIN}/contact`,
      page_title: 'Contact',
      page_referrer: `${ORIGIN}/`,
    });
    expect(dataLayer).toEqual([
      {
        event: ANALYTICS_PAGE_READY_EVENT,
        page_path: '/contact',
        page_location: `${ORIGIN}/contact`,
        page_title: 'Contact',
        page_referrer: `${ORIGIN}/`,
      },
    ]);
    expect(tryFlushAnalyticsPageReady()).toBeNull();
  });

  it('does not emit an empty intermediate title while waiting for the destination', () => {
    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
    });

    const { dataLayer } = stubWindow({
      pathname: '/contact',
      title: '',
    });

    expect(tryFlushAnalyticsPageReady()).toBeNull();
    expect(dataLayer).toEqual([]);

    vi.stubGlobal('document', {
      title: 'Contact',
      referrer: '',
      querySelector: () => null,
      head: null,
    });

    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/contact',
      page_title: 'Contact',
    });
  });

  it('emits a generic audit title immediately even when document.title still has the UUID', () => {
    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
    });
    stubWindow({
      pathname: `/audit/${SCAN_ID}`,
      title: `Web App`,
    });

    const ready = tryFlushAnalyticsPageReady();
    expect(ready).toMatchObject({
      page_path: '/audit/:id',
      page_location: `${ORIGIN}/audit/:id`,
      page_title: ANALYTICS_AUDIT_PAGE_TITLE,
      page_referrer: `${ORIGIN}/`,
    });
    expect(JSON.stringify(ready)).not.toContain(SCAN_ID);
  });

  it('does not treat a synthetic Audit analytics title as the destination DOM title', () => {
    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
    });
    stubWindow({
      pathname: `/audit/${SCAN_ID}`,
      title: 'Web App',
    });
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_title: ANALYTICS_AUDIT_PAGE_TITLE,
    });

    const auditDocumentTitle = `Audit ${SCAN_ID} | Web App`;
    const { dataLayer } = stubWindow({
      pathname: '/contact',
      title: auditDocumentTitle,
    });

    scheduleAnalyticsPageReady();
    scheduleAnalyticsPageReady();
    expect(tryFlushAnalyticsPageReady()).toBeNull();
    expect(dataLayer).toEqual([]);

    vi.stubGlobal('document', {
      title: 'Contact',
      referrer: '',
      querySelector: () => null,
      head: null,
    });

    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/contact',
      page_title: 'Contact',
      page_referrer: `${ORIGIN}/audit/:id`,
    });
  });
});

describe('history wrappers wait for title then emit one ready event', () => {
  afterEach(() => {
    resetAnalyticsPageContextSession();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('pushState, replaceState, and popstate do not publish until the destination title is ready', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}/`,
      pathname: '/',
      search: '',
      hash: '',
    };
    const popListeners: Array<() => void> = [];
    let nativePushCalls = 0;
    let nativeReplaceCalls = 0;
    let documentTitle = 'Web App';

    const history = {
      pushState(_state: unknown, _title: string, url?: string) {
        nativePushCalls += 1;
        expect(
          dataLayer.filter((row) => row.event === ANALYTICS_PAGE_READY_EVENT),
        ).toEqual([]);
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
      replaceState(_state: unknown, _title: string, url?: string) {
        nativeReplaceCalls += 1;
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
    };

    const fakeWindow = {
      location,
      history,
      dataLayer,
      addEventListener(type: string, listener: () => void) {
        if (type === 'popstate') popListeners.push(listener);
      },
    };
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('document', {
      get title() {
        return documentTitle;
      },
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: null,
    });

    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
      referrer: 'https://www.google.com/',
    });

    installAnalyticsHistoryHooks();
    fakeWindow.history.pushState({}, '', '/contact');
    expect(nativePushCalls).toBe(1);
    expect(tryFlushAnalyticsPageReady()).toBeNull();

    documentTitle = 'Contact';
    const contact = tryFlushAnalyticsPageReady();
    expect(contact).toEqual({
      page_path: '/contact',
      page_location: `${ORIGIN}/contact`,
      page_title: 'Contact',
      page_referrer: `${ORIGIN}/`,
    });
    expect(dataLayer).toEqual([
      {
        event: ANALYTICS_PAGE_READY_EVENT,
        page_path: '/contact',
        page_location: `${ORIGIN}/contact`,
        page_title: 'Contact',
        page_referrer: `${ORIGIN}/`,
      },
    ]);

    fakeWindow.history.replaceState({}, '', '/about');
    expect(nativeReplaceCalls).toBe(1);
    expect(tryFlushAnalyticsPageReady()).toBeNull();
    documentTitle = 'About';
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/about',
      page_title: 'About',
      page_referrer: `${ORIGIN}/contact`,
    });

    location.href = `${ORIGIN}/`;
    location.pathname = '/';
    location.search = '';
    for (const listener of popListeners) listener();
    expect(tryFlushAnalyticsPageReady()).toBeNull();
    documentTitle = 'Web App';
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/',
      page_location: `${ORIGIN}/`,
      page_title: 'Web App',
      page_referrer: `${ORIGIN}/about`,
    });
  });

  it('does not publish the unchanged source title after the fallback delay', () => {
    vi.useFakeTimers();
    const dataLayer: Array<Record<string, unknown>> = [];
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}/`,
      pathname: '/',
      search: '',
      hash: '',
    };

    const history = {
      pushState(_state: unknown, _title: string, url?: string) {
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
      replaceState() {},
    };

    vi.stubGlobal('window', {
      location,
      history,
      dataLayer,
      addEventListener() {},
    });
    vi.stubGlobal('document', {
      title: 'Web App',
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: null,
    });

    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
      referrer: 'https://www.google.com/',
    });

    installAnalyticsHistoryHooks();
    window.history.pushState({}, '', '/about');
    expect(dataLayer).toEqual([]);

    vi.advanceTimersByTime(TITLE_READY_FALLBACK_MS);
    expect(dataLayer).toEqual([]);

    vi.stubGlobal('document', {
      title: 'About',
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: null,
    });
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/about',
      page_title: 'About',
      page_referrer: `${ORIGIN}/`,
    });
  });

  it('cancels a stale fallback when another navigation begins', () => {
    vi.useFakeTimers();
    const dataLayer: Array<Record<string, unknown>> = [];
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}/`,
      pathname: '/',
      search: '',
      hash: '',
    };

    const history = {
      pushState(_state: unknown, _title: string, url?: string) {
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
      replaceState() {},
    };

    vi.stubGlobal('window', {
      location,
      history,
      dataLayer,
      addEventListener() {},
    });
    vi.stubGlobal('document', {
      title: 'Web App',
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: null,
    });

    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
      referrer: 'https://www.google.com/',
    });

    installAnalyticsHistoryHooks();
    window.history.pushState({}, '', '/contact');
    vi.advanceTimersByTime(200);
    expect(dataLayer).toEqual([]);

    window.history.pushState({}, '', '/about');
    vi.advanceTimersByTime(TITLE_READY_FALLBACK_MS);
    expect(dataLayer).toEqual([]);

    vi.stubGlobal('document', {
      title: 'About',
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: null,
    });
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/about',
      page_title: 'About',
      page_referrer: `${ORIGIN}/`,
    });
    expect(dataLayer.filter((row) => row.page_path === '/contact')).toEqual([]);
  });

  it('emits when the title element mutates after pushState', () => {
    vi.useFakeTimers();
    const dataLayer: Array<Record<string, unknown>> = [];
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}/`,
      pathname: '/',
      search: '',
      hash: '',
    };
    let documentTitle = 'Web App';
    let observerCallback: MutationCallback | undefined;

    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          observerCallback = callback;
        }
        observe() {}
        disconnect() {}
      },
    );

    const history = {
      pushState(_state: unknown, _title: string, url?: string) {
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
      replaceState() {},
    };

    vi.stubGlobal('window', {
      location,
      history,
      dataLayer,
      addEventListener() {},
    });
    vi.stubGlobal('document', {
      get title() {
        return documentTitle;
      },
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: {},
      documentElement: {},
    });

    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: '/',
      title: 'Web App',
      referrer: 'https://www.google.com/',
    });

    installAnalyticsHistoryHooks();
    window.history.pushState({}, '', '/contact');
    expect(dataLayer).toEqual([]);
    expect(observerCallback).toEqual(expect.any(Function));

    documentTitle = 'Contact';
    observerCallback?.(
      [
        {
          target: { nodeName: 'META', parentNode: null },
          addedNodes: [],
          removedNodes: [],
        } as unknown as MutationRecord,
      ],
      {} as MutationObserver,
    );
    expect(dataLayer).toEqual([]);

    observerCallback?.(
      [
        {
          target: { nodeName: 'TITLE', parentNode: null },
          addedNodes: [],
          removedNodes: [],
        } as unknown as MutationRecord,
      ],
      {} as MutationObserver,
    );
    expect(dataLayer).toEqual([
      {
        event: ANALYTICS_PAGE_READY_EVENT,
        page_path: '/contact',
        page_location: `${ORIGIN}/contact`,
        page_title: 'Contact',
        page_referrer: `${ORIGIN}/`,
      },
    ]);

    vi.advanceTimersByTime(TITLE_READY_FALLBACK_MS);
    expect(dataLayer).toHaveLength(1);
  });

  it('Audit → Contact does not publish the audit document title after history and pathname schedules', () => {
    vi.useFakeTimers();
    const dataLayer: Array<Record<string, unknown>> = [];
    const auditPath = `/audit/${SCAN_ID}`;
    const auditDocumentTitle = `Audit ${SCAN_ID} | Web App`;
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}${auditPath}`,
      pathname: auditPath,
      search: '',
      hash: '',
    };
    let documentTitle = auditDocumentTitle;

    const history = {
      pushState(_state: unknown, _title: string, url?: string) {
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
      replaceState() {},
    };

    vi.stubGlobal('window', {
      location,
      history,
      dataLayer,
      addEventListener() {},
    });
    vi.stubGlobal('document', {
      get title() {
        return documentTitle;
      },
      referrer: '',
      querySelector: () => null,
      head: null,
    });

    seedAnalyticsPageContext({
      origin: ORIGIN,
      pathname: auditPath,
      title: auditDocumentTitle,
    });

    installAnalyticsHistoryHooks();
    window.history.pushState({}, '', '/contact');
    onNextJsRouteChange();
    expect(dataLayer).toEqual([]);
    expect(tryFlushAnalyticsPageReady()).toBeNull();

    vi.advanceTimersByTime(TITLE_READY_FALLBACK_MS);
    expect(dataLayer).toEqual([]);
    expect(JSON.stringify(dataLayer)).not.toContain(SCAN_ID);

    documentTitle = 'Contact';
    onNextJsRouteChange();
    expect(dataLayer).toEqual([
      {
        event: ANALYTICS_PAGE_READY_EVENT,
        page_path: '/contact',
        page_location: `${ORIGIN}/contact`,
        page_title: 'Contact',
        page_referrer: `${ORIGIN}/audit/:id`,
      },
    ]);
    expect(JSON.stringify(dataLayer)).not.toContain(SCAN_ID);
    expect(tryFlushAnalyticsPageReady()).toBeNull();
  });
});

describe('initial document load does not emit cw_analytics_page_ready', () => {
  afterEach(() => {
    resetAnalyticsPageContextSession();
    vi.unstubAllGlobals();
  });

  it('initial mount emits zero events and Home → Contact → Home emits exactly two', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    const location = {
      origin: ORIGIN,
      href: `${ORIGIN}/`,
      pathname: '/',
      search: '',
      hash: '',
    };
    let documentTitle = 'Web App';

    const history = {
      pushState(_state: unknown, _title: string, url?: string) {
        const resolved = new URL(String(url), ORIGIN);
        location.href = resolved.href;
        location.pathname = resolved.pathname;
        location.search = resolved.search;
      },
      replaceState() {},
    };

    vi.stubGlobal('window', {
      location,
      history,
      dataLayer,
      addEventListener() {},
    });
    vi.stubGlobal('document', {
      get title() {
        return documentTitle;
      },
      referrer: 'https://www.google.com/',
      querySelector: () => null,
      head: null,
    });

    const readyHits = () =>
      dataLayer.filter((row) => row.event === ANALYTICS_PAGE_READY_EVENT);

    installAnalyticsHistoryHooks();
    onNextJsRouteChange();
    expect(readyHits()).toEqual([]);

    window.history.pushState({}, '', '/contact');
    onNextJsRouteChange();
    expect(readyHits()).toEqual([]);
    documentTitle = 'Contact';
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/contact',
      page_title: 'Contact',
      page_referrer: `${ORIGIN}/`,
    });
    expect(readyHits()).toHaveLength(1);

    window.history.pushState({}, '', '/');
    onNextJsRouteChange();
    expect(readyHits()).toHaveLength(1);
    documentTitle = 'Web App';
    expect(tryFlushAnalyticsPageReady()).toMatchObject({
      page_path: '/',
      page_title: 'Web App',
      page_referrer: `${ORIGIN}/contact`,
    });
    expect(readyHits()).toEqual([
      {
        event: ANALYTICS_PAGE_READY_EVENT,
        page_path: '/contact',
        page_location: `${ORIGIN}/contact`,
        page_title: 'Contact',
        page_referrer: `${ORIGIN}/`,
      },
      {
        event: ANALYTICS_PAGE_READY_EVENT,
        page_path: '/',
        page_location: `${ORIGIN}/`,
        page_title: 'Web App',
        page_referrer: `${ORIGIN}/contact`,
      },
    ]);
  });
});
