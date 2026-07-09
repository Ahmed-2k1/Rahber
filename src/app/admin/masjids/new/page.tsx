import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MasjidForm } from '@/components/admin/masjid-form'

export default async function NewMasjidPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Adding a masjid is super-admin only.
  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()
  if (me?.role !== 'super_admin') redirect('/admin/masjids')

  return (
    <div className="p-4">
      <h2 className="mb-4 text-base font-semibold">Add a masjid</h2>
      <MasjidForm />
    </div>
  )
}
