import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { AAMAAL_ITEMS } from '@/lib/format'
import type { MasjidListItem } from '@/components/masjid/masjid-browser'

const AAMAAL_TOTAL = AAMAAL_ITEMS.length

/**
 * One masjid row in the home list. The card "lights" its mihrab
 * corner in gold only when every aamaal is running — the app-wide
 * signal for healthy tabligh engagement.
 */
export function MasjidCard({ masjid }: { masjid: MasjidListItem }) {
  const complete = masjid.aamaalCount === AAMAAL_TOTAL

  return (
    <Link href={`/masjids/${masjid.id}`} className="block">
      <Card
        lit={complete}
        className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{masjid.name}</p>
          {masjid.area && (
            <p className="truncate text-sm text-muted-foreground">
              {masjid.area}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
              {masjid.brotherCount}{' '}
              {masjid.brotherCount === 1 ? 'brother' : 'brothers'}
            </span>
            <p
              className={`mt-1 text-xs tabular-nums ${
                complete
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {masjid.aamaalCount}/{AAMAAL_TOTAL} aamaal
            </p>
          </div>
          <ChevronRight
            className={`h-4 w-4 ${
              complete ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
        </div>
      </Card>
    </Link>
  )
}
