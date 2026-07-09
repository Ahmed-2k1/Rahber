import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import type { UserRole } from '@/lib/types'

/**
 * Wraps every /admin page. Second of three security guards: it runs on
 * the server and redirects anyone who isn't an admin. (First guard is
 * the middleware; the third is the database's Row Level Security.)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as UserRole | undefined
  if (role !== 'super_admin' && role !== 'area_admin') redirect('/')

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-16">
      <AppHeader title="Admin" backHref="/" />
      <nav className="flex gap-4 border-b px-4 py-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <Link
          href="/admin/members"
          className="text-muted-foreground hover:text-foreground"
        >
          Members
        </Link>
        <Link
          href="/admin/masjids"
          className="text-muted-foreground hover:text-foreground"
        >
          Masjids
        </Link>
      </nav>
      {children}
    </div>
  )
}
