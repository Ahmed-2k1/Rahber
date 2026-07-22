import { AccessDenied } from '@/components/shared/access-denied'
import { MasjidForm } from '@/components/admin/masjid-form'
import { getMyPermissions } from '@/lib/permissions'

export default async function NewMasjidPage() {
  const perms = await getMyPermissions()

  if (!perms.canManageMasjids) {
    return (
      <div className="p-4">
        <AccessDenied masjidId={perms.masjidId} />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-base font-semibold">Add a masjid</h2>
      <MasjidForm />
    </div>
  )
}
