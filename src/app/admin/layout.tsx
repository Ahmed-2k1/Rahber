import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/shared/app-header'
import { getMyPermissions } from '@/lib/permissions'

/**
 * Wraps every /admin page. Second of three security guards: it runs on
 * the server and redirects anyone with no admin power. (First guard is
 * the middleware; the third is the database's Row Level Security.) The
 * nav only shows links the current person can actually use.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const perms = await getMyPermissions()
  if (!perms.userId) redirect('/login')
  if (!perms.canEnterAdmin) redirect('/')

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-16">
      <AppHeader title="Admin" backHref="/" />
      <nav className="flex gap-4 border-b px-4 py-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        {perms.canApproveMembers && (
          <Link
            href="/admin/members"
            className="text-muted-foreground hover:text-foreground"
          >
            Members
          </Link>
        )}
        {(perms.canManageMasjids || perms.canEditHealth) && (
          <Link
            href="/admin/masjids"
            className="text-muted-foreground hover:text-foreground"
          >
            Masjids
          </Link>
        )}
      </nav>
      {children}
    </div>
  )
}
