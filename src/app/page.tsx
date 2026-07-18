import { Amiri } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { LandingSequence } from '@/components/landing/landing-sequence'

// Classic Naskh face for Qur'anic text — loaded only on this page.
const amiri = Amiri({ subsets: ['arabic'], weight: '400' })

/*
  The front door for everyone, signed in or not. Each visit begins
  with the two ayahs this whole app is in service of — the reminder
  before the work — then one button leads into the app itself. The
  orchestrated entrance lives in LandingSequence.
*/
export default async function LandingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <LandingSequence amiriClass={amiri.className} showAuthLinks={!user} />
    </main>
  )
}
