'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/actions/brothers'
import type { ResponsibleRole } from '@/lib/types'
import { friendlyError } from '@/lib/actions/errors'

/**
 * Admin actions for a masjid's tabligh "health" data: the 5 aamaal, the
 * ulama/lady-taleem info, and the responsible brothers. All writes are
 * gated by Row Level Security (super_admin, or the area_admin of that
 * masjid); we also re-check the role here for defense in depth.
 */

async function guard(masjidId: number) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false as const, userId: null }

  const { data: me } = await supabase
    .from('profiles')
    .select('role, masjid_id, can_edit_health')
    .eq('id', user.id)
    .single()

  const forMyMasjid = me?.masjid_id === masjidId
  const isAllowed =
    me?.role === 'super_admin' ||
    (me?.role === 'area_admin' && forMyMasjid) ||
    (me?.can_edit_health === true && forMyMasjid)

  return { supabase, ok: isAllowed, userId: user.id }
}

export interface AamaalFlags {
  has_taleem: boolean
  has_mushwara: boolean
  has_local_jaula: boolean
  has_neighbouring_jaula: boolean
  has_daily_dawah: boolean
  has_monthly_3days: boolean
}

export async function updateAamaal(
  masjidId: number,
  flags: AamaalFlags
): Promise<ActionResult> {
  const { supabase, ok, userId } = await guard(masjidId)
  if (!ok) return { ok: false, error: 'You can’t edit this masjid.' }

  const { error } = await supabase
    .from('masjid_aamaal')
    .update({ ...flags, updated_by: userId })
    .eq('masjid_id', masjidId)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }
  revalidatePath(`/masjids/${masjidId}`)
  revalidatePath(`/admin/masjids/${masjidId}/health`)
  return { ok: true }
}

export interface MasjidInfoFields {
  ulama_count: number
  ulama_spent_4_months: number
  ulama_spent_1_year: number
  lady_taleem_locations: number
}

export async function updateMasjidInfo(
  masjidId: number,
  fields: MasjidInfoFields
): Promise<ActionResult> {
  const { supabase, ok, userId } = await guard(masjidId)
  if (!ok) return { ok: false, error: 'You can’t edit this masjid.' }

  // Guard against negative numbers slipping through.
  const clean = {
    ulama_count: Math.max(0, Math.floor(fields.ulama_count || 0)),
    ulama_spent_4_months: Math.max(0, Math.floor(fields.ulama_spent_4_months || 0)),
    ulama_spent_1_year: Math.max(0, Math.floor(fields.ulama_spent_1_year || 0)),
    lady_taleem_locations: Math.max(0, Math.floor(fields.lady_taleem_locations || 0)),
    updated_by: userId,
  }

  const { error } = await supabase
    .from('masjid_info')
    .update(clean)
    .eq('masjid_id', masjidId)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }
  revalidatePath(`/masjids/${masjidId}`)
  revalidatePath(`/admin/masjids/${masjidId}/health`)
  return { ok: true }
}

export async function addResponsible(
  masjidId: number,
  brotherId: number,
  role: ResponsibleRole,
  notes: string
): Promise<ActionResult> {
  const { supabase, ok } = await guard(masjidId)
  if (!ok) return { ok: false, error: 'You can’t edit this masjid.' }
  if (!brotherId) return { ok: false, error: 'Please choose a brother.' }

  const { error } = await supabase.from('masjid_responsible').insert({
    masjid_id: masjidId,
    brother_id: brotherId,
    role,
    notes: notes.trim() || null,
  })

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }
  revalidatePath(`/masjids/${masjidId}`)
  revalidatePath(`/admin/masjids/${masjidId}/health`)
  return { ok: true }
}

export async function removeResponsible(
  masjidId: number,
  responsibleId: number
): Promise<ActionResult> {
  const { supabase, ok } = await guard(masjidId)
  if (!ok) return { ok: false, error: 'You can’t edit this masjid.' }

  const { error } = await supabase
    .from('masjid_responsible')
    .delete()
    .eq('id', responsibleId)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }
  revalidatePath(`/masjids/${masjidId}`)
  revalidatePath(`/admin/masjids/${masjidId}/health`)
  return { ok: true }
}
