import { createClient } from '@/lib/supabase/server'
import {
  MembersManager,
  type AdminMember,
  type MasjidOption,
} from '@/components/admin/members-manager'

export default async function AdminMembersPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The layout already guaranteed we're an admin; fetch our role so we
  // know whether we may promote members to area_admin.
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()
  const canPromote = me?.role === 'super_admin'

  // RLS scopes these: super_admin sees everyone, area_admin sees their
  // own masjid's members.
  const [{ data: profiles }, { data: masjids }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, phone, role, masjid_id, is_approved')
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
      canPromote={canPromote}
    />
  )
}
