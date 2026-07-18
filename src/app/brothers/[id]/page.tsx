import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  StickyNote,
  CalendarClock,
  PlusCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { PageShell } from '@/components/shared/page-shell'
import { StaggerList, StaggerItem } from '@/components/shared/motion'
import { NiyyahBadges } from '@/components/brother/niyyah-badges'
import { visitedRecently } from '@/components/brother/brother-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mapsUrl, timeAgo, niyyahList } from '@/lib/format'
import type { Brother, Visit } from '@/lib/types'

export default async function BrotherPage({
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
    .select('*, masjids(name)')
    .eq('id', brotherId)
    .single()
  if (!brother) notFound()

  const typed = brother as Brother & { masjids: { name: string } | null }

  const { data: visitsData } = await supabase
    .from('visits')
    .select('*')
    .eq('brother_id', brotherId)
    .order('visited_at', { ascending: false })

  const visits = (visitsData ?? []) as Visit[]
  const latest = visits[0] ?? null

  return (
    <PageShell>
      <AppHeader
        title={typed.name}
        backHref={`/masjids/${typed.masjid_id}`}
        heroTitle
      />

      {/* Large in-flow title — the sticky header's own title fades in
          only once this scrolls away. */}
      <h1 className="px-4 pt-4 text-[1.75rem] font-bold leading-tight tracking-[-0.01em]">
        {typed.name}
      </h1>

      <div className="space-y-4 p-4">
        {/* Contact / details */}
        <Card lit={visitedRecently(latest)}>
          <CardContent className="space-y-3 pt-6 text-sm">
            <a
              href={mapsUrl(typed.address_line, typed.landmark)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-primary"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {typed.address_line}
                {typed.landmark && (
                  <span className="block text-muted-foreground">
                    Landmark: {typed.landmark}
                  </span>
                )}
              </span>
            </a>

            {typed.phone && (
              <a
                href={`tel:${typed.phone}`}
                className="flex items-center gap-2 text-primary"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {typed.phone}
              </a>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={typed.status === 'active' ? 'secondary' : 'outline'}>
                {typed.status}
              </Badge>
              {typed.masjids?.name && (
                <span className="text-muted-foreground">
                  {typed.masjids.name}
                </span>
              )}
            </div>

            {typed.notes && (
              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p>{typed.notes}</p>
              </div>
            )}

            {latest && niyyahList(latest).length > 0 && (
              <div className="pt-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Latest niyyah
                </p>
                <NiyyahBadges visit={latest} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log a visit */}
        <Button asChild className="w-full">
          <Link href={`/brothers/${typed.id}/visit`}>
            <PlusCircle className="h-4 w-4" /> Log a visit
          </Link>
        </Button>

        {/* Visit history */}
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold tracking-tight">
            <CalendarClock className="h-4 w-4 text-primary" /> Visit history
          </h2>

          {visits.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No visits logged yet.
            </p>
          ) : (
            <StaggerList as="ul" className="space-y-2">
              {visits.map((v) => (
                <StaggerItem as="li" key={v.id}>
                  <Card className="p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {new Date(v.visited_at).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(v.visited_at)}
                      </span>
                    </div>
                    {v.notes && <p className="mt-1">{v.notes}</p>}
                    <div className="mt-2">
                      <NiyyahBadges visit={v} />
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </div>
    </PageShell>
  )
}
