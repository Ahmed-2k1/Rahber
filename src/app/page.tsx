import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import {
  MasjidBrowser,
  type MasjidListItem,
} from '@/components/masjid/masjid-browser'
import { AAMAAL_ITEMS } from '@/lib/format'
import type { MasjidAamaal } from '@/lib/types'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Show the admin shortcut only to admins.
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = me?.role === 'super_admin' || me?.role === 'area_admin'

  // Pull every active masjid, plus its aamaal row and a count of brothers.
  const { data: masjids } = await supabase
    .from('masjids')
    .select('id, name, area, masjid_aamaal(*), brothers(count)')
    .eq('is_active', true)
    .order('name')

  const items: MasjidListItem[] = (masjids ?? []).map((m) => {
    const raw = m.masjid_aamaal as MasjidAamaal | MasjidAamaal[] | null
    const aamaal = Array.isArray(raw) ? raw[0] : raw
    const aamaalCount = aamaal
      ? AAMAAL_ITEMS.filter(({ key }) => aamaal[key]).length
      : 0
    const brothers = m.brothers as { count: number }[] | null
    const brotherCount = brothers?.[0]?.count ?? 0

    return {
      id: m.id,
      name: m.name,
      area: m.area,
      brotherCount,
      aamaalCount,
    }
  })

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-10">
      <AppHeader title="Masjids" showAddBrother showAdmin={isAdmin} />
      <div className="p-4">
        <MasjidBrowser masjids={items} />
      </div>
    </div>
  )
}
