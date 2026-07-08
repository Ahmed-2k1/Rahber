-- ============================================================
-- Rahber — Security rules (Row Level Security)
-- Locks every table and defines who may read/write each one.
-- ============================================================

-- ------------------------------------------------------------
-- 1. "Who am I?" helper functions
-- ------------------------------------------------------------
-- These read the logged-in user's role/masjid. They are
-- SECURITY DEFINER (they run with owner privileges) so that when
-- a lock on the profiles table asks "what's this user's role?",
-- it can peek at profiles WITHOUT triggering its own lock again
-- (which would cause an endless loop).

create or replace function public.get_my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_masjid()
returns bigint language sql stable security definer set search_path = public as $$
  select masjid_id from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(is_approved, false) from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 2. When a masjid is created, auto-make its blank health rows
-- ------------------------------------------------------------
-- So the 5-aamaal and info rows always exist and admins only ever
-- EDIT them (never have to create them by hand).
create or replace function public.handle_new_masjid()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.masjid_aamaal (masjid_id) values (new.id);
  insert into public.masjid_info (masjid_id) values (new.id);
  return new;
end;
$$;

create trigger on_masjid_created
  after insert on masjids
  for each row execute function public.handle_new_masjid();

-- ------------------------------------------------------------
-- 3. Guard against privilege escalation on profiles
-- ------------------------------------------------------------
-- Stops a normal member from changing their own role to admin,
-- or approving themselves. Backend/admin actions (where there is
-- no logged-in user, e.g. the SQL editor) are trusted and skipped.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_role user_role;
  actor_masjid bigint;
begin
  if auth.uid() is null then
    return new;  -- backend/admin context (SQL editor, service key) — trusted
  end if;

  select role, masjid_id into actor_role, actor_masjid
    from public.profiles where id = auth.uid();
  actor_role := coalesce(actor_role, 'member');

  -- Only a super admin may change someone's role
  if new.role is distinct from old.role and actor_role <> 'super_admin' then
    raise exception 'Only a super admin can change a user role';
  end if;

  -- Only a super admin, or the area admin of that member's masjid,
  -- may flip the is_approved flag
  if new.is_approved is distinct from old.is_approved
     and actor_role <> 'super_admin'
     and not (actor_role = 'area_admin' and actor_masjid = old.masjid_id) then
    raise exception 'Only an admin of this masjid can approve members';
  end if;

  return new;
end;
$$;

create trigger protect_profile_columns_trg
  before update on profiles
  for each row execute function public.protect_profile_columns();

-- ------------------------------------------------------------
-- 4. Turn the locks ON for every table
-- ------------------------------------------------------------
alter table countries          enable row level security;
alter table cities             enable row level security;
alter table masjids            enable row level security;
alter table profiles           enable row level security;
alter table brothers           enable row level security;
alter table masjid_aamaal      enable row level security;
alter table masjid_info        enable row level security;
alter table masjid_responsible enable row level security;
alter table visits             enable row level security;

-- ------------------------------------------------------------
-- 5. The keys (policies)
-- ------------------------------------------------------------

-- Countries: everyone can read; only super admin can change
create policy "countries read all" on countries for select using (true);
create policy "countries write super" on countries for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

-- Cities: same as countries
create policy "cities read all" on cities for select using (true);
create policy "cities write super" on cities for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

-- Masjids: everyone can read the list; super admin adds/removes,
-- area admin edits their own masjid
create policy "masjids read all" on masjids for select using (true);
create policy "masjids insert super" on masjids for insert
  with check (get_my_role() = 'super_admin');
create policy "masjids update admins" on masjids for update
  using (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and id = get_my_masjid()))
  with check (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and id = get_my_masjid()));
create policy "masjids delete super" on masjids for delete
  using (get_my_role() = 'super_admin');

-- Profiles: you can see your own; admins can see their people
create policy "profiles read" on profiles for select using (
  id = auth.uid()
  or get_my_role() = 'super_admin'
  or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
);
create policy "profiles insert self" on profiles for insert
  with check (id = auth.uid());
create policy "profiles update" on profiles for update using (
  id = auth.uid()
  or get_my_role() = 'super_admin'
  or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
) with check (
  id = auth.uid()
  or get_my_role() = 'super_admin'
  or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
);

-- Brothers: any logged-in user can read; approved users add;
-- the author or an admin can edit; admins delete
create policy "brothers read authed" on brothers for select
  using (auth.uid() is not null);
create policy "brothers insert approved" on brothers for insert
  with check (
    added_by = auth.uid()
    and (get_my_approved() or get_my_role() in ('area_admin','super_admin'))
  );
create policy "brothers update owner/admin" on brothers for update
  using (added_by = auth.uid()
         or get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()))
  with check (added_by = auth.uid()
         or get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()));
create policy "brothers delete admin" on brothers for delete
  using (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()));

-- Visits: logged-in users read; approved users log a visit;
-- the visitor or a super admin can edit/delete
create policy "visits read authed" on visits for select
  using (auth.uid() is not null);
create policy "visits insert approved" on visits for insert
  with check (
    visited_by = auth.uid()
    and (get_my_approved() or get_my_role() in ('area_admin','super_admin'))
  );
create policy "visits update owner/admin" on visits for update
  using (visited_by = auth.uid() or get_my_role() = 'super_admin')
  with check (visited_by = auth.uid() or get_my_role() = 'super_admin');
create policy "visits delete owner/admin" on visits for delete
  using (visited_by = auth.uid() or get_my_role() = 'super_admin');

-- Masjid 5 aamaal: logged-in users read; only admins edit
create policy "aamaal read authed" on masjid_aamaal for select
  using (auth.uid() is not null);
create policy "aamaal update admins" on masjid_aamaal for update
  using (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()))
  with check (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()));

-- Masjid info (ulama + lady taleem): same as aamaal
create policy "info read authed" on masjid_info for select
  using (auth.uid() is not null);
create policy "info update admins" on masjid_info for update
  using (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()))
  with check (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()));

-- Responsible brothers: logged-in users read; admins manage
create policy "responsible read authed" on masjid_responsible for select
  using (auth.uid() is not null);
create policy "responsible write admins" on masjid_responsible for all
  using (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()))
  with check (get_my_role() = 'super_admin'
         or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid()));
