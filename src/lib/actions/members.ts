'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/actions/brothers'
import { friendlyError } from '@/lib/actions/errors'

/**
 * Admin actions for approving members and setting their delegated
 * permissions. Every write is guarded three ways: the route middleware,
 * a server-side role/permission check here, and the database's Row Level
 * Security (plus the protect_profile_columns trigger, which is the
 * ultimate authority on role/approval/permission changes).
 */

/** Work out what the caller is allowed to do. */
async function caller() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { supabase, canApprove: false, canGrant: false, canPromote: false }
  }

  const { data: me } = await supabase
    .from('profiles')
    .select('role, can_approve_members')
    .eq('id', user.id)
    .single()

  const isSuper = me?.role === 'super_admin'
  const isArea = me?.role === 'area_admin'
  return {
    supabase,
    // May approve members: admins, or a delegate with approve permission.
    canApprove: isSuper || isArea || Boolean(me?.can_approve_members),
    // May hand out capability switches / revoke: admins only.
    canGrant: isSuper || isArea,
    // May promote to area_admin: super admin only.
    canPromote: isSuper,
  }
}

export async function approveMember(input: {
  profileId: string
  masjidId: number
  makeAreaAdmin?: boolean
  canApproveMembers?: boolean
  canEditHealth?: boolean
}): Promise<ActionResult> {
  const { supabase, canApprove, canGrant, canPromote } = await caller()
  if (!canApprove) {
    return { ok: false, error: 'You’re not allowed to approve members.' }
  }
  if (!input.masjidId) {
    return { ok: false, error: 'Please choose a masjid to link this member to.' }
  }

  const update: {
    is_approved: boolean
    masjid_id: number
    role?: 'area_admin'
    can_approve_members?: boolean
    can_edit_health?: boolean
  } = {
    is_approved: true,
    masjid_id: input.masjidId,
  }

  // Only admins may set delegated powers or promote. A delegate approver
  // can approve membership but cannot hand out any powers.
  if (canGrant) {
    update.can_approve_members = Boolean(input.canApproveMembers)
    update.can_edit_health = Boolean(input.canEditHealth)
    if (input.makeAreaAdmin && canPromote) update.role = 'area_admin'
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', input.profileId)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to change this member.'),
    }

  revalidatePath('/admin/members')
  revalidatePath('/admin')
  return { ok: true }
}

/** Change an already-approved member's delegated powers (admins only). */
export async function updatePermissions(input: {
  profileId: string
  canApproveMembers: boolean
  canEditHealth: boolean
}): Promise<ActionResult> {
  const { supabase, canGrant } = await caller()
  if (!canGrant) {
    return { ok: false, error: 'Only admins can change permissions.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      can_approve_members: input.canApproveMembers,
      can_edit_health: input.canEditHealth,
    })
    .eq('id', input.profileId)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to change this member.'),
    }

  revalidatePath('/admin/members')
  return { ok: true }
}

export async function revokeMember(profileId: string): Promise<ActionResult> {
  // Revoking membership is an admin-only action.
  const { supabase, canGrant } = await caller()
  if (!canGrant) {
    return { ok: false, error: 'Only admins can change member access.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_approved: false,
      can_approve_members: false,
      can_edit_health: false,
    })
    .eq('id', profileId)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to change this member.'),
    }

  revalidatePath('/admin/members')
  revalidatePath('/admin')
  return { ok: true }
}
