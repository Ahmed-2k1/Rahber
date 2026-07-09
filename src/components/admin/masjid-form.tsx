'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Loader2 } from 'lucide-react'
import {
  searchPlaces,
  createMasjid,
  updateMasjid,
  type PlaceResult,
} from '@/lib/actions/masjids'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface MasjidFormValues {
  id?: number
  name: string
  address: string | null
  area: string | null
  lat: number | null
  lng: number | null
}

/**
 * Add or edit a masjid. The search box queries OpenStreetMap; picking a
 * result fills in the name, address and map coordinates, which you can
 * then adjust before saving.
 */
export function MasjidForm({ initial }: { initial?: MasjidFormValues }) {
  const router = useRouter()
  const editing = Boolean(initial?.id)

  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null)
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch() {
    if (query.trim().length < 3) {
      setError('Type at least 3 letters to search.')
      return
    }
    setSearching(true)
    setError(null)
    const found = await searchPlaces(query)
    setSearching(false)
    setResults(found)
    if (found.length === 0) setError('No places found. Try a different search.')
  }

  function pick(place: PlaceResult) {
    // Use the first part of the OSM name as a sensible default masjid name.
    if (!name.trim()) setName(place.label.split(',')[0] ?? '')
    setAddress(place.address)
    setLat(place.lat)
    setLng(place.lng)
    setResults([])
    setQuery('')
  }

  async function save() {
    setSaving(true)
    setError(null)
    const values = { name, address, area, lat, lng }
    const res = editing
      ? await updateMasjid(initial!.id!, values)
      : await createMasjid(values)
    setSaving(false)

    if (!res.ok) {
      setError(res.error)
      return
    }
    router.push('/admin/masjids')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* OpenStreetMap search */}
      <div className="space-y-1.5">
        <Label htmlFor="search">Search for the masjid on the map</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="e.g. Masjid Al-Noor, Preston"
          />
          <Button
            type="button"
            variant="outline"
            onClick={runSearch}
            disabled={searching}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <ul className="mt-1 space-y-1 rounded-md border bg-popover p-1">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Editable fields */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masjid name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address ?? ''}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full address"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="area">Area / neighbourhood (optional)</Label>
        <Input
          id="area"
          value={area ?? ''}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Short area name shown in the list"
        />
      </div>

      {lat != null && lng != null && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Coordinates saved: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : editing ? 'Save changes' : 'Add masjid'}
      </Button>
    </div>
  )
}
