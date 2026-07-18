import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { PageShell } from '@/components/shared/page-shell'
import { VisitForm } from '@/components/brother/visit-form'
import type { Brother } from '@/lib/types'

export default async function LogVisitPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const brotherId = Number(params.id)
  if (Number.isNaN(brotherId)) notFound()

  const { data: brother } = await supabase
    .from('brothers')
    .select('id, name')
    .eq('id', brotherId)
    .single()
  if (!brother) notFound()

  const typed = brother as Pick<Brother, 'id' | 'name'>

  return (
    <PageShell>
      <AppHeader title="Log a visit" backHref={`/brothers/${brotherId}`} />
      <div className="p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Logging a visit to <span className="font-medium text-foreground">{typed.name}</span>.
        </p>
        <VisitForm brotherId={brotherId} />
      </div>
    </PageShell>
  )
}
