import { notFound, redirect } from 'next/navigation'
import {
  MapPin,
  Phone,
  StickyNote,
  CalendarClock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { NiyyahBadges } from '@/components/brother/niyyah-badges'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="mx-auto min-h-dvh max-w-md pb-16">
      <AppHeader title={typed.name} backHref={`/masjids/${typed.masjid_id}`} />

      <div className="space-y-4 p-4">
        {/* Contact / details */}
        <Card>
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

        {/* Visit history */}
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" /> Visit history
          </h2>

          {visits.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No visits logged yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {visits.map((v) => (
                <li key={v.id}>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
