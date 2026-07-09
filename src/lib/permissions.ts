import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'

/**
 * The current user's effective powers, worked out from their role plus
 * any delegated permission switches. Admin roles imply the delegated
 * powers; a plain member only has what's been explicitly granted.
 *
 * This mirrors the database rules (see the delegated_permissions
 * migration). The database is still the final authority — this helper
 * just lets the UI show/hide things and lets server actions fail early
 * with a friendly message.
 */
export interface MyPermissions {
  userId: string | null
  role: UserRole | null
  masjidId: number | null
  /** Approve/revoke members for own masjid. */
  canApproveMembers: boolean
  /** Edit 5 aamaal / info / responsible brothers for own masjid. */
  canEditHealth: boolean
  /** Add/edit masjids (super admin only). */
  canManageMasjids: boolean
  /** May hand out capability switches to others. */
  canGrantCapabilities: boolean
  /** May promote a member to area_admin (super admin only). */
  canPromote: boolean
  /** Whether the /admin area should be reachable at all. */
  canEnterAdmin: boolean
}

export async function getMyPermissions(): Promise<MyPermissions> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return empty()
  }

  const { data } = await supabase
    .from('profiles')
    .select('role, masjid_id, can_approve_members, can_edit_health')
    .eq('id', user.id)
    .single()

  const role = (data?.role ?? null) as UserRole | null
  const isSuper = role === 'super_admin'
  const isArea = role === 'area_admin'

  const canApproveMembers = isSuper || isArea || Boolean(data?.can_approve_members)
  const canEditHealth = isSuper || isArea || Boolean(data?.can_edit_health)
  const canManageMasjids = isSuper
  const canGrantCapabilities = isSuper || isArea

  return {
    userId: user.id,
    role,
    masjidId: data?.masjid_id ?? null,
    canApproveMembers,
    canEditHealth,
    canManageMasjids,
    canGrantCapabilities,
    canPromote: isSuper,
    canEnterAdmin: canApproveMembers || canEditHealth || canManageMasjids,
  }
}

function empty(): MyPermissions {
  return {
    userId: null,
    role: null,
    masjidId: null,
    canApproveMembers: false,
    canEditHealth: false,
    canManageMasjids: false,
    canGrantCapabilities: false,
    canPromote: false,
    canEnterAdmin: false,
  }
}
