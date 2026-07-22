'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/actions/brothers'
import { friendlyError } from '@/lib/actions/errors'

/**
 * Admin actions for masjids. Adding a masjid is super-admin only; an
 * area admin may edit their own. Row Level Security enforces the same
 * rules at the database, so these checks are defense in depth.
 */

export interface PlaceResult {
  label: string
  address: string
  lat: number
  lng: number
}

/**
 * Search OpenStreetMap (Nominatim) for a place. This runs on the server
 * so we can send the User-Agent header their usage policy requires — a
 * browser isn't allowed to set that header.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const q = query.trim()
  if (q.length < 3) return []

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&format=json&limit=5&addressdetails=0`,
      {
        headers: {
          'User-Agent': 'Rahber/1.0 (ahmeduddinyasar@gmail.com)',
          'Accept-Language': 'en',
        },
        // Don't cache aggressively; searches vary.
        cache: 'no-store',
      }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as {
      display_name: string
      lat: string
      lon: string
    }[]
    return rows.map((r) => ({
      label: r.display_name,
      address: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }))
  } catch {
    return []
  }
}

async function callerRole() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null as null }
  const { data: me } = await supabase
    .from('profiles')
    .select('role, masjid_id')
    .eq('id', user.id)
    .single()
  return {
    supabase,
    user,
    role: (me?.role ?? null) as 'super_admin' | 'area_admin' | 'member' | null,
    masjidId: me?.masjid_id ?? null,
  }
}

export interface MasjidInput {
  name: string
  address?: string | null
  area?: string | null
  lat?: number | null
  lng?: number | null
}

export async function createMasjid(
  input: MasjidInput
): Promise<ActionResult<{ masjidId: number }>> {
  const { supabase, user, role } = await callerRole()
  if (role !== 'super_admin' || !user) {
    return { ok: false, error: 'Only a super admin can add a masjid.' }
  }
  if (!input.name?.trim()) return { ok: false, error: 'Please enter a name.' }

  const { data, error } = await supabase
    .from('masjids')
    .insert({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      area: input.area?.trim() || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }

  revalidatePath('/admin/masjids')
  revalidatePath('/')
  return { ok: true, masjidId: data.id }
}

export async function updateMasjid(
  id: number,
  input: MasjidInput
): Promise<ActionResult> {
  const { supabase, role } = await callerRole()
  if (role !== 'super_admin' && role !== 'area_admin') {
    return { ok: false, error: 'You don’t have permission to edit masjids.' }
  }
  if (!input.name?.trim()) return { ok: false, error: 'Please enter a name.' }

  const { error } = await supabase
    .from('masjids')
    .update({
      name: input.name.trim(),
      address: input.address?.trim() || null,
      area: input.area?.trim() || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
    })
    .eq('id', id)

  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }

  revalidatePath('/admin/masjids')
  revalidatePath(`/masjids/${id}`)
  revalidatePath('/')
  return { ok: true }
}

export async function setMasjidActive(
  id: number,
  active: boolean
): Promise<ActionResult> {
  const { supabase, role } = await callerRole()
  if (role !== 'super_admin') {
    return { ok: false, error: 'Only a super admin can do this.' }
  }
  const { error } = await supabase
    .from('masjids')
    .update({ is_active: active })
    .eq('id', id)
  if (error)
    return {
      ok: false,
      error: friendlyError(error, 'You don’t have permission to make this change.'),
    }

  revalidatePath('/admin/masjids')
  revalidatePath('/')
  return { ok: true }
}
