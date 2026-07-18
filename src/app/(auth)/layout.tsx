/**
 * Shared frame for the login / register / verify-email pages: a single
 * centred column on the warm cream background.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      {children}
    </main>
  )
}
