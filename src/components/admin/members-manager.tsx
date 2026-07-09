'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveMember, revokeMember } from '@/lib/actions/members'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface AdminMember {
  id: string
  name: string
  phone: string | null
  role: 'super_admin' | 'area_admin' | 'member'
  masjid_id: number | null
  is_approved: boolean
}

export interface MasjidOption {
  id: number
  name: string
}

export function MembersManager({
  members,
  masjids,
  canPromote,
}: {
  members: AdminMember[]
  masjids: MasjidOption[]
  canPromote: boolean
}) {
  const pending = members.filter((m) => !m.is_approved)
  const approved = members.filter((m) => m.is_approved)

  return (
    <div className="space-y-6 p-4">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Waiting for approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one is waiting.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((m) => (
              <li key={m.id}>
                <PendingRow
                  member={m}
                  masjids={masjids}
                  canPromote={canPromote}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Approved members ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {approved.map((m) => (
              <li key={m.id}>
                <ApprovedRow member={m} masjids={masjids} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PendingRow({
  member,
  masjids,
  canPromote,
}: {
  member: AdminMember
  masjids: MasjidOption[]
  canPromote: boolean
}) {
  const router = useRouter()
  const [masjidId, setMasjidId] = useState<string>(
    member.masjid_id ? String(member.masjid_id) : ''
  )
  const [makeAreaAdmin, setMakeAreaAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onApprove() {
    if (!masjidId) {
      setError('Choose a masjid first.')
      return
    }
    setBusy(true)
    setError(null)
    const res = await approveMember({
      profileId: member.id,
      masjidId: Number(masjidId),
      makeAreaAdmin,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div>
          <p className="font-medium">{member.name || 'Unnamed'}</p>
          {member.phone && (
            <p className="text-sm text-muted-foreground">{member.phone}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Link to masjid</Label>
          <Select value={masjidId} onValueChange={setMasjidId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a masjid" />
            </SelectTrigger>
            <SelectContent>
              {masjids.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canPromote && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={makeAreaAdmin}
              onCheckedChange={(c) => setMakeAreaAdmin(c === true)}
            />
            Make area admin of this masjid
          </label>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" onClick={onApprove} disabled={busy}>
          {busy ? 'Approving…' : 'Approve'}
        </Button>
      </CardContent>
    </Card>
  )
}

function ApprovedRow({
  member,
  masjids,
}: {
  member: AdminMember
  masjids: MasjidOption[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const masjidName =
    masjids.find((m) => m.id === member.masjid_id)?.name ?? '—'

  async function onRevoke() {
    setBusy(true)
    const res = await revokeMember(member.id)
    setBusy(false)
    if (res.ok) router.refresh()
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{member.name || 'Unnamed'}</p>
          <p className="truncate text-sm text-muted-foreground">
            {masjidName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {member.role !== 'member' && (
            <Badge variant="secondary">
              {member.role === 'super_admin' ? 'Super admin' : 'Area admin'}
            </Badge>
          )}
          {member.role !== 'super_admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRevoke}
              disabled={busy}
            >
              {busy ? '…' : 'Revoke'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
