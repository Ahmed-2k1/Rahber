'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addBrother } from '@/lib/actions/brothers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

export interface MasjidOption {
  id: number
  name: string
  area: string | null
}

/**
 * Form to add a brother.
 *
 * - When opened from a masjid page, `fixedMasjid` is set: that masjid is
 *   locked in and the form saves in one step.
 * - When opened globally, the user picks the masjid from a dropdown and,
 *   before saving, sees a "please double-check" review screen.
 */
export function BrotherForm({
  masjids,
  fixedMasjid,
}: {
  masjids: MasjidOption[]
  fixedMasjid?: MasjidOption | null
}) {
  const router = useRouter()
  const requireReview = !fixedMasjid

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [masjidId, setMasjidId] = useState<string>(
    fixedMasjid ? String(fixedMasjid.id) : ''
  )

  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chosenMasjid =
    fixedMasjid ?? masjids.find((m) => String(m.id) === masjidId) ?? null

  /** Validate the fields; returns an error string or null if all good. */
  function validate(): string | null {
    if (!name.trim()) return 'Please enter the brother’s name.'
    if (!address.trim()) return 'Please enter an address.'
    if (!masjidId) return 'Please choose a masjid.'
    return null
  }

  /** First button press: either go to the review screen or save directly. */
  function handleContinue() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    if (requireReview) {
      setReviewing(true)
    } else {
      void save()
    }
  }

  async function save() {
    setSubmitting(true)
    setError(null)
    const result = await addBrother({
      name,
      address_line: address,
      landmark,
      phone,
      notes,
      masjid_id: Number(masjidId),
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      setReviewing(false) // let them fix and try again
      return
    }
    router.push(`/masjids/${result.masjidId}`)
    router.refresh()
  }

  // ---- Review screen (global add only) ---------------------------------
  if (reviewing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Please double-check the details below before saving.
        </p>
        <Card>
          <CardContent className="space-y-3 pt-6 text-sm">
            <ReviewRow label="Name" value={name} />
            <ReviewRow label="Address" value={address} />
            {landmark.trim() && (
              <ReviewRow label="Landmark" value={landmark} />
            )}
            {phone.trim() && <ReviewRow label="Phone" value={phone} />}
            {notes.trim() && <ReviewRow label="Notes" value={notes} />}
            <ReviewRow
              label="Masjid"
              value={chosenMasjid?.name ?? '—'}
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setReviewing(false)}
            disabled={submitting}
          >
            Go back &amp; edit
          </Button>
          <Button
            className="flex-1"
            onClick={save}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Confirm &amp; save'}
          </Button>
        </div>
      </div>
    )
  }

  // ---- Entry form ------------------------------------------------------
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House / street / area"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="landmark">Landmark (optional)</Label>
        <Input
          id="landmark"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="Near the green gate, opposite the shop…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything useful for the next visitor"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Masjid</Label>
        {fixedMasjid ? (
          <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
            {fixedMasjid.name}
          </div>
        ) : (
          <Select value={masjidId} onValueChange={setMasjidId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose the nearest masjid" />
            </SelectTrigger>
            <SelectContent>
              {masjids.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                  {m.area ? ` — ${m.area}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={handleContinue}
        disabled={submitting}
      >
        {requireReview
          ? 'Continue'
          : submitting
            ? 'Saving…'
            : 'Add brother'}
      </Button>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="flex-1 whitespace-pre-wrap font-medium">{value}</span>
    </div>
  )
}
