import type { Visit, MasjidAamaal, ResponsibleRole } from '@/lib/types'

/** Build a Google Maps link that opens the address in the phone's maps app. */
export function mapsUrl(address: string, landmark?: string | null): string {
  const query = [address, landmark].filter(Boolean).join(', ')
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
}

/** "just now", "3 days ago", "2 months ago" — a friendly relative time. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const seconds = Math.floor((Date.now() - then) / 1000)

  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]

  let value = seconds
  let unit = 'second'
  for (const [size, name] of units) {
    if (value < size) {
      unit = name
      break
    }
    value = Math.floor(value / size)
    unit = name
  }

  if (unit === 'second' && value < 30) return 'just now'
  const rounded = Math.max(1, value)
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`
}

/** The five niyyah flags, as readable labels, for a given visit. */
export const NIYYAH_LABELS: { key: keyof Visit; label: string }[] = [
  { key: 'niyyah_3days', label: '3 days' },
  { key: 'niyyah_40days', label: '40 days' },
  { key: 'niyyah_4months', label: '4 months' },
  { key: 'niyyah_ijtema', label: 'Ijtema' },
  { key: 'niyyah_local_gasht', label: 'Local gasht' },
]

/** Extract the active niyyah labels from a visit (empty if none). */
export function niyyahList(visit: Visit | null | undefined): string[] {
  if (!visit) return []
  return NIYYAH_LABELS.filter(({ key }) => visit[key] === true).map(
    ({ label }) => label
  )
}

/** The five (well, six) aamaal, as readable labels + their column. */
export const AAMAAL_ITEMS: { key: keyof MasjidAamaal; label: string }[] = [
  { key: 'has_taleem', label: 'Taleem' },
  { key: 'has_mushwara', label: 'Mushwara' },
  { key: 'has_local_jaula', label: 'Jaula (local masjid)' },
  { key: 'has_neighbouring_jaula', label: 'Jaula (neighbouring)' },
  { key: 'has_daily_dawah', label: 'Daily dawah' },
  { key: 'has_monthly_3days', label: '3 days monthly' },
]

/** Human-friendly labels for responsible-brother roles. */
export const RESPONSIBLE_ROLE_LABELS: Record<ResponsibleRole, string> = {
  amir: 'Amir',
  '3days': '3 days',
  '40days': '40 days',
  '4months': '4 months',
  alim: 'Alim',
  other: 'Other',
}
