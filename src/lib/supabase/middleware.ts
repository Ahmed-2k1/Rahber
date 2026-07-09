import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Runs on every request. It does two jobs:
 *  1. Refreshes the login session so the user stays logged in.
 *  2. Protects pages: if you're NOT logged in and try to open a
 *     private page, it sends you to /login.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
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

  // Pages anyone can open without logging in
  const publicPaths = ['/login', '/register', '/verify-email', '/auth']
  const isPublic = publicPaths.some((p) => path.startsWith(p))

  // Not logged in + trying to open a private page => go to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Already logged in + on the login/register page => go home
  if (user && (path.startsWith('/login') || path.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Admin area: reachable by an admin OR a member who's been granted a
  // delegated power (approve members / edit health). This is the first
  // of three guards (middleware → admin layout → database RLS).
  if (user && path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, can_approve_members, can_edit_health')
      .eq('id', user.id)
      .single()

    const mayEnter =
      profile?.role === 'super_admin' ||
      profile?.role === 'area_admin' ||
      profile?.can_approve_members === true ||
      profile?.can_edit_health === true

    if (!mayEnter) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
