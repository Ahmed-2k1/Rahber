'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveMember,
  revokeMember,
  updatePermissions,
} from '@/lib/actions/members'
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
  can_approve_members: boolean
  can_edit_health: boolean
}

export interface MasjidOption {
  id: number
  name: string
}

export function MembersManager({
  members,
  masjids,
  canGrant,
  canPromote,
}: {
  members: AdminMember[]
  masjids: MasjidOption[]
  /** Whether the current admin may hand out powers / revoke. */
  canGrant: boolean
  /** Whether the current admin may promote to area_admin (super only). */
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
                  canGrant={canGrant}
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
                <ApprovedRow member={m} masjids={masjids} canGrant={canGrant} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/** The three switches an admin can hand out, shown as checkboxes. */
function PermissionChecks({
  canApproveMembers,
  canEditHealth,
  onChange,
}: {
  canApproveMembers: boolean
  canEditHealth: boolean
  onChange: (next: { canApproveMembers: boolean; canEditHealth: boolean }) => void
}) {
  return (
    <div className="space-y-1">
      <label className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked disabled />
        Add brothers &amp; log visits
        <span className="text-xs">(included)</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={canApproveMembers}
          onCheckedChange={(c) =>
            onChange({ canApproveMembers: c === true, canEditHealth })
          }
        />
        Approve new members
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={canEditHealth}
          onCheckedChange={(c) =>
            onChange({ canApproveMembers, canEditHealth: c === true })
          }
        />
        Edit health data
      </label>
    </div>
  )
}

function PendingRow({
  member,
  masjids,
  canGrant,
  canPromote,
}: {
  member: AdminMember
  masjids: MasjidOption[]
  canGrant: boolean
  canPromote: boolean
}) {
  const router = useRouter()
  const [masjidId, setMasjidId] = useState<string>(
    member.masjid_id ? String(member.masjid_id) : ''
  )
  const [perms, setPerms] = useState({
    canApproveMembers: false,
    canEditHealth: false,
  })
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
      canApproveMembers: perms.canApproveMembers,
      canEditHealth: perms.canEditHealth,
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

        {canGrant && (
          <div className="space-y-1.5">
            <Label>What can this person do?</Label>
            <PermissionChecks
              canApproveMembers={perms.canApproveMembers}
              canEditHealth={perms.canEditHealth}
              onChange={setPerms}
            />
          </div>
        )}

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
  canGrant,
}: {
  member: AdminMember
  masjids: MasjidOption[]
  canGrant: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [perms, setPerms] = useState({
    canApproveMembers: member.can_approve_members,
    canEditHealth: member.can_edit_health,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const masjidName = masjids.find((m) => m.id === member.masjid_id)?.name ?? '—'
  const isAdminRole = member.role !== 'member'

  async function onSave() {
    setBusy(true)
    setError(null)
    const res = await updatePermissions({
      profileId: member.id,
      canApproveMembers: perms.canApproveMembers,
      canEditHealth: perms.canEditHealth,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setEditing(false)
    router.refresh()
  }

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
          <p className="truncate text-sm text-muted-foreground">{masjidName}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {member.role === 'super_admin' && (
            <Badge variant="secondary">Super admin</Badge>
          )}
          {member.role === 'area_admin' && (
            <Badge variant="secondary">Area admin</Badge>
          )}
          {member.role === 'member' && member.can_approve_members && (
            <Badge variant="outline">Approver</Badge>
          )}
          {member.role === 'member' && member.can_edit_health && (
            <Badge variant="outline">Health editor</Badge>
          )}
        </div>
      </div>

      {/* Admins can adjust a plain member's powers, or revoke access. */}
      {canGrant && !isAdminRole && (
        <div className="mt-2">
          {editing ? (
            <div className="space-y-2 rounded-md border p-2">
              <PermissionChecks
                canApproveMembers={perms.canApproveMembers}
                canEditHealth={perms.canEditHealth}
                onChange={setPerms}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditing(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={onSave}
                  disabled={busy}
                >
                  {busy ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                Edit permissions
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRevoke}
                disabled={busy}
              >
                {busy ? '…' : 'Revoke'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
