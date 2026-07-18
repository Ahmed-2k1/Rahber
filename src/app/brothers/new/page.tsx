import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { PageShell } from '@/components/shared/page-shell'
import { BrotherForm, type MasjidOption } from '@/components/brother/brother-form'

export default async function NewBrotherPage({
  searchParams,
}: {
  searchParams: { masjid?: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('masjids')
    .select('id, name, area')
    .eq('is_active', true)
    .order('name')

  const masjids = (data ?? []) as MasjidOption[]

  // If we arrived from a masjid page, lock that masjid in.
  const wantedId = Number(searchParams.masjid)
  const fixedMasjid =
    !Number.isNaN(wantedId) && searchParams.masjid
      ? masjids.find((m) => m.id === wantedId) ?? null
      : null

  const backHref = fixedMasjid ? `/masjids/${fixedMasjid.id}` : '/masjids'

  return (
    <PageShell>
      <AppHeader title="Add brother" backHref={backHref} />
      <div className="p-4">
        <BrotherForm masjids={masjids} fixedMasjid={fixedMasjid} />
      </div>
    </PageShell>
  )
}
