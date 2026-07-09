'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import {
  updateAamaal,
  updateMasjidInfo,
  addResponsible,
  removeResponsible,
  type AamaalFlags,
} from '@/lib/actions/health'
import { AAMAAL_ITEMS, RESPONSIBLE_ROLE_LABELS } from '@/lib/format'
import type { ResponsibleRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AamaalKey = keyof AamaalFlags

export interface ResponsibleItem {
  id: number
  brother_id: number
  role: ResponsibleRole
  notes: string | null
  brotherName: string
}

export interface BrotherOption {
  id: number
  name: string
}

const ROLE_KEYS: ResponsibleRole[] = [
  'amir',
  'alim',
  '4months',
  '40days',
  '3days',
  'other',
]

export function HealthEditor({
  masjidId,
  aamaal,
  info,
  responsible,
  brothers,
}: {
  masjidId: number
  aamaal: AamaalFlags
  info: {
    ulama_count: number
    ulama_spent_4_months: number
    ulama_spent_1_year: number
    lady_taleem_locations: number
  }
  responsible: ResponsibleItem[]
  brothers: BrotherOption[]
}) {
  return (
    <div className="space-y-4">
      <AamaalCard masjidId={masjidId} initial={aamaal} />
      <InfoCard masjidId={masjidId} initial={info} />
      <ResponsibleCard
        masjidId={masjidId}
        items={responsible}
        brothers={brothers}
      />
    </div>
  )
}

function SavedNote({ show }: { show: boolean }) {
  if (!show) return null
  return <span className="text-sm text-primary">Saved ✓</span>
}

function AamaalCard({
  masjidId,
  initial,
}: {
  masjidId: number
  initial: AamaalFlags
}) {
  const [flags, setFlags] = useState<AamaalFlags>(initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await updateAamaal(masjidId, flags)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setSaved(true)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">5 Aamaal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {AAMAAL_ITEMS.map(({ key, label }) => {
            const k = key as AamaalKey
            return (
              <label
                key={k}
                className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={flags[k]}
                  onCheckedChange={(c) =>
                    setFlags((f) => ({ ...f, [k]: c === true }))
                  }
                />
                <span className="text-sm">{label}</span>
              </label>
            )
          })}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={busy} size="sm">
            {busy ? 'Saving…' : 'Save aamaal'}
          </Button>
          <SavedNote show={saved} />
        </div>
      </CardContent>
    </Card>
  )
}

function InfoCard({
  masjidId,
  initial,
}: {
  masjidId: number
  initial: {
    ulama_count: number
    ulama_spent_4_months: number
    ulama_spent_1_year: number
    lady_taleem_locations: number
  }
}) {
  const [values, setValues] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fields: { key: keyof typeof initial; label: string }[] = [
    { key: 'ulama_count', label: 'Ulama (total)' },
    { key: 'ulama_spent_4_months', label: 'Ulama who did 4 months' },
    { key: 'ulama_spent_1_year', label: 'Ulama who did 1 year' },
    { key: 'lady_taleem_locations', label: 'Lady taleem locations' },
  ]

  async function save() {
    setBusy(true)
    setError(null)
    setSaved(false)
    const res = await updateMasjidInfo(masjidId, values)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setSaved(true)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ulama &amp; Lady Taleem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <Label htmlFor={key} className="flex-1">
              {label}
            </Label>
            <Input
              id={key}
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: Number(e.target.value) }))
              }
              className="w-20"
            />
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={busy} size="sm">
            {busy ? 'Saving…' : 'Save info'}
          </Button>
          <SavedNote show={saved} />
        </div>
      </CardContent>
    </Card>
  )
}

function ResponsibleCard({
  masjidId,
  items,
  brothers,
}: {
  masjidId: number
  items: ResponsibleItem[]
  brothers: BrotherOption[]
}) {
  const router = useRouter()
  const [brotherId, setBrotherId] = useState('')
  const [role, setRole] = useState<ResponsibleRole>('amir')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    if (!brotherId) {
      setError('Choose a brother.')
      return
    }
    setBusy(true)
    setError(null)
    const res = await addResponsible(masjidId, Number(brotherId), role, notes)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setBrotherId('')
    setNotes('')
    router.refresh()
  }

  async function remove(id: number) {
    const res = await removeResponsible(masjidId, id)
    if (res.ok) router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Responsible brothers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current assignments */}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None assigned yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
              >
                <Badge variant="secondary" className="shrink-0">
                  {RESPONSIBLE_ROLE_LABELS[r.role]}
                </Badge>
                <span className="flex-1 truncate">
                  {r.brotherName}
                  {r.notes && (
                    <span className="text-muted-foreground"> · {r.notes}</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(r.id)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new */}
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Assign a brother</p>
          {brothers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add brothers to this masjid first.
            </p>
          ) : (
            <>
              <Select value={brotherId} onValueChange={setBrotherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a brother" />
                </SelectTrigger>
                <SelectContent>
                  {brothers.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={role}
                onValueChange={(v) => setRole(v as ResponsibleRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_KEYS.map((rk) => (
                    <SelectItem key={rk} value={rk}>
                      {RESPONSIBLE_ROLE_LABELS[rk]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note, e.g. time spent (optional)"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={add} disabled={busy} size="sm" className="w-full">
                {busy ? 'Adding…' : 'Add'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
