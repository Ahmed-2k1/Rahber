import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { PageShell } from '@/components/shared/page-shell'
import { AdminNav } from '@/components/admin/admin-nav'
import { getMyPermissions } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Wraps every /admin page. Second of three security guards, but unlike a
 * plain redirect, someone who's logged in but lacks admin access sees a
 * friendly "not authorized" message here instead of silently bouncing
 * back home — the door is visible, just locked. (First guard is the
 * middleware — logged-in-or-not only; the third is the database's Row
 * Level Security, the real authority either way.)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const perms = await getMyPermissions()
  if (!perms.userId) redirect('/login')

  if (!perms.canEnterAdmin) {
    return (
      <PageShell>
        <AppHeader title="Admin" backHref="/masjids" />
        <div className="p-4">
          <AccessDenied masjidId={perms.masjidId} />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <AppHeader title="Admin" backHref="/masjids" />
      <AdminNav
        showMembers={perms.canApproveMembers}
        showMasjids={perms.canManageMasjids || perms.canEditHealth}
      />
      {children}
    </PageShell>
  )
}

/** The "locked door" message shown to anyone without admin access. */
async function AccessDenied({ masjidId }: { masjidId: number | null }) {
  let contact: { name: string; phone: string | null } | null = null

  if (masjidId) {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('masjid_id', masjidId)
      .eq('role', 'area_admin')
      .limit(1)
      .maybeSingle()
    contact = data
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>You don&apos;t have access to this page</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        {contact ? (
          <p>
            Please contact{' '}
            <span className="font-medium text-foreground">{contact.name}</span>,
            your masjid&apos;s admin
            {contact.phone && (
              <>
                {' '}
                at{' '}
                <a href={`tel:${contact.phone}`} className="text-primary">
                  {contact.phone}
                </a>
              </>
            )}
            !
          </p>
        ) : (
          <p>Please contact your masjid&apos;s admin!</p>
        )}
      </CardContent>
    </Card>
  )
}
