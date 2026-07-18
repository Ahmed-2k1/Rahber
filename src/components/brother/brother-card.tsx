import Link from 'next/link'
import { ChevronRight, MapPin, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { NiyyahBadges } from '@/components/brother/niyyah-badges'
import { mapsUrl, timeAgo } from '@/lib/format'
import type { Brother, Visit } from '@/lib/types'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** True when the brother was visited within the last 30 days. */
export function visitedRecently(visit: Visit | null): boolean {
  if (!visit) return false
  return Date.now() - new Date(visit.visited_at).getTime() < THIRTY_DAYS_MS
}

/**
 * One brother row in a masjid's list. The mihrab corner lights in
 * gold when the brother was visited within the last 30 days — the
 * same "active engagement" signal masjid cards use for full aamaal.
 */
export function BrotherCard({
  brother,
  lastVisit,
}: {
  brother: Brother
  lastVisit: Visit | null
}) {
  return (
    <Card lit={visitedRecently(lastVisit)} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/brothers/${brother.id}`} className="min-w-0 flex-1">
          <p className="truncate font-medium">{brother.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {brother.address_line}
          </p>
        </Link>
        <Link href={`/brothers/${brother.id}`} aria-label={`Open ${brother.name}`}>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <a
          href={mapsUrl(brother.address_line, brother.landmark)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary"
        >
          <MapPin className="h-3.5 w-3.5" /> Map
        </a>
        {brother.phone && (
          <a
            href={`tel:${brother.phone}`}
            className="inline-flex items-center gap-1 text-primary"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        )}
        <span className="text-muted-foreground">
          {lastVisit
            ? `Visited ${timeAgo(lastVisit.visited_at)}`
            : 'Not visited yet'}
        </span>
      </div>

      <div className="mt-2">
        <NiyyahBadges visit={lastVisit} />
      </div>
    </Card>
  )
}
