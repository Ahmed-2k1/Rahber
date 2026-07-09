'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Action for adding a brother (an address entry).
 *
 * It runs on the server, so the browser never talks to the database
 * directly. Supabase's Row Level Security still has the final say:
 * only an *approved* member (or an admin) is allowed to insert. If an
 * unapproved user reaches here, we turn the raw security error into a
 * friendly message instead of a scary code.
 */

export interface AddBrotherInput {
  name: string
  address_line: string
  landmark?: string | null
  phone?: string | null
  notes?: string | null
  masjid_id: number
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; error: string }

export async function addBrother(
  input: AddBrotherInput
): Promise<ActionResult<{ brotherId: number; masjidId: number }>> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in.' }

  // Tidy up the inputs and check the required ones.
  const name = input.name?.trim()
  const address = input.address_line?.trim()
  if (!name) return { ok: false, error: 'Please enter the brother’s name.' }
  if (!address) return { ok: false, error: 'Please enter an address.' }
  if (!input.masjid_id) return { ok: false, error: 'Please choose a masjid.' }

  const { data, error } = await supabase
    .from('brothers')
    .insert({
      name,
      address_line: address,
      landmark: input.landmark?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      masjid_id: input.masjid_id,
      added_by: user.id,
    })
    .select('id, masjid_id')
    .single()

  if (error) {
    if (isRlsDenied(error)) {
      return {
        ok: false,
        error:
          'Your account isn’t approved to add brothers yet. Ask an admin to approve you.',
      }
    }
    return { ok: false, error: error.message }
  }

  // Refresh the masjid page so the new brother shows up immediately.
  revalidatePath(`/masjids/${data.masjid_id}`)
  return { ok: true, brotherId: data.id, masjidId: data.masjid_id }
}

/** True when Postgres/Supabase blocked the write via Row Level Security. */
function isRlsDenied(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42501' ||
    /row-level security|violates row-level/i.test(error.message ?? '')
  )
}
