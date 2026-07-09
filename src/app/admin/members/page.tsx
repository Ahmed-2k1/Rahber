import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyPermissions } from '@/lib/permissions'
import {
  MembersManager,
  type AdminMember,
  type MasjidOption,
} from '@/components/admin/members-manager'

export default async function AdminMembersPage() {
  const supabase = createClient()

  // This page is for approving members; a delegate without that power
  // shouldn't be here.
  const perms = await getMyPermissions()
  if (!perms.canApproveMembers) redirect('/admin')

  // RLS scopes these: super_admin sees everyone, area_admin / approver
  // sees their own masjid's members.
  const [{ data: profiles }, { data: masjids }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, name, phone, role, masjid_id, is_approved, can_approve_members, can_edit_health'
      )
      .order('is_approved')
      .order('created_at'),
    supabase
      .from('masjids')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <MembersManager
      members={(profiles ?? []) as AdminMember[]}
      masjids={(masjids ?? []) as MasjidOption[]}
      canGrant={perms.canGrantCapabilities}
      canPromote={perms.canPromote}
    />
  )
}
