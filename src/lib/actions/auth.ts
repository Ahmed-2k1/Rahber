'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * These are "Server Actions" — functions that run safely on the server
 * when a form is submitted. The user's password never sits in the
 * browser's page code; it goes straight to the server.
 */

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
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
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  // If email confirmation is OFF, signUp returns a live session right away
  // → send them straight into the app. If it's ON, there's no session yet
  // → send them to the "check your email" page.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/')
  }

  redirect('/verify-email')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
