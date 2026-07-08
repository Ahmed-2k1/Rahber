-- ============================================================
-- Rahber — Initial database schema
-- Creates every table (shelf) the app needs.
-- ============================================================

-- --- Fixed lists of allowed values (called "enums") ---------
-- Instead of letting anyone type any text, we lock these fields
-- to a known set of options so the data stays clean.

create type user_role as enum ('super_admin', 'area_admin', 'member');
create type brother_status as enum ('active', 'moved', 'unavailable');
create type responsible_role as enum ('amir', '3days', '40days', '4months', 'alim', 'other');

-- --- Countries (top of the geographic hierarchy) -------------
create table countries (
  id bigint generated always as identity primary key,
  name text not null,
  code text not null unique,          -- e.g. 'IN', 'US'
  created_at timestamptz not null default now()
);

-- --- Cities (belong to a country) ----------------------------
create table cities (
  id bigint generated always as identity primary key,
  name text not null,
  country_id bigint not null references countries(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- --- Masjids (the anchor everything is grouped under) --------
create table masjids (
  id bigint generated always as identity primary key,
  name text not null,
  address text,
  area text,                          -- neighbourhood
  city_id bigint references cities(id) on delete set null,
  lat double precision,               -- filled from OSM Nominatim search
  lng double precision,
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- --- Profiles (extra info about each logged-in user) ---------
-- Supabase already stores the login (email/password) in a hidden
-- table called auth.users. This table adds OUR fields on top:
-- their name, role, and which masjid they belong to.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role user_role not null default 'member',
  masjid_id bigint references masjids(id) on delete set null,
  is_approved boolean not null default false,   -- area admin flips this on
  created_at timestamptz not null default now()
);

-- --- Brothers (the address entries — the heart of the app) ---
create table brothers (
  id bigint generated always as identity primary key,
  name text not null,
  address_line text not null,
  landmark text,
  masjid_id bigint not null references masjids(id) on delete cascade,
  phone text,
  notes text,
  status brother_status not null default 'active',
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Masjid 5 Aamaal (one row per masjid) --------------------
-- The health checklist of core tabligh activities.
create table masjid_aamaal (
  masjid_id bigint primary key references masjids(id) on delete cascade,
  has_taleem boolean not null default false,
  has_mushwara boolean not null default false,
  has_local_jaula boolean not null default false,
  has_neighbouring_jaula boolean not null default false,
  has_daily_dawah boolean not null default false,      -- daily giving time
  has_monthly_3days boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- --- Masjid Info (ulama counts + Lady Taleem) ----------------
create table masjid_info (
  masjid_id bigint primary key references masjids(id) on delete cascade,
  ulama_count int not null default 0,
  ulama_spent_4_months int not null default 0,
  ulama_spent_1_year int not null default 0,
  lady_taleem_locations int not null default 0,        -- 0 = not happening
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- --- Responsible brothers (amir, khurooj-doers, ulama) -------
-- Links an existing brother to a role at a masjid. One brother
-- can appear more than once (e.g. did both 40 days and 4 months).
create table masjid_responsible (
  id bigint generated always as identity primary key,
  masjid_id bigint not null references masjids(id) on delete cascade,
  brother_id bigint not null references brothers(id) on delete cascade,
  role responsible_role not null,
  notes text,
  created_at timestamptz not null default now()
);

-- --- Visits (a record each time someone is visited) ----------
-- The niyyah_* flags capture what intention the brother made.
create table visits (
  id bigint generated always as identity primary key,
  brother_id bigint not null references brothers(id) on delete cascade,
  visited_by uuid references auth.users(id) on delete set null,
  visited_at timestamptz not null default now(),
  notes text,                          -- message for the next visitor
  niyyah_3days boolean not null default false,
  niyyah_40days boolean not null default false,
  niyyah_4months boolean not null default false,
  niyyah_ijtema boolean not null default false,
  niyyah_local_gasht boolean not null default false,
  created_at timestamptz not null default now()
);

-- --- Indexes (make common lookups fast) ----------------------
-- An index is like the index at the back of a book: it lets the
-- database jump straight to the rows it needs instead of scanning
-- everything. We add them on the columns we filter by most.
create index idx_brothers_masjid on brothers(masjid_id);
create index idx_visits_brother on visits(brother_id);
create index idx_masjid_responsible_masjid on masjid_responsible(masjid_id);
create index idx_cities_country on cities(country_id);
create index idx_masjids_city on masjids(city_id);
