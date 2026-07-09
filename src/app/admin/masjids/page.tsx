import Link from 'next/link'
import { Plus, Pencil, MapPin, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMyPermissions } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Masjid } from '@/lib/types'

export default async function AdminMasjidsPage() {
  const supabase = createClient()
  const perms = await getMyPermissions()
  const isSuper = perms.role === 'super_admin'

  const { data } = await supabase
    .from('masjids')
    .select('id, name, area, is_active')
    .order('name')
  const masjids = (data ?? []) as Pick<
    Masjid,
    'id' | 'name' | 'area' | 'is_active'
  >[]

  return (
    <div className="space-y-3 p-4">
      {isSuper && (
        <Button asChild className="w-full">
          <Link href="/admin/masjids/new">
            <Plus className="h-4 w-4" /> Add masjid
          </Link>
        </Button>
      )}

      {masjids.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No masjids yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {masjids.map((m) => {
            const mine = m.id === perms.masjidId
            // Editing masjid details needs an admin role; editing health
            // data can also be a delegated power.
            const canEditDetails =
              isSuper || (perms.role === 'area_admin' && mine)
            const canEditHealth = isSuper || (perms.canEditHealth && mine)
            const showActions = canEditDetails || canEditHealth
            return (
              <li key={m.id}>
                <Card className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate font-medium">
                        {m.name}
                        {!m.is_active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </p>
                      {m.area && (
                        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {m.area}
                        </p>
                      )}
                    </div>
                    {showActions && (
                      <div className="flex shrink-0 gap-2">
                        {canEditHealth && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/masjids/${m.id}/health`}>
                              <Activity className="h-4 w-4" /> Health
                            </Link>
                          </Button>
                        )}
                        {canEditDetails && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/masjids/${m.id}/edit`}>
                              <Pencil className="h-4 w-4" /> Edit
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
