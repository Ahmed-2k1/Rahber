import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  HealthEditor,
  type ResponsibleItem,
  type BrotherOption,
} from '@/components/admin/health-editor'
import type { AamaalFlags } from '@/lib/actions/health'
import type { MasjidResponsible } from '@/lib/types'

export default async function MasjidHealthPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const masjidId = Number(params.id)
  if (Number.isNaN(masjidId)) notFound()

  const { data: me } = await supabase
    .from('profiles')
    .select('role, masjid_id, can_edit_health')
    .eq('id', user!.id)
    .single()
  const forMine = me?.masjid_id === masjidId
  const allowed =
    me?.role === 'super_admin' ||
    (me?.role === 'area_admin' && forMine) ||
    (me?.can_edit_health === true && forMine)
  if (!allowed) redirect('/admin/masjids')

  const [masjidRes, aamaalRes, infoRes, respRes, brothersRes] =
    await Promise.all([
      supabase.from('masjids').select('name').eq('id', masjidId).single(),
      supabase
        .from('masjid_aamaal')
        .select(
          'has_taleem, has_mushwara, has_local_jaula, has_neighbouring_jaula, has_daily_dawah, has_monthly_3days'
        )
        .eq('masjid_id', masjidId)
        .single(),
      supabase
        .from('masjid_info')
        .select(
          'ulama_count, ulama_spent_4_months, ulama_spent_1_year, lady_taleem_locations'
        )
        .eq('masjid_id', masjidId)
        .single(),
      supabase
        .from('masjid_responsible')
        .select('id, brother_id, role, notes, brothers(name)')
        .eq('masjid_id', masjidId),
      supabase
        .from('brothers')
        .select('id, name')
        .eq('masjid_id', masjidId)
        .order('name'),
    ])

  if (!masjidRes.data) notFound()

  const aamaal = (aamaalRes.data ?? {
    has_taleem: false,
    has_mushwara: false,
    has_local_jaula: false,
    has_neighbouring_jaula: false,
    has_daily_dawah: false,
    has_monthly_3days: false,
  }) as AamaalFlags

  const info = infoRes.data ?? {
    ulama_count: 0,
    ulama_spent_4_months: 0,
    ulama_spent_1_year: 0,
    lady_taleem_locations: 0,
  }

  const responsibleRows = (respRes.data ?? []) as unknown as (Pick<
    MasjidResponsible,
    'id' | 'brother_id' | 'role' | 'notes'
  > & { brothers: { name: string } | null })[]

  const responsible: ResponsibleItem[] = responsibleRows.map((r) => ({
    id: r.id,
    brother_id: r.brother_id,
    role: r.role,
    notes: r.notes,
    brotherName: r.brothers?.name ?? 'Unknown',
  }))

  const brothers = (brothersRes.data ?? []) as BrotherOption[]

  return (
    <div className="p-4">
      <h2 className="mb-4 text-base font-semibold">
        Health data — {masjidRes.data.name}
      </h2>
      <HealthEditor
        masjidId={masjidId}
        aamaal={aamaal}
        info={info}
        responsible={responsible}
        brothers={brothers}
      />
    </div>
  )
}
