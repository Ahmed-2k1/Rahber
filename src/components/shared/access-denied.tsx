import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * A locked-door message for anyone missing a required permission —
 * the page is visible, just not usable, instead of a silent redirect.
 * Names the masjid's area_admin (with a tel: link) as contact when
 * one can be resolved, else falls back to a generic line.
 */
export async function AccessDenied({
  masjidId,
  title = "You don't have access to this page",
}: {
  masjidId: number | null
  title?: string
}) {
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
        <CardTitle>{title}</CardTitle>
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
