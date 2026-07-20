-- ============================================================
-- Rahber — Bootstrap super admin by email
-- ============================================================
-- Whoever signs up using this specific email always becomes the
-- app's super_admin, regardless of how many other admins already
-- exist. Only this exact address can trigger it — everyone else
-- still gets the normal unapproved 'member' profile.
--
-- This email is the app's permanent owner identity: if the account
-- is ever deleted and signed up again, it always regains
-- super_admin, so the owner can never be locked out of their own
-- app by another admin or a lost/recreated account.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  bootstrap_email constant text := 'ahmeduddin2201@gmail.com';
  assign_role user_role := 'member';
  assign_approved boolean := false;
begin
  if new.email = bootstrap_email then
    assign_role := 'super_admin';
    assign_approved := true;
  end if;

  insert into public.profiles (id, name, phone, role, is_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Member'),
    new.raw_user_meta_data->>'phone',
    assign_role,
    assign_approved
  );
  return new;
end;
$$;
