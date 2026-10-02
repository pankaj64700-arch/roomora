-- RoomOra authentication/profile hardening.
-- Roles are assigned through controlled SECURITY DEFINER functions instead of direct client updates.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Prevent normal users from changing role/admin flags through the table directly.
drop policy if exists "profiles own update" on public.profiles;
create policy "admins update profiles" on public.profiles
for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.set_initial_profile(
  requested_tenant boolean,
  requested_owner boolean,
  requested_shop boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if requested_tenant and requested_owner then
    raise exception 'tenant and owner roles are mutually exclusive';
  end if;

  -- Admin is never self-assignable.
  update public.profiles
  set is_tenant = requested_tenant,
      is_owner = requested_owner,
      is_shop = requested_shop,
      updated_at = now()
  where id = auth.uid() and is_admin = false
  returning * into result;

  if result.id is null then
    raise exception 'profile could not be initialized';
  end if;

  return result;
end;
$$;

create or replace function public.update_my_profile(
  new_display_name text,
  new_phone text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set display_name = nullif(trim(new_display_name), ''),
      phone = nullif(trim(new_phone), ''),
      updated_at = now()
  where id = auth.uid()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.set_initial_profile(boolean, boolean, boolean) from public;
grant execute on function public.set_initial_profile(boolean, boolean, boolean) to authenticated;
revoke all on function public.update_my_profile(text, text) from public;
grant execute on function public.update_my_profile(text, text) to authenticated;
