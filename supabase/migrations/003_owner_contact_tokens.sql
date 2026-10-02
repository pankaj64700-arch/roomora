-- Subscription/token protected owner-contact unlock.
-- Business pricing remains configurable through subscription_plans and the token ledger.

create or replace function public.get_my_token_balance()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(amount), 0)::integer
  from public.token_ledger
  where user_id = auth.uid();
$$;

create or replace function public.unlock_owner_contact(
  requested_owner_id uuid,
  requested_room_id uuid,
  requested_token_cost integer default 1
)
returns public.owner_contact_unlocks
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_unlock public.owner_contact_unlocks;
  created_unlock public.owner_contact_unlocks;
  current_balance integer;
  room_owner uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if requested_token_cost <= 0 then raise exception 'invalid token cost'; end if;
  if requested_owner_id = auth.uid() then raise exception 'cannot contact yourself'; end if;

  select owner_id into room_owner from public.rooms
  where id = requested_room_id and status = 'published';
  if room_owner is null then raise exception 'room not found'; end if;
  if room_owner <> requested_owner_id then raise exception 'owner does not match room'; end if;

  select * into existing_unlock from public.owner_contact_unlocks
  where requester_id = auth.uid() and owner_id = requested_owner_id and room_id = requested_room_id;
  if existing_unlock.id is not null then return existing_unlock; end if;

  if not exists (
    select 1 from public.subscriptions
    where user_id = auth.uid() and status = 'active'
      and (ends_at is null or ends_at > now())
  ) then
    raise exception 'active subscription required';
  end if;

  select coalesce(sum(amount), 0)::integer into current_balance
  from public.token_ledger where user_id = auth.uid();
  if current_balance < requested_token_cost then raise exception 'not enough tokens'; end if;

  insert into public.token_ledger(user_id, amount, reason, reference_id)
  values (auth.uid(), -requested_token_cost, 'owner_contact_unlock', requested_room_id);

  insert into public.owner_contact_unlocks(requester_id, owner_id, room_id, token_cost)
  values (auth.uid(), requested_owner_id, requested_room_id, requested_token_cost)
  returning * into created_unlock;

  return created_unlock;
end;
$$;

revoke all on function public.get_my_token_balance() from public;
grant execute on function public.get_my_token_balance() to authenticated;
revoke all on function public.unlock_owner_contact(uuid, uuid, integer) from public;
grant execute on function public.unlock_owner_contact(uuid, uuid, integer) to authenticated;
