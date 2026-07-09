'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/actions/brothers'

/**
 * Admin actions for approving/removing members. Every write is guarded
 * three ways: the route middleware, a server-side role check here, and
 * the database's Row Level Security (plus the protect_profile_columns
 * trigger, which is the ultimate authority on role/approval changes).
 */

/** Confirm the caller is an admin before letting any write proceed. */
async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, role: null as null }

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = me?.role ?? null
  return { supabase, role: role as 'super_admin' | 'area_admin' | 'member' | null }
}

export async function approveMember(input: {
  profileId: string
  masjidId: number
  makeAreaAdmin?: boolean
}): Promise<ActionResult> {
  const { supabase, role } = await requireAdmin()
  if (role !== 'super_admin' && role !== 'area_admin') {
    return { ok: false, error: 'Only admins can approve members.' }
  }
  if (!input.masjidId) {
    return { ok: false, error: 'Please choose a masjid to link this member to.' }
  }

  const update: {
    is_approved: boolean
    masjid_id: number
    role?: 'area_admin'
  } = {
    is_approved: true,
    masjid_id: input.masjidId,
  }
  // Only a super admin may promote someone to area_admin. The database
  // trigger enforces this too; we just avoid attempting it needlessly.
  if (input.makeAreaAdmin && role === 'super_admin') {
    update.role = 'area_admin'
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', input.profileId)

  if (error) return { ok: false, error: friendly(error) }

  revalidatePath('/admin/members')
  revalidatePath('/admin')
  return { ok: true }
}

export async function revokeMember(profileId: string): Promise<ActionResult> {
  const { supabase, role } = await requireAdmin()
  if (role !== 'super_admin' && role !== 'area_admin') {
    return { ok: false, error: 'Only admins can change member access.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: false })
    .eq('id', profileId)

  if (error) return { ok: false, error: friendly(error) }

  revalidatePath('/admin/members')
  revalidatePath('/admin')
  return { ok: true }
}

function friendly(error: { code?: string; message?: string }): string {
  if (
    error.code === '42501' ||
    /row-level security|violates row-level/i.test(error.message ?? '')
  ) {
    return 'You don’t have permission to change this member.'
  }
  return error.message ?? 'Something went wrong.'
}
