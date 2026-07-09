import Link from 'next/link'
import { UserCheck, Building2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMyPermissions } from '@/lib/permissions'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminHomePage() {
  const supabase = createClient()
  const perms = await getMyPermissions()

  // Counts for the two main admin jobs. RLS scopes these to what the
  // current admin is allowed to see.
  const [{ count: pendingCount }, { count: masjidCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false),
    supabase
      .from('masjids')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const tiles = [
    perms.canApproveMembers && {
      href: '/admin/members',
      icon: UserCheck,
      title: 'Members',
      hint:
        (pendingCount ?? 0) > 0
          ? `${pendingCount} waiting for approval`
          : 'No one waiting for approval',
    },
    (perms.canManageMasjids || perms.canEditHealth) && {
      href: '/admin/masjids',
      icon: Building2,
      title: 'Masjids',
      hint: `${masjidCount ?? 0} active`,
    },
  ].filter(Boolean) as {
    href: string
    icon: typeof UserCheck
    title: string
    hint: string
  }[]

  return (
    <div className="space-y-3 p-4">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <t.icon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.hint}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
