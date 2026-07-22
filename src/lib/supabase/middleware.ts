import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Builds the Content-Security-Policy value for a given request, using a
 * fresh per-request nonce for inline scripts (Next.js hydration/Fast
 * Refresh scripts pick this nonce up automatically via the CSP header —
 * see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy).
 *
 * connect-src must allow the Supabase project URL because the browser
 * Supabase client (src/lib/supabase/client.ts) talks to it directly via
 * fetch/WebSocket from Client Components.
 */
function buildContentSecurityPolicy(nonce: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  // Next.js dev mode's React Fast Refresh/HMR runtime uses eval() to apply
  // hot-reloaded modules — without 'unsafe-eval' the whole app fails to
  // hydrate in `next dev` (confirmed: blank page + EvalError in console).
  // Production builds don't rely on eval, so this is dev-only.
  const devUnsafeEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devUnsafeEval};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self' ${supabaseUrl};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `

  return cspHeader.replace(/\s{2,}/g, ' ').trim()
}

/**
 * Runs on every request. It does three jobs:
 *  1. Refreshes the login session so the user stays logged in.
 *  2. Protects pages: if you're NOT logged in and try to open a
 *     private page, it sends you to /login.
 *  3. Applies a per-request CSP (with nonce) to every response path below,
 *     including both redirects — not just the pass-through case.
 */
export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const contentSecurityPolicyHeaderValue = buildContentSecurityPolicy(nonce)

  // Cloned request headers, carrying the nonce + CSP downstream so
  // Next.js's own injected scripts (hydration, Fast Refresh, etc.) can
  // read the nonce off the CSP header and self-apply it.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          supabaseResponse.headers.set(
            'Content-Security-Policy',
            contentSecurityPolicyHeaderValue
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() revalidates the session on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Pages anyone can open without logging in. "/" is the ayah landing
  // page — the front door for everyone, signed in or not.
  const publicPaths = ['/login', '/register', '/verify-email', '/auth']
  const isPublic =
    path === '/' || publicPaths.some((p) => path.startsWith(p))

  // Not logged in + trying to open a private page => go to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    response.headers.set(
      'Content-Security-Policy',
      contentSecurityPolicyHeaderValue
    )
    return response
  }

  // Already logged in + on the login/register page => into the app
  if (user && (path.startsWith('/login') || path.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/masjids'
    const response = NextResponse.redirect(url)
    response.headers.set(
      'Content-Security-Policy',
      contentSecurityPolicyHeaderValue
    )
    return response
  }

  // Admin area: middleware only checks that someone's logged in (handled
  // by the generic rule above). Whether they actually have admin access
  // is decided by the /admin layout, which shows a friendly "not
  // authorized" message instead of silently bouncing people away — that
  // way the door is visible, just locked for those without access.

  return supabaseResponse
}
