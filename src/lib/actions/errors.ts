/**
 * Shared helpers for turning a Supabase/Postgres write error into the
 * friendly message a Server Action returns to the UI. Row Level Security
 * is the ultimate authority on every write in this app; when it blocks
 * one, callers use this instead of surfacing the raw Postgres error.
 */

/** True when Postgres/Supabase blocked the write via Row Level Security. */
export function isRlsDenied(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42501' ||
    /row-level security|violates row-level/i.test(error.message ?? '')
  )
}

/**
 * Turn a Supabase/Postgres error into a friendly, user-facing message.
 * On an RLS denial this returns `deniedMessage`; otherwise it falls back
 * to the error's own message (or `fallback` if that's missing).
 */
export function friendlyError(
  error: { code?: string; message?: string },
  deniedMessage: string,
  fallback = 'Something went wrong.'
): string {
  if (isRlsDenied(error)) return deniedMessage
  return error.message ?? fallback
}
