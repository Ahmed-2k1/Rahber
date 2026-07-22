import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MasjidForm, type MasjidFormValues } from '@/components/admin/masjid-form'
import { AccessDenied } from '@/components/shared/access-denied'
import { getMyPermissions } from '@/lib/permissions'
import type { Masjid } from '@/lib/types'

export default async function EditMasjidPage({
  params,
}: {
  params: { id: string }
}) {
  const perms = await getMyPermissions()

  const masjidId = Number(params.id)
  if (Number.isNaN(masjidId)) notFound()

  // Super admin can edit any; area admin only their own.
  const allowed =
    perms.role === 'super_admin' ||
    (perms.role === 'area_admin' && perms.masjidId === masjidId)

  if (!allowed) {
    return (
      <div className="p-4">
        <AccessDenied masjidId={perms.masjidId} />
      </div>
    )
  }

  const supabase = createClient()
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
