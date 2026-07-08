import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use in the BROWSER (Client Components — files that
 * start with "use client"). Safe to use the publishable key here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
