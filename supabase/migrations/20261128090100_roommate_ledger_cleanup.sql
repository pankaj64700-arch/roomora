create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text, 'roommate_ledger_cleanup')
where not exists (select 1 from vault.secrets where name = 'roommate_ledger_cleanup');

create function public.finance_cleanup_batch(p_token text) returns text[]
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

  -- Use the Storage API for bytes. Retrying the next run also handles interrupted uploads.
  return array(
    select o.name from storage.objects o
    where o.bucket_id = 'finance-receipts'
      and o.created_at < statement_timestamp() - interval '1 day'
      and not exists (select 1 from public.finance_expenses e where e.receipt_path = o.name)
    order by o.created_at, o.name limit 500
  );
end;
$$;

revoke execute on function public.finance_cleanup_batch(text) from public, anon, authenticated;
grant execute on function public.finance_cleanup_batch(text) to service_role;

create schema if not exists finance_internal;
revoke all on schema finance_internal from public, anon, authenticated;

create function finance_internal.schedule_cleanup(p_project_url text) returns bigint
language sql set search_path = '' as $$
  select cron.schedule('roommate-ledger-cleanup', '*/15 * * * *', format(
    $job$select net.http_post(
      url := %L,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-roomora-cleanup-token',
        (select decrypted_secret from vault.decrypted_secrets where name = 'roommate_ledger_cleanup')),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    )$job$, rtrim(p_project_url, '/') || '/functions/v1/finance-ledger-cleanup'
  ));
$$;
revoke execute on function finance_internal.schedule_cleanup(text) from public, anon, authenticated;
