import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, ChevronRight, Users, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { AamaalChecklist } from '@/components/masjid/aamaal-checklist'
import { KhuroojStats } from '@/components/masjid/khurooj-stats'
import { UlamaCard } from '@/components/masjid/ulama-card'
import { NiyyahBadges } from '@/components/brother/niyyah-badges'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mapsUrl, timeAgo, RESPONSIBLE_ROLE_LABELS } from '@/lib/format'
import type {
  Brother,
  Visit,
  MasjidResponsible,
  ResponsibleRole,
} from '@/lib/types'

/** Pick the most recent visit from a brother's list of visits. */
function latestVisit(visits: Visit[] | null | undefined): Visit | null {
  if (!visits || visits.length === 0) return null
  return [...visits].sort(
    (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
  )[0]
}

export default async function MasjidPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const masjidId = Number(params.id)
  if (Number.isNaN(masjidId)) notFound()

  const { data: masjid } = await supabase
    .from('masjids')
    .select('*')
    .eq('id', masjidId)
    .single()
  if (!masjid) notFound()

  // Fetch the rest in parallel.
  const [aamaalRes, infoRes, brothersRes, responsibleRes] = await Promise.all([
    supabase.from('masjid_aamaal').select('*').eq('masjid_id', masjidId).single(),
    supabase.from('masjid_info').select('*').eq('masjid_id', masjidId).single(),
    supabase
      .from('brothers')
      .select('*, visits(*)')
      .eq('masjid_id', masjidId)
      .order('name'),
    supabase
      .from('masjid_responsible')
      .select('*, brothers(name)')
      .eq('masjid_id', masjidId),
  ])

  const aamaal = aamaalRes.data
  const info = infoRes.data
  const brothers = (brothersRes.data ?? []) as (Brother & { visits: Visit[] })[]
  const responsible = (responsibleRes.data ?? []) as (MasjidResponsible & {
    brothers: { name: string } | null
  })[]

  const ladyTaleem = info?.lady_taleem_locations ?? 0

  // Brothers (id + name) holding each responsible role.
  const membersForRole = (role: ResponsibleRole) =>
    responsible
      .filter((r) => r.role === role)
      .map((r) => ({ id: r.brother_id, name: r.brothers?.name ?? 'Unknown' }))

  // Leadership shown in the "Responsible brothers" card.
  const leadership = responsible.filter(
    (r) => r.role === 'amir' || r.role === 'alim'
  )

  // Ulama = alim-tagged brothers; their notes hold the time they spent.
  const ulamaMembers = responsible
    .filter((r) => r.role === 'alim')
    .map((r) => ({
      id: r.brother_id,
      name: r.brothers?.name ?? 'Unknown',
      detail: r.notes,
    }))

  // Khurooj (time-in-jamaat) tiles.
  const khuroojGroups = [
    { key: '4months', label: '4 months', members: membersForRole('4months') },
    { key: '40days', label: '40 days', members: membersForRole('40days') },
    { key: '3days', label: '3 days', members: membersForRole('3days') },
    { key: 'other', label: 'Others', members: membersForRole('other') },
  ]

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-16">
      <AppHeader title={masjid.name} backHref="/" />

      <div className="space-y-4 p-4">
        {/* Masjid address */}
        {(masjid.area || masjid.address) && (
          <a
            href={mapsUrl(masjid.address ?? masjid.name, masjid.area)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{[masjid.address, masjid.area].filter(Boolean).join(', ')}</span>
          </a>
        )}

        {/* 5 Aamaal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">5 Aamaal</CardTitle>
          </CardHeader>
          <CardContent>
            <AamaalChecklist aamaal={aamaal} />
          </CardContent>
        </Card>

        {/* Responsible brothers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Responsible brothers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {leadership.length === 0 ? (
              <p className="text-muted-foreground">Not recorded yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {leadership.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/brothers/${r.brother_id}`}
                      className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-muted"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {RESPONSIBLE_ROLE_LABELS[r.role as ResponsibleRole]}
                      </Badge>
                      <span className="flex-1">{r.brothers?.name ?? 'Unknown'}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Khurooj — time given in jamaat */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Time in jamaat</CardTitle>
          </CardHeader>
          <CardContent>
            <KhuroojStats groups={khuroojGroups} />
          </CardContent>
        </Card>

        {/* Ulama (clickable) */}
        <UlamaCard ulama={ulamaMembers} />

        {/* Lady Taleem */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4 text-primary" /> Lady Taleem
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {ladyTaleem > 0 ? (
              <p>
                Happening in{' '}
                <span className="font-semibold">{ladyTaleem}</span>{' '}
                {ladyTaleem === 1 ? 'location' : 'locations'}
              </p>
            ) : (
              <p className="text-muted-foreground">Not yet started</p>
            )}
          </CardContent>
        </Card>

        {/* Brothers list */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Brothers ({brothers.length})
            </h2>
          </div>

          {brothers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No brothers added for this masjid yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {brothers.map((b) => {
                const last = latestVisit(b.visits)
                return (
                  <li key={b.id}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/brothers/${b.id}`}
                          className="min-w-0 flex-1"
                        >
                          <p className="truncate font-medium">{b.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {b.address_line}
                          </p>
                        </Link>
                        <Link href={`/brothers/${b.id}`}>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <a
                          href={mapsUrl(b.address_line, b.landmark)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary"
                        >
                          <MapPin className="h-3.5 w-3.5" /> Map
                        </a>
                        {b.phone && (
                          <a
                            href={`tel:${b.phone}`}
                            className="inline-flex items-center gap-1 text-primary"
                          >
                            <Phone className="h-3.5 w-3.5" /> Call
                          </a>
                        )}
                        <span className="text-muted-foreground">
                          {last
                            ? `Visited ${timeAgo(last.visited_at)}`
                            : 'Not visited yet'}
                        </span>
                      </div>

                      <div className="mt-2">
                        <NiyyahBadges visit={last} />
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
