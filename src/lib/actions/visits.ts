'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/actions/brothers'

/**
 * Server Action for logging a visit to a brother. Same rules as adding
 * a brother: only an approved member (or admin) may write, enforced by
 * Row Level Security. The five niyyah flags record what the brother
 * showed interest in during this visit.
 */

export interface LogVisitInput {
  brother_id: number
  notes?: string | null
  niyyah_3days: boolean
  niyyah_40days: boolean
  niyyah_4months: boolean
  niyyah_ijtema: boolean
  niyyah_local_gasht: boolean
}

export async function logVisit(
  input: LogVisitInput
): Promise<ActionResult<{ brotherId: number }>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in.' }

  if (!input.brother_id) {
    return { ok: false, error: 'Missing which brother this visit is for.' }
  }

  const { error } = await supabase.from('visits').insert({
    brother_id: input.brother_id,
    visited_by: user.id,
    notes: input.notes?.trim() || null,
    niyyah_3days: input.niyyah_3days,
    niyyah_40days: input.niyyah_40days,
    niyyah_4months: input.niyyah_4months,
    niyyah_ijtema: input.niyyah_ijtema,
    niyyah_local_gasht: input.niyyah_local_gasht,
  })

  if (error) {
    if (
      error.code === '42501' ||
      /row-level security|violates row-level/i.test(error.message ?? '')
    ) {
      return {
        ok: false,
        error:
          'Your account isn’t approved to log visits yet. Ask an admin to approve you.',
      }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/brothers/${input.brother_id}`)
  return { ok: true, brotherId: input.brother_id }
}
