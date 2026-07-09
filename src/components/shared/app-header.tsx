import Link from 'next/link'
import { ArrowLeft, UserPlus, Shield } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

/**
 * The bar across the top of every logged-in page. Shows an optional
 * back arrow, a title, optional "add brother" / admin buttons, and a
 * sign-out button.
 */
export function AppHeader({
  title,
  backHref,
  showAddBrother = false,
  showAdmin = false,
}: {
  title: string
  backHref?: string
  showAddBrother?: boolean
  showAdmin?: boolean
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-w-0 items-center gap-1">
        {backHref && (
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href={backHref} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <span className="truncate text-lg font-semibold">{title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showAdmin && (
          <Button asChild variant="ghost" size="icon" aria-label="Admin">
            <Link href="/admin">
              <Shield className="h-5 w-5" />
            </Link>
          </Button>
        )}
        {showAddBrother && (
          <Button asChild variant="ghost" size="icon" aria-label="Add brother">
            <Link href="/brothers/new">
              <UserPlus className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  )
}
