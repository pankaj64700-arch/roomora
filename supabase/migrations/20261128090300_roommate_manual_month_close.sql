create table public.finance_closed_months (
  room_id uuid not null references public.finance_rooms(id) on delete cascade,
  ledger_month date not null,
  closed_at timestamptz not null default statement_timestamp(),
  primary key (room_id, ledger_month)
);

alter table public.finance_closed_months enable row level security;
revoke all on public.finance_closed_months from public, anon, authenticated;

create function public.finance_close_month(p_room uuid, p_month date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform id from public.finance_rooms where id = p_room and owner_id = auth.uid() for update;
  if not found then raise exception 'Only the room owner can end the month.'; end if;
  if p_month is distinct from date_trunc('month', statement_timestamp() at time zone 'Asia/Kolkata')::date then
    raise exception 'This month has already ended. Refresh the ledger.';
  end if;
  insert into public.finance_closed_months (room_id, ledger_month)
  values (p_room, p_month) on conflict do nothing;
end;
$$;

revoke execute on function public.finance_close_month(uuid, date) from public, anon;
grant execute on function public.finance_close_month(uuid, date) to authenticated;

create or replace function public.finance_room_details(p_room uuid, p_month date default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_today date := (statement_timestamp() at time zone 'Asia/Kolkata')::date;
  v_current date := date_trunc('month', v_today::timestamp)::date;
  v_previous date := (v_current - interval '1 month')::date;
  v_next date := (v_current + interval '1 month')::date;
  v_joined timestamptz;
  v_month date;
begin
  select joined_at into v_joined from public.finance_members where room_id = p_room and user_id = auth.uid() and departed_at is null;
  if not found then raise exception 'You must join this room first.'; end if;
  if v_today >= v_current + 10 or v_joined >= (v_current::timestamp at time zone 'Asia/Kolkata') then
    v_previous := null;
  end if;

  v_month := case when p_month = v_previous then v_previous else v_current end;

  return jsonb_build_object(
    'month', v_month, 'current_month', v_current, 'previous_month', v_previous,
    'closed', v_month <> v_current or exists (
      select 1 from public.finance_closed_months where room_id = p_room and ledger_month = v_month),
    'today', v_today, 'server_now', statement_timestamp(),
    'refresh_at', case when v_previous is null
      then (v_next::timestamp at time zone 'Asia/Kolkata')
      else ((v_current + 10)::timestamp at time zone 'Asia/Kolkata') end,
    'archive_until', v_current + 9,
    'invite_token', (select invite_token from public.finance_rooms where id = p_room and owner_id = auth.uid()),
    'members', (select jsonb_agg(jsonb_build_object('id', m.user_id,
      'active', m.departed_at is null, 'name', coalesce(nullif(btrim(p.display_name), ''), 'Roommate')) order by m.joined_at, m.user_id)
      from public.finance_members m left join public.profiles p on p.id = m.user_id
      where m.room_id = p_room and m.joined_at < ((v_month + interval '1 month') at time zone 'Asia/Kolkata')
        and (m.departed_at is null or exists (
          select 1 from public.finance_shares s join public.finance_expenses e on e.id = s.expense_id
          where s.user_id = m.user_id and e.room_id = p_room and e.ledger_month = v_month
        ))),
    'expenses', (select coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object('shares',
      (select jsonb_agg(to_jsonb(s) - 'expense_id' order by s.user_id)
       from public.finance_shares s where s.expense_id = e.id))
      order by e.spent_on desc, e.created_at desc, e.id), '[]'::jsonb)
      from public.finance_expenses e where e.room_id = p_room and e.ledger_month = v_month)
  );
end;
$$;

