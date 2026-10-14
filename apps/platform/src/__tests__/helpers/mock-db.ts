/**
 * Lightweight Drizzle-ORM mock for API route unit tests.
 *
 * Design: every SELECT chain is backed by a single lazy resolver tied to the
 * shared _queue.  Intermediate methods (.from, .where, .orderBy, .limit, etc.)
 * all return the same proxy so the resolver is called exactly once when the
 * chain is finally awaited.  INSERT / UPDATE chains resolve to undefined (side-
 * effect only).
 *
 * Usage:
 *   dbReturn([row1], [row2])   → first awaited SELECT returns [row1], second [row2]
 *   resetMockDb()              → clears queue and resets all vi.fn() call history
 */

import { vi } from 'vitest';

const _queue: unknown[][] = [];

function makeLazyChain(resolveWith: () => unknown): unknown {
  const handler: ProxyHandler<object> = {
    get(_, prop) {
      if (prop === 'then') {
        return (
          onfulfilled: (v: unknown) => unknown,
          onrejected?: (e: unknown) => unknown,
        ) => Promise.resolve(resolveWith()).then(onfulfilled, onrejected);
      }
      if (prop === 'catch') {
        return (onrejected: (e: unknown) => unknown) =>
          Promise.resolve(resolveWith()).catch(onrejected);
      }
      if (prop === 'finally') {
        return (onfinally: () => void) =>
          Promise.resolve(resolveWith()).finally(onfinally);
      }
      // Every other property (chainable method) returns the same lazy chain
      return () => makeLazyChain(resolveWith);
    },
  };
  return new Proxy(Object.create(null), handler);
}

export const mockDb = {
  /** SELECT – each awaited chain pops the next item from the queue. */
  select: vi.fn(() => makeLazyChain(() => _queue.shift() ?? [])),

  /** INSERT – resolves to undefined; use mockDb.insert.mock.calls to inspect args. */
  insert: vi.fn(() => makeLazyChain(() => undefined)),

  /** UPDATE – resolves to undefined; use mockDb.update.mock.calls to inspect args. */
  update: vi.fn(() => makeLazyChain(() => undefined)),

  /** Executes the callback synchronously inside the same mock db. */
  transaction: vi.fn(async (fn: (tx: typeof mockDb) => Promise<unknown>) =>
    fn(mockDb),
  ),
};

/**
 * Push one result per upcoming SELECT query.
 * Each array becomes the resolved value of one awaited SELECT chain.
 */
export function dbReturn(...rows: unknown[][]) {
  _queue.push(...rows);
}

/** Reset the queue and all vi.fn() call counts. */
export function resetMockDb() {
  _queue.length = 0;
  mockDb.select.mockClear();
  mockDb.insert.mockClear();
  mockDb.update.mockClear();
  mockDb.transaction.mockClear();
}
