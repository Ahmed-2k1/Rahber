-- ============================================================
-- Rahber — Delegated permissions
-- Lets an admin grant narrow, individual powers to a trusted
-- member (instead of handing out the whole area_admin role):
--   * can_approve_members — approve/revoke members for their masjid
--   * can_edit_health     — edit that masjid's 5 aamaal / info /
--                           responsible brothers
-- Every rule below is enforced in the database so it holds even if
-- someone bypasses the app. Guardrails baked in:
--   - nobody can grant themselves powers (self-escalation blocked);
--   - a delegate cannot grant powers to others (no re-delegation);
--   - powers only apply to the person's own masjid.
-- ============================================================

-- ------------------------------------------------------------
-- 1. New permission switches on each profile
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists can_approve_members boolean not null default false,
  add column if not exists can_edit_health     boolean not null default false;

-- ------------------------------------------------------------
-- 2. "What can I do?" helper functions (SECURITY DEFINER, like
--    the existing get_my_role / get_my_masjid helpers)
-- ------------------------------------------------------------
create or replace function public.get_my_can_approve()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(can_approve_members, false)
    from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_can_edit_health()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(can_edit_health, false)
    from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 3. Let approvers update the right profile rows
-- ------------------------------------------------------------
-- Replace the profiles UPDATE policy so that an area admin OR a
-- delegate with approve permission can update members who are in
-- their masjid or not yet linked to any masjid — but the row must
-- END UP in their masjid (they can't move members elsewhere).
drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles for update
using (
  id = auth.uid()
  or get_my_role() = 'super_admin'
  or (
    (get_my_role() = 'area_admin' or get_my_can_approve())
    and (masjid_id = get_my_masjid() or masjid_id is null)
  )
)
with check (
  id = auth.uid()
  or get_my_role() = 'super_admin'
  or (
    (get_my_role() = 'area_admin' or get_my_can_approve())
    and masjid_id = get_my_masjid()
  )
);

-- ------------------------------------------------------------
-- 4. Extend the privilege-escalation guard for the new columns
-- ------------------------------------------------------------
-- Replaces the earlier version. Adds two rules:
--   * is_approved may now also be flipped by a delegate (approve
--     permission) for their own masjid;
--   * the capability columns may only be changed by a super admin
--     or the area admin of that member's masjid — never a delegate
--     (that stops the re-delegation chain) and never oneself unless
--     already an admin (self-escalation stays blocked).
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_role user_role;
  actor_masjid bigint;
  actor_can_approve boolean;
begin
  if auth.uid() is null then
    return new;  -- backend/admin context (SQL editor, service key) — trusted
  end if;

  select role, masjid_id, coalesce(can_approve_members, false)
    into actor_role, actor_masjid, actor_can_approve
    from public.profiles where id = auth.uid();
  actor_role := coalesce(actor_role, 'member');

  -- Only a super admin may change someone's role
  if new.role is distinct from old.role and actor_role <> 'super_admin' then
    raise exception 'Only a super admin can change a user role';
  end if;

  -- is_approved may be flipped by a super admin, by the area admin of
  -- the member's masjid, or by a delegate with approve permission for
  -- that masjid (scope checked against the resulting masjid).
  if new.is_approved is distinct from old.is_approved
     and actor_role <> 'super_admin'
     and not ((actor_role = 'area_admin' or actor_can_approve)
              and actor_masjid = new.masjid_id) then
    raise exception 'You are not allowed to approve members for this masjid';
  end if;

  -- Capability switches: only a super admin, or the area admin of the
  -- member's masjid. Delegates can never hand out capabilities.
  if (new.can_approve_members is distinct from old.can_approve_members
      or new.can_edit_health is distinct from old.can_edit_health)
     and actor_role <> 'super_admin'
     and not (actor_role = 'area_admin' and actor_masjid = new.masjid_id) then
    raise exception 'Only an admin of this masjid can change permissions';
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 5. Let health-data editing honour can_edit_health
-- ------------------------------------------------------------
drop policy if exists "aamaal update admins" on public.masjid_aamaal;
create policy "aamaal update admins" on public.masjid_aamaal for update
  using (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
    or (get_my_can_edit_health() and masjid_id = get_my_masjid())
  )
  with check (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
    or (get_my_can_edit_health() and masjid_id = get_my_masjid())
  );

drop policy if exists "info update admins" on public.masjid_info;
create policy "info update admins" on public.masjid_info for update
  using (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
    or (get_my_can_edit_health() and masjid_id = get_my_masjid())
  )
  with check (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
    or (get_my_can_edit_health() and masjid_id = get_my_masjid())
  );

drop policy if exists "responsible write admins" on public.masjid_responsible;
create policy "responsible write admins" on public.masjid_responsible for all
  using (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
    or (get_my_can_edit_health() and masjid_id = get_my_masjid())
  )
  with check (
    get_my_role() = 'super_admin'
    or (get_my_role() = 'area_admin' and masjid_id = get_my_masjid())
    or (get_my_can_edit_health() and masjid_id = get_my_masjid())
  );
