create table public.finance_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  owner_id uuid not null references auth.users(id),
  invite_token uuid not null unique default gen_random_uuid()
);

create table public.finance_members (
  room_id uuid not null references public.finance_rooms(id),
  user_id uuid not null references auth.users(id),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index finance_members_user_idx on public.finance_members (user_id);

create table public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  payer_id uuid not null,
  amount_paise integer not null check (amount_paise between 1 and 100000000),
  spent_on date not null,
  remark text not null check (char_length(btrim(remark)) between 1 and 240),
  receipt_path text unique,
  created_at timestamptz not null default now(),
  foreign key (room_id, payer_id) references public.finance_members(room_id, user_id)
);

create index finance_expenses_room_idx on public.finance_expenses (room_id, spent_on desc, created_at desc);

create table public.finance_shares (
  expense_id uuid not null references public.finance_expenses(id),
  user_id uuid not null references auth.users(id),
  approved boolean,
  primary key (expense_id, user_id)
);

alter table public.finance_rooms enable row level security;
alter table public.finance_members enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.finance_shares enable row level security;
revoke all on public.finance_rooms, public.finance_members, public.finance_expenses, public.finance_shares
  from public, anon, authenticated;

create function public.finance_create_room(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_room uuid;
begin
  insert into public.finance_rooms (name, owner_id)
  values (btrim(p_name), auth.uid()) returning id into v_room;
  insert into public.finance_members (room_id, user_id) values (v_room, auth.uid());
  return v_room;
end;
$$;

create function public.finance_join_room(p_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_room uuid;
begin
  select id into v_room from public.finance_rooms where invite_token = p_token for update;
  if v_room is null then raise exception 'This invitation is invalid or has been replaced.'; end if;
  insert into public.finance_members (room_id, user_id) values (v_room, auth.uid())
  on conflict do nothing;
  return v_room;
end;
$$;

create function public.finance_rotate_invite(p_room uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.finance_rooms set invite_token = gen_random_uuid()
  where id = p_room and owner_id = auth.uid();
  if not found then raise exception 'Only the room creator can replace the invitation.'; end if;
end;
$$;

create function public.finance_list_rooms() returns table (id uuid, name text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.name from public.finance_rooms r join public.finance_members m on m.room_id = r.id
  where m.user_id = auth.uid() order by m.joined_at;
$$;

create function public.finance_room_details(p_room uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.finance_members where room_id = p_room and user_id = auth.uid()) then
    raise exception 'You must join this room first.';
  end if;
  return jsonb_build_object(
    'invite_token', (select invite_token from public.finance_rooms where id = p_room and owner_id = auth.uid()),
    'members', (select jsonb_agg(jsonb_build_object('id', m.user_id,
      'name', coalesce(nullif(btrim(p.display_name), ''), 'Roommate')) order by m.joined_at, m.user_id)
      from public.finance_members m left join public.profiles p on p.id = m.user_id where m.room_id = p_room),
    'expenses', (select coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object('shares',
      (select jsonb_agg(to_jsonb(s) - 'expense_id' order by s.user_id)
       from public.finance_shares s where s.expense_id = e.id))
      order by e.spent_on desc, e.created_at desc, e.id), '[]'::jsonb)
      from public.finance_expenses e where e.room_id = p_room)
  );
end;
$$;

create function public.finance_add_expense(
  p_id uuid, p_room uuid, p_amount_paise integer, p_spent_on date, p_remark text, p_receipt_path text
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  if not exists (select 1 from public.finance_members where room_id = p_room and user_id = auth.uid()) then
    raise exception 'You must join this room first.';
  end if;
  perform id from public.finance_rooms where id = p_room for update;
  if exists (select 1 from public.finance_expenses
    where id = p_id and room_id = p_room and payer_id = auth.uid()) then return; end if;
  select count(*) into v_count from public.finance_members where room_id = p_room;
  if v_count < 2 then raise exception 'At least two roommates must join before you can log an expense.'; end if;
  if p_receipt_path is not null and (
    p_receipt_path <> auth.uid()::text || '/' || p_room::text || '/' || p_id::text
    or not exists (select 1 from storage.objects where bucket_id = 'finance-receipts' and name = p_receipt_path)
  ) then raise exception 'The receipt upload could not be verified.'; end if;

  insert into public.finance_expenses (id, room_id, payer_id, amount_paise, spent_on, remark, receipt_path)
  values (p_id, p_room, auth.uid(), p_amount_paise, p_spent_on, btrim(p_remark), p_receipt_path);

  insert into public.finance_shares (expense_id, user_id, approved)
  select p_id, m.user_id, case when m.user_id = auth.uid() then true end
  from public.finance_members m where m.room_id = p_room;
end;
$$;

create function public.finance_vote(p_expense uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_payer uuid;
begin
  select e.payer_id into v_payer from public.finance_expenses e
  join public.finance_shares s on s.expense_id = e.id and s.user_id = auth.uid()
  where e.id = p_expense for update of e;
  if v_payer is null or v_payer = auth.uid() or p_approve is null then
    raise exception 'Only the other roommates on this expense can review it.';
  end if;
  if exists (select 1 from public.finance_shares where expense_id = p_expense and approved = false) then
    raise exception 'This expense has already been declined.';
  end if;
  update public.finance_shares set approved = p_approve
  where expense_id = p_expense and user_id = auth.uid() and approved is null;
  if not found then raise exception 'You have already reviewed this expense.'; end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('finance-receipts', 'finance-receipts', false, 10485760,
  array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm']);

create function public.finance_receipt_allowed(p_path text, p_action text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case p_action
    when 'upload' then exists (
      select 1 from public.finance_members m where m.user_id = auth.uid()
        and p_path ~ ('^' || m.user_id::text || '/' || m.room_id::text || '/[0-9a-f-]{36}$')
    )
    when 'read' then exists (
      select 1 from public.finance_expenses e join public.finance_members m on m.room_id = e.room_id
      where e.receipt_path = p_path and m.user_id = auth.uid()
    )
    else false end;
$$;

create policy finance_receipts_upload on storage.objects for insert to authenticated
with check (bucket_id = 'finance-receipts' and public.finance_receipt_allowed(name, 'upload'));
create policy finance_receipts_read on storage.objects for select to authenticated
using (bucket_id = 'finance-receipts' and public.finance_receipt_allowed(name, 'read'));

revoke execute on function public.finance_create_room(text), public.finance_join_room(uuid),
  public.finance_rotate_invite(uuid), public.finance_list_rooms(), public.finance_room_details(uuid),
  public.finance_add_expense(uuid, uuid, integer, date, text, text), public.finance_vote(uuid, boolean),
  public.finance_receipt_allowed(text, text) from public, anon;
grant execute on function public.finance_create_room(text), public.finance_join_room(uuid),
  public.finance_rotate_invite(uuid), public.finance_list_rooms(), public.finance_room_details(uuid),
  public.finance_add_expense(uuid, uuid, integer, date, text, text), public.finance_vote(uuid, boolean),
  public.finance_receipt_allowed(text, text) to authenticated;
