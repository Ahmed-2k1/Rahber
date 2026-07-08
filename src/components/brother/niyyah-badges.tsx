import { Badge } from '@/components/ui/badge'
import { niyyahList } from '@/lib/format'
import type { Visit } from '@/lib/types'

/**
 * Shows the niyyah (intention) a brother made on their latest visit,
 * as small green pills. Renders nothing if there are none.
 */
export function NiyyahBadges({ visit }: { visit: Visit | null | undefined }) {
  const labels = niyyahList(visit)
  if (labels.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <Badge
          key={label}
          variant="outline"
          className="border-primary/30 bg-primary/5 text-primary"
        >
          {label}
        </Badge>
      ))}
    </div>
  )
}
