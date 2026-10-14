/**
 * Placeholder website for OAuth-created users until they save a real URL.
 * Keep in sync with the DB default on `users.website` in `src/lib/db/schema.ts`.
 */
export const PENDING_WEBSITE_PLACEHOLDER = 'https://pending.example.invalid';

export function isPendingWebsite(website: string | null | undefined): boolean {
  return website === PENDING_WEBSITE_PLACEHOLDER;
}
