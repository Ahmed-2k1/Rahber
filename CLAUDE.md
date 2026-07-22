# Rahber — Jaula Address Book

A mobile-first web app for Jamaat Tabligh members to find and manage Muslim brothers' addresses during jaula (ghast). Brothers are organised by their nearest masjid. Each masjid page also shows the tabligh health of that area (5 aamaal, responsible brothers, Lady Taleem status, ulama count).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, JWT) |
| Hosting | Vercel + Supabase |
| Masjid geo-search | OpenStreetMap Nominatim (free, no key needed) |
| Navigation | Deep links → Google Maps / Apple Maps |

---

## Commands

```bash
npm run dev        # Start local dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint check
```

For Supabase local dev:
```bash
npx supabase start        # Start local Supabase stack (Docker required)
npx supabase db push      # Push migrations to remote
npx supabase gen types typescript --local > src/lib/database.types.ts
```

---

## Project Structure

```
src/
  app/                     # Next.js App Router pages
    (auth)/                # Auth group: login, register, verify-email
    masjids/               # Masjid list (home)
    masjids/[id]/          # Masjid detail (dashboard + brothers list)
    brothers/[id]/         # Brother detail + visit history
    brothers/[id]/visit/   # Log visit form
    brothers/new/          # Add brother form
    admin/                 # Admin panel (super_admin + area_admin)
      masjids/             # Manage masjids
      members/             # Approve/link members
  components/
    ui/                    # shadcn/ui primitives (auto-generated, do not edit)
    masjid/                # MasjidCard, AamaalChecklist, ResponsibleBrothers
    brother/               # BrotherCard, NiyyahBadges, VisitHistory
    admin/                 # Admin panel components
    shared/                # Layout, Navbar, SearchInput
  lib/
    supabase/
      client.ts            # Browser Supabase client
      server.ts            # Server-side Supabase client (cookies)
      middleware.ts        # Session refresh + route protection (used by src/middleware.ts)
    actions/               # Server actions (brothers, visits, masjids, health, members, auth)
    types.ts               # App-level TypeScript types
    # database.types.ts not yet generated — run:
    # npx supabase gen types typescript --local > src/lib/database.types.ts
  middleware.ts            # Route protection based on auth + role
supabase/
  migrations/              # SQL migration files (sequential)
planning/
  plan.md                  # Full system design and data model
```

---

## Database Schema (PostgreSQL via Supabase)

### Core tables

```sql
-- Geographic hierarchy (for national scale)
countries (id, name, code)
cities (id, name, country_id)

-- Masjids
masjids (id, name, address, area, city_id, lat, lng, created_by, created_at, is_active)

-- Users (extends Supabase auth.users)
profiles (
  id uuid references auth.users,
  name, phone,
  role: super_admin | area_admin | member,
  masjid_id,          -- which masjid they belong to
  is_approved bool,   -- set by area_admin after linking
  created_at
)

-- Brothers (address entries)
brothers (id, name, address_line, landmark, masjid_id, phone, notes,
          status: active | moved | unavailable, added_by, created_at, updated_at)

-- 5 Aamaal (one row per masjid)
masjid_aamaal (
  masjid_id,
  has_taleem, has_mushwara, has_local_jaula,
  has_neighbouring_jaula, has_daily_dawah, has_monthly_3days,
  updated_at, updated_by
)

-- Ulama & Lady Taleem (one row per masjid)
masjid_info (
  masjid_id,
  ulama_count, ulama_spent_4_months, ulama_spent_1_year,
  lady_taleem_locations,   -- 0 = not happening
  updated_at, updated_by
)

-- Responsible brothers (many roles per brother per masjid)
masjid_responsible (id, masjid_id, brother_id,
  role: amir | 3days | 40days | 4months | alim | other,
  notes, created_at)

-- Visit log
visits (
  id, brother_id, visited_by, visited_at, notes,
  niyyah_3days, niyyah_40days, niyyah_4months,
  niyyah_ijtema, niyyah_local_gasht,  -- all bool
  created_at
)
```

---

## User Roles & Access

| Role | Can do |
|---|---|
| `super_admin` | Full platform control; appoints area admins; manages masjids |
| `area_admin` | Manages one masjid: brothers, health data, member approvals |
| `member` (linked) | Add brothers, log visits, view all data |
| `member` (unlinked) | View masjid list + read-only dashboards only |
| Unauthenticated | View masjid list only — no addresses |

Role is stored in `profiles.role`. Supabase Row Level Security (RLS) enforces all access rules at the database layer. Middleware enforces it at the route layer.

---

## Key Patterns & Conventions

### Supabase client usage
- Use `src/lib/supabase/server.ts` in Server Components and API routes
- Use `src/lib/supabase/client.ts` only in Client Components
- Never expose the service role key to the browser

### Route protection
`middleware.ts` redirects unauthenticated users away from authenticated routes (`masjids/`, `brothers/`, `admin/`, etc. — these are not grouped under an `(app)` folder) and checks `profiles.role` for admin routes.

### Mobile-first UI
- All layouts are single-column by default, expand on `md:` and above
- Minimum tap target: 44×44px (use `min-h-11 min-w-11` or `p-3`)
- Address and phone fields are `<a>` tags (maps deep link / `tel:` link), not plain text

### Maps deep link format
```ts
const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`
```
Opens the native maps app on both iOS and Android.

### Niyyah badges
A "potential sathi" is a brother with at least one niyyah field true in their latest visit. Display as coloured pill badges: `3 days`, `40 days`, `4 months`, `Ijtema`, `Local Gasht`.

### OSM Nominatim (masjid geo-search)
```ts
const res = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
  { headers: { 'User-Agent': 'Rahber/1.0 (ahmeduddinyasar@gmail.com)' } }
)
```
Always include a `User-Agent` header with contact info — required by Nominatim's usage policy.

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server only — never expose to browser
```

---

## Supabase Setup Notes

- Enable Email Auth in Supabase dashboard (Auth → Providers → Email)
- Create a `profiles` table trigger on `auth.users` insert to auto-create profile rows
- Enable RLS on all tables; write policies per role before going to production
- `supabase/migrations/` must stay sequential — never edit old migration files
