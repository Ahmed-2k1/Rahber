import { cn } from '@/lib/utils'

/**
 * The single-column mobile shell every page sits in. Centralised here
 * so the width/padding rhythm stays identical across the app.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto min-h-dvh max-w-md pb-16', className)}>
      {children}
    </div>
  )
}
