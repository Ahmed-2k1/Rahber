import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/shared/app-header'
import { PageShell } from '@/components/shared/page-shell'
import { AdminNav } from '@/components/admin/admin-nav'
import { AccessDenied } from '@/components/shared/access-denied'
import { getMyPermissions } from '@/lib/permissions'

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
