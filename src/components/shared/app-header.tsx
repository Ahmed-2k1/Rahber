'use client'

import Link from 'next/link'
import { ArrowLeft, UserPlus, Shield } from 'lucide-react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

/**
 * The bar across the top of every logged-in page.
 *
 * With `heroTitle`, the page renders its own large in-flow <h1> and
 * this sticky title stays hidden until the hero scrolls away, then
 * fades in — the iOS large-title pattern. Without it, the title is
 * always visible. Either way the gold hairline under the header
 * strengthens slightly as the page scrolls.
 */
export function AppHeader({
  title,
  backHref,
  showAddBrother = false,
  showAdmin = false,
  heroTitle = false,
}: {
  title: string
  backHref?: string
  showAddBrother?: boolean
  showAdmin?: boolean
  heroTitle?: boolean
}) {
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()

  const titleOpacity = useTransform(scrollY, [40, 90], [0, 1])
  const titleY = useTransform(scrollY, [40, 90], [4, 0])
  const hairlineOpacity = useTransform(scrollY, [0, 80], [0.2, 0.5])

  const animate = !reduced

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-w-0 items-center gap-1">
        {backHref && (
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href={backHref} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        {heroTitle && animate ? (
          <motion.span
            className="truncate text-lg font-semibold"
            style={{ opacity: titleOpacity, y: titleY }}
          >
            {title}
          </motion.span>
        ) : (
          <span className="truncate text-lg font-semibold">{title}</span>
        )}
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
      {animate ? (
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gold"
          style={{ opacity: hairlineOpacity }}
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gold/20"
        />
      )}
    </header>
  )
}