create or replace function public.finance_add_expense(
  p_id uuid, p_room uuid, p_amount_paise integer, p_spent_on date, p_remark text, p_receipt_path text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
  v_today date := (statement_timestamp() at time zone 'Asia/Kolkata')::date;
begin
  perform id from public.finance_rooms where id = p_room for update;
  if not exists (select 1 from public.finance_members where room_id = p_room and user_id = auth.uid() and departed_at is null) then
    raise exception 'You must join this room first.';
  end if;
  if exists (select 1 from public.finance_expenses
    where id = p_id and room_id = p_room and payer_id = auth.uid()) then return; end if;
  if p_spent_on is null or p_spent_on < date_trunc('month', v_today::timestamp)::date or p_spent_on > v_today then
    raise exception 'Choose a date in the current month, up to today (India time).';
  end if;
  if exists (select 1 from public.finance_closed_months where room_id = p_room
    and ledger_month = date_trunc('month', v_today::timestamp)::date) then
    raise exception 'This month has been closed for entries.';
  end if;
  select count(*) into v_count from public.finance_members where room_id = p_room and departed_at is null;
  if v_count < 2 then raise exception 'At least two roommates must join before you can log an expense.'; end if;
  if p_receipt_path is not null and (
    p_receipt_path <> auth.uid()::text || '/' || p_room::text || '/' || p_id::text
    or not exists (select 1 from storage.objects where bucket_id = 'finance-receipts' and name = p_receipt_path)
  ) then raise exception 'The receipt upload could not be verified.'; end if;

  insert into public.finance_expenses (id, room_id, payer_id, amount_paise, spent_on, remark, receipt_path)
  values (p_id, p_room, auth.uid(), p_amount_paise, p_spent_on, btrim(p_remark), p_receipt_path);

  insert into public.finance_shares (expense_id, user_id, approved)
  select p_id, m.user_id, case when m.user_id = auth.uid() then true end
  from public.finance_members m where m.room_id = p_room and m.departed_at is null;
end;
$$;

create or replace function public.finance_vote(p_expense uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_room uuid;
  v_payer uuid;
  v_month date;
begin
  select e.room_id into v_room
  from public.finance_expenses e join public.finance_members m on m.room_id = e.room_id
  where e.id = p_expense and m.user_id = auth.uid() and m.departed_at is null;
  perform id from public.finance_rooms where id = v_room for update;
  select e.payer_id, e.ledger_month into v_payer, v_month from public.finance_expenses e
  join public.finance_shares s on s.expense_id = e.id and s.user_id = auth.uid()
  join public.finance_members m on m.room_id = e.room_id and m.user_id = s.user_id
  where e.id = p_expense and e.room_id = v_room and m.departed_at is null for update of e;
  if v_payer is null or v_payer = auth.uid() or p_approve is null then
    raise exception 'Only the other roommates on this expense can review it.';
  end if;
  if v_month <> date_trunc('month', statement_timestamp() at time zone 'Asia/Kolkata')::date
    or exists (select 1 from public.finance_closed_months where room_id = v_room and ledger_month = v_month) then
    raise exception 'Approvals closed at the end of this expense month.';
  end if;
  if exists (select 1 from public.finance_shares where expense_id = p_expense and approved = false) then
    raise exception 'This expense has already been declined.';
  end if;
  update public.finance_shares set approved = p_approve
  where expense_id = p_expense and user_id = auth.uid() and approved is null;
  if not found then raise exception 'You have already reviewed this expense.'; end if;
end;
$$;

create or replace function public.finance_remove_member(p_room uuid, p_member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.finance_rooms where id = p_room for update;
  if v_owner is null or auth.uid() is null
    or (auth.uid() <> v_owner and auth.uid() is distinct from p_member)
    or p_member is not distinct from v_owner then
    raise exception 'Only the room owner can remove another roommate.';
  end if;

  update public.finance_members set departed_at = statement_timestamp()
  where room_id = p_room and user_id = p_member and departed_at is null;
  if not found then raise exception 'This roommate has already left.'; end if;

  -- Keep approved expenses intact and close pending expenses that included the departing roommate.
  update public.finance_shares s set approved = false
  from public.finance_expenses e
  where e.id = s.expense_id and e.room_id = p_room and s.approved is null
    and e.ledger_month = date_trunc('month', statement_timestamp() at time zone 'Asia/Kolkata')::date
    and not exists (select 1 from public.finance_closed_months closed
      where closed.room_id = p_room and closed.ledger_month = e.ledger_month)
    and exists (select 1 from public.finance_shares participant
      where participant.expense_id = e.id and participant.user_id = p_member)
    and not exists (select 1 from public.finance_shares vote
      where vote.expense_id = e.id and vote.approved = false);

  update public.finance_rooms set invite_token = gen_random_uuid() where id = p_room;
end;
$$;

create or replace function public.finance_cleanup_batch(p_token text) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (statement_timestamp() at time zone 'Asia/Kolkata')::date;
  v_current date := date_trunc('month', v_today::timestamp)::date;
  v_keep_from date := case when v_today >= v_current + 10
    then v_current else (v_current - interval '1 month')::date end;
begin
  if not exists (select 1 from vault.decrypted_secrets
    where name = 'roommate_ledger_cleanup' and decrypted_secret = p_token)
  then raise sqlstate 'PT401' using message = 'Unauthorized'; end if;

  delete from public.finance_expenses where ledger_month < v_keep_from;
  delete from public.finance_closed_months where ledger_month < v_keep_from;

  -- Use the Storage API for bytes. Retrying the next run also handles interrupted uploads.
  return array(
    select o.name from storage.objects o
    where o.bucket_id = 'finance-receipts'
      and (o.created_at < statement_timestamp() - interval '1 day'
        or not exists (select 1 from public.finance_rooms r where r.id::text = split_part(o.name, '/', 2)))
      and not exists (select 1 from public.finance_expenses e where e.receipt_path = o.name)
    order by o.created_at, o.name limit 500
  );
end;
$$;
