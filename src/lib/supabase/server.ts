import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for use on the SERVER (Server Components, Route Handlers,
 * Server Actions). It reads the logged-in user's session from cookies so the
 * database knows WHO is asking — this is what makes our security rules work.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // This runs inside a Server Component, which cannot set cookies.
            // That's fine — the middleware refreshes the session instead.
          }
        },
      },
    }
  )
}
