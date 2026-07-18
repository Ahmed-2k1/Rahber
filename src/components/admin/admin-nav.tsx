'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * The tab strip under the admin header. Which tabs appear is decided
 * by the server layout (permission checks) and passed in as booleans;
 * this component only adds the active-tab styling.
 */
export function AdminNav({
  showMembers,
  showMasjids,
}: {
  showMembers: boolean
  showMasjids: boolean
}) {
  const pathname = usePathname()

  const tabs = [
    { href: '/admin', label: 'Home', show: true, exact: true },
    { href: '/admin/members', label: 'Members', show: showMembers, exact: false },
    { href: '/admin/masjids', label: 'Masjids', show: showMasjids, exact: false },
  ]

  return (
    <nav className="flex gap-1 border-b px-4 text-sm">
      {tabs
        .filter((t) => t.show)
        .map((t) => {
          const active = t.exact
            ? pathname === t.href
            : pathname.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 transition-colors',
                active
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </Link>
          )
        })}
    </nav>
  )
}
