'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logVisit } from '@/lib/actions/visits'
import { NIYYAH_LABELS } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

// The five niyyah checkboxes live in a small map of key -> checked.
type NiyyahKey = (typeof NIYYAH_LABELS)[number]['key']

/**
 * Form to log a visit to a brother: a note for the next visitor, plus
 * checkboxes for any intentions (niyyah) the brother showed.
 */
export function VisitForm({ brotherId }: { brotherId: number }) {
  const router = useRouter()

  const [notes, setNotes] = useState('')
  const [niyyah, setNiyyah] = useState<Record<NiyyahKey, boolean>>(() =>
    Object.fromEntries(NIYYAH_LABELS.map(({ key }) => [key, false])) as Record<
      NiyyahKey,
      boolean
    >
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(key: NiyyahKey, checked: boolean) {
    setNiyyah((prev) => ({ ...prev, [key]: checked }))
  }

  async function save() {
    setSubmitting(true)
    setError(null)
    const result = await logVisit({
      brother_id: brotherId,
      notes,
      niyyah_3days: niyyah.niyyah_3days,
      niyyah_40days: niyyah.niyyah_40days,
      niyyah_4months: niyyah.niyyah_4months,
      niyyah_ijtema: niyyah.niyyah_ijtema,
      niyyah_local_gasht: niyyah.niyyah_local_gasht,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push(`/brothers/${brotherId}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="notes">Note for the next visitor (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How the visit went, what to follow up on…"
        />
      </div>

      <div className="space-y-2">
        <Label>Any niyyah he showed?</Label>
        <div className="space-y-1">
          {NIYYAH_LABELS.map(({ key, label }) => (
            <label
              key={key}
              htmlFor={key}
              className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/50"
            >
              <Checkbox
                id={key}
                checked={niyyah[key as NiyyahKey]}
                onCheckedChange={(c) => toggle(key as NiyyahKey, c === true)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/brothers/${brotherId}`)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save visit'}
        </Button>
      </div>
    </div>
  )
}
