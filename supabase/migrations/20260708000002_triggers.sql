-- ============================================================
-- Rahber — Automatic helpers (functions + triggers)
-- ============================================================

-- --- 1. Auto-create a profile when someone signs up ---------
-- When Supabase adds a new login to the hidden auth.users table,
-- this fires and creates a matching row in our profiles table,
-- copying the name/phone they typed on the signup form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Member'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- 2. Keep "updated_at" fresh automatically ---------------
-- Any time a brother row is changed, stamp the current time so we
-- always know when it was last touched — without the app having
-- to remember to do it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brothers_set_updated_at
  before update on brothers
  for each row execute function public.set_updated_at();
