import { Check, X } from 'lucide-react'
import { AAMAAL_ITEMS } from '@/lib/format'
import type { MasjidAamaal } from '@/lib/types'

/**
 * The 5-aamaal health checklist: a green tick for each activity that is
 * happening, a faded cross for those that are not.
 */
export function AamaalChecklist({ aamaal }: { aamaal: MasjidAamaal | null }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {AAMAAL_ITEMS.map(({ key, label }) => {
        const on = aamaal ? Boolean(aamaal[key]) : false
        return (
          <div key={String(key)} className="flex items-center gap-2 text-sm">
            {on ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" />
              </span>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground/60" />
              </span>
            )}
            <span className={on ? 'font-medium' : 'text-muted-foreground'}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
