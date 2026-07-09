import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MasjidForm, type MasjidFormValues } from '@/components/admin/masjid-form'
import type { Masjid } from '@/lib/types'

export default async function EditMasjidPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: me } = await supabase
    .from('profiles')
    .select('role, masjid_id')
    .eq('id', user!.id)
    .single()

  const masjidId = Number(params.id)
  if (Number.isNaN(masjidId)) notFound()

  // Super admin can edit any; area admin only their own.
  const allowed =
    me?.role === 'super_admin' ||
    (me?.role === 'area_admin' && me?.masjid_id === masjidId)
  if (!allowed) redirect('/admin/masjids')

  const { data: masjid } = await supabase
    .from('masjids')
    .select('id, name, address, area, lat, lng')
    .eq('id', masjidId)
    .single()
  if (!masjid) notFound()

  const initial = masjid as MasjidFormValues & Pick<Masjid, 'id'>

  return (
    <div className="p-4">
      <h2 className="mb-4 text-base font-semibold">Edit masjid</h2>
      <MasjidForm initial={initial} />
    </div>
  )
}
