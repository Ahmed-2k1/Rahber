'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { AuthError } from '@supabase/supabase-js'

/**
 * These are "Server Actions" — functions that run safely on the server
 * when a form is submitted. The user's password never sits in the
 * browser's page code; it goes straight to the server.
 */

/**
 * Supabase Auth errors come with a structured `.code` — swap the raw
 * message for wording this app actually wrote, instead of showing
 * Supabase/GoTrue's internal text verbatim. `invalid_credentials` is kept
 * deliberately vague on purpose (matches Supabase's own default): it
 * shouldn't reveal whether the email exists or the password was wrong.
 */
function friendlyAuthError(error: AuthError, context: 'login' | 'signup'): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Please try again.'
    case 'email_not_confirmed':
      return 'Please confirm your email first — check your inbox (and spam folder) for the confirmation link.'
    case 'user_banned':
      return 'This account has been suspended. Please contact your masjid’s admin.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists — try signing in instead.'
    case 'weak_password':
      return 'Please choose a stronger password.'
    case 'email_address_invalid':
      return 'That doesn’t look like a valid email address.'
    case 'signup_disabled':
      return 'Sign-ups aren’t open right now. Please contact your masjid’s admin.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts — please wait a moment and try again.'
    default:
      return context === 'login'
        ? 'Something went wrong signing in. Please try again.'
        : 'Something went wrong creating your account. Please try again.'
  }
}

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(friendlyAuthError(error, 'login')))
  }

  revalidatePath('/', 'layout')
  redirect('/masjids')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const name = String(formData.get('name') ?? '')
  const phone = String(formData.get('phone') ?? '')
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // This data lands in the signup form's "extra info" and is read
      // by our database trigger to fill the new profile row.
      data: { name, phone },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(friendlyAuthError(error, 'signup')))
  }

  // If email confirmation is OFF, signUp returns a live session right away
  // → send them straight into the app. If it's ON, there's no session yet
  // → send them to the "check your email" page.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/masjids')
  }

  redirect('/verify-email')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  // Back to the front door — the ayah landing.
  redirect('/')
}
