# Plan: Jaula Address Book Web App

## Context

Jamaat Tabligh members do a weekly activity called "jaula" (ghast) — visiting Muslim brothers in a neighbourhood to invite them closer to the deen. The core friction: unless someone from the local area is present, the team has no way to know which houses to visit. This app centralises that knowledge so any visiting Jamaat member can pull up the Muslim brothers' addresses for any area, along with the full tabligh health picture of that masjid.

**Scope**: MVP targets halqa/local level (single or few masjids). Architecture is designed to expand to national level (country → city → masjid) without a rewrite.

---

## Masjid Data Source

No external API provides tabligh-specific masjid data (5 aamaal, responsible brothers, ulama count, etc.). Approach:

- **Hybrid entry**: When an admin adds a masjid, a search box queries OpenStreetMap Nominatim (free, no billing) to auto-fill name, address, and lat/lng coordinates.
- All tabligh-specific fields are entered manually by the Area Admin.
- Zero dependence on an external API for ongoing operation — coordinates are stored in our own database after the one-time lookup.

---

## User Roles (3-tier)

| Role | What they can do |
|---|---|
| **Super Admin** | Manages entire platform; appoints Area Admins; manages masjids |
| **Area Admin** | Manages one masjid's data; approves/links local members; updates masjid health data |
| **Member** | Self-registers (email verified); can VIEW immediately; can ADD/LOG after Area Admin links them |

---

## Core Entities & Data Model

### Countries / Cities (for national scale)
```
countries: id, name, code
cities: id, name, country_id
```

### Masjid
```
masjids:
  id, name, address, area, city_id,
  lat, lng,                             -- auto-filled via OSM Nominatim
  created_by, created_at, is_active
```

### Masjid Tabligh Health (maintained by Area Admin)

**5 Aamaal status**
```
masjid_aamaal:
  masjid_id,
  has_taleem (bool),
  has_mushwara (bool),
  has_local_jaula (bool),
  has_neighbouring_jaula (bool),
  has_daily_dawah (bool),               -- daily giving time to masjid
  has_monthly_3days (bool),
  updated_at, updated_by
```

**Ulama & Lady Taleem**
```
masjid_info:
  masjid_id,
  ulama_count (int),
  ulama_spent_4_months (int),
  ulama_spent_1_year (int),
  lady_taleem_locations (int),          -- 0 = not happening, >0 = number of places
  updated_at, updated_by
```

**Responsible Brothers** (linked to Brothers already in the database)
```
masjid_responsible:
  id, masjid_id, brother_id,
  role: (amir | 3days | 40days | 4months | alim | other),
  notes,
  created_at
```

A brother can have multiple roles (e.g., spent both 40 days and 4 months).

### User
```
users:
  id, name, email, phone,
  role: (super_admin | area_admin | member),
  masjid_id,
  is_email_verified, is_approved,
  created_at
```

### Brother (Address Entry)
```
brothers:
  id, name, address_line, landmark, masjid_id,
  phone, notes,
  status: (active | moved | unavailable),
  added_by, created_at, updated_at
```

### Visit Log
```
visits:
  id, brother_id, visited_by, visited_at,
  notes,                                -- message for the next visitor
  niyyah_3days (bool),
  niyyah_40days (bool),
  niyyah_4months (bool),
  niyyah_ijtema (bool),
  niyyah_local_gasht (bool),
  created_at
```

"Potential sathi" = has any niyyah field set to true. The most recent visit's niyyah state is displayed as badges on the brother's card.

---

## Masjid Detail Page

Sections displayed when a masjid is selected:

### 1. 5 Aamaal Status
Visual checklist — green tick or red cross for each:
- Taleem
- Mushwara
- Jaula (local masjid)
- Jaula (neighbouring masjid)
- Daily giving time to masjid (daily dawah)
- 3 days monthly

### 2. Responsible Brothers
- **Amir** of the area
- Brothers who have spent **3 days / 40 days / 4 months** in jamaat (labelled)
- **Ulama present**: total count, how many spent 4 months, how many spent 1 year

### 3. Lady Taleem
"Happening in X locations" — or "Not yet started" if 0.

### 4. Brothers List (Address Book)
Each card shows:
- Name + address (tap → Google Maps)
- Phone (tap → call)
- Latest niyyah badges (3 days / 40 days / 4 months / ijtema)
- Last visited: X days ago

---

## Key User Flows

### Jaula Day (most common)
1. Open app → select masjid
2. View masjid dashboard (5 aamaal + responsible brothers + Lady Taleem)
3. Scroll to brothers list → tap a brother
4. Log a visit: notes + niyyah checkboxes

### Adding a Brother
1. Tap "Add Brother"
2. Name, address, landmark, masjid (pre-selected), phone, notes
3. Appears immediately in the list

### Admin — Update Masjid Health
Area Admin edits 5 aamaal checklist, ulama counts, Lady Taleem count, responsible brothers.

---

## Access Control

| Action | Unauth | Member (unlinked) | Member (linked) | Area Admin | Super Admin |
|---|---|---|---|---|---|
| View masjid list | ✓ | ✓ | ✓ | ✓ | ✓ |
| View masjid dashboard & addresses | ✗ | ✓ read-only | ✓ | ✓ | ✓ |
| Add brother / log visit | ✗ | ✗ | ✓ | ✓ | ✓ |
| Edit masjid health data | ✗ | ✗ | ✗ | ✓ (own) | ✓ |
| Approve members / manage masjids | ✗ | ✗ | ✗ | ✓ (own) | ✓ |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Hosting | Vercel + Supabase |
| Masjid geo-search | OpenStreetMap Nominatim (free, no API key) |
| Navigation | Google Maps / Apple Maps deep links |

---

## MVP Screens (Phase 1)

1. Auth: Register, Login, Email verify, Request masjid link
2. Home: Masjid list with search
3. Masjid Detail: Dashboard + brothers list
4. Brother Detail: Full info + visit history
5. Add Brother form
6. Log Visit form (notes + niyyah checkboxes)
7. Admin panel: Manage masjids, approve members, update health data

## Phase 2 (National Scale)
- Country → City → Masjid hierarchy
- Map view of masjids
- Urdu language toggle
- PWA / offline support
- Push notifications
- Export visit report

---

## Verification Plan

1. Register → verify email → confirm read-only state before admin links
2. Area Admin links user → confirm ADD permission works
3. Add masjid via Nominatim search → confirm coordinates saved
4. Fill 5 aamaal + ulama data → confirm shows on masjid dashboard
5. Add a brother → confirm appears in list under correct masjid
6. Log a visit with niyyah → confirm badge shows on brother card
7. Test on 375px mobile → all tap targets reachable
8. Test as unauthenticated → confirm no addresses visible
9. Tap address → opens Google Maps with correct pin
