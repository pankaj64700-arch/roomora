-- RoomOra subscription Stage 1: additive schema foundation.
-- Keep legacy subscriptions/token_ledger intact. No checkout is activated by this migration.
begin;

alter table public.subscription_plans
  add column if not exists description text,
  add column if not exists currency text not null default 'INR',
  add column if not exists monthly_listing_limit integer,
  add column if not exists monthly_bonus_tokens integer not null default 0,
  add column if not exists premium_features jsonb not null default '[]'::jsonb,
  add column if not exists feature_flags jsonb not null default '{}'::jsonb,
  add column if not exists phonepe_plan_id text;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_plans'::regclass and conname='subscription_plans_bonus_tokens_nonnegative') then
    alter table public.subscription_plans add constraint subscription_plans_bonus_tokens_nonnegative check (monthly_bonus_tokens >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_plans'::regclass and conname='subscription_plans_listing_limit_nonnegative') then
    alter table public.subscription_plans add constraint subscription_plans_listing_limit_nonnegative check (monthly_listing_limit is null or monthly_listing_limit >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_plans'::regclass and conname='subscription_plans_currency_inr') then
    alter table public.subscription_plans add constraint subscription_plans_currency_inr check (currency='INR');
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_plans'::regclass and conname='subscription_plans_premium_features_array') then
    alter table public.subscription_plans add constraint subscription_plans_premium_features_array check (jsonb_typeof(premium_features)='array');
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_plans'::regclass and conname='subscription_plans_feature_flags_object') then
    alter table public.subscription_plans add constraint subscription_plans_feature_flags_object check (jsonb_typeof(feature_flags)='object');
  end if;
end $$;

alter table public.user_subscriptions
  add column if not exists billing_provider text not null default 'manual',
  add column if not exists phonepe_subscription_id text,
  add column if not exists phonepe_customer_id text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists cancelled_at timestamptz,
  add column if not exists last_payment_at timestamptz,
  add column if not exists failed_payment_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.user_subscriptions'::regclass and conname='user_subscriptions_billing_provider_check') then
    alter table public.user_subscriptions add constraint user_subscriptions_billing_provider_check check (billing_provider in ('manual','phonepe'));
  end if;
end $$;

alter table public.user_subscriptions drop constraint if exists user_subscriptions_status_check;
alter table public.user_subscriptions add constraint user_subscriptions_status_check
  check (status = any (array['pending','active','past_due','cancel_at_period_end','cancelled','expired','halted']));
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.user_subscriptions'::regclass and conname='user_subscriptions_failed_payment_count_nonnegative') then
    alter table public.user_subscriptions add constraint user_subscriptions_failed_payment_count_nonnegative check (failed_payment_count >= 0);
  end if;
end $$;

create unique index if not exists user_subscriptions_phonepe_subscription_uidx on public.user_subscriptions(phonepe_subscription_id) where phonepe_subscription_id is not null;
create index if not exists user_subscriptions_user_status_period_idx on public.user_subscriptions(user_id,status,current_period_end desc);

create table if not exists public.subscription_payments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 user_subscription_id uuid references public.user_subscriptions(id) on delete set null,
 provider text not null default 'phonepe' check(provider='phonepe'),
 provider_payment_id text, provider_invoice_id text, provider_subscription_id text,
 amount_minor bigint not null check(amount_minor>=0),
 currency text not null default 'INR' check(currency='INR'),
 status text not null check(status=any(array['created','authorized','captured','failed','refunded','partially_refunded'])),
 paid_at timestamptz, failure_code text, failure_description text, raw_event_id text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists subscription_payments_provider_payment_uidx on public.subscription_payments(provider,provider_payment_id) where provider_payment_id is not null;
create unique index if not exists subscription_payments_provider_invoice_uidx on public.subscription_payments(provider,provider_invoice_id) where provider_invoice_id is not null;
create index if not exists subscription_payments_user_created_idx on public.subscription_payments(user_id,created_at desc);

create table if not exists public.subscription_webhook_events (
 id uuid primary key default gen_random_uuid(),
 provider text not null default 'phonepe' check(provider='phonepe'),
 provider_event_id text not null, event_type text not null,
 signature_valid boolean not null default false, payload jsonb not null,
 received_at timestamptz not null default now(), processed_at timestamptz, processing_error text,
 constraint subscription_webhook_events_provider_event_key unique(provider,provider_event_id)
);
create index if not exists subscription_webhook_events_unprocessed_idx on public.subscription_webhook_events(received_at) where processed_at is null;

create table if not exists public.subscription_token_grants (
 id uuid primary key default gen_random_uuid(),
 user_subscription_id uuid not null references public.user_subscriptions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 period_start timestamptz not null, period_end timestamptz not null,
 tokens_granted integer not null check(tokens_granted>=0),
 provider_invoice_id text,
 token_transaction_id uuid references public.token_transactions(id) on delete set null,
 created_at timestamptz not null default now(),
 constraint subscription_token_grants_period_check check(period_end>period_start),
 constraint subscription_token_grants_period_key unique(user_subscription_id,period_start)
);
create unique index if not exists subscription_token_grants_invoice_uidx on public.subscription_token_grants(provider_invoice_id) where provider_invoice_id is not null;
create index if not exists subscription_token_grants_user_period_idx on public.subscription_token_grants(user_id,period_start desc);

create table if not exists public.subscription_audit_log (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 user_subscription_id uuid references public.user_subscriptions(id) on delete set null,
 actor text not null check(actor in ('system','user','admin','phonepe')),
 action text not null, details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists subscription_audit_log_user_created_idx on public.subscription_audit_log(user_id,created_at desc);

alter table public.subscription_payments enable row level security;
alter table public.subscription_webhook_events enable row level security;
alter table public.subscription_token_grants enable row level security;
alter table public.subscription_audit_log enable row level security;

drop policy if exists subscription_payments_read_own_or_admin on public.subscription_payments;
create policy subscription_payments_read_own_or_admin on public.subscription_payments
 for select to authenticated using (
   user_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin=true)
 );
drop policy if exists subscription_token_grants_read_own_or_admin on public.subscription_token_grants;
create policy subscription_token_grants_read_own_or_admin on public.subscription_token_grants
 for select to authenticated using (
   user_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin=true)
 );
drop policy if exists subscription_audit_log_read_own_or_admin on public.subscription_audit_log;
create policy subscription_audit_log_read_own_or_admin on public.subscription_audit_log
 for select to authenticated using (
   user_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_admin=true)
 );
revoke all on public.subscription_webhook_events from anon,authenticated;
revoke all on public.subscription_payments,public.subscription_token_grants,public.subscription_audit_log from anon,authenticated;
grant select on public.subscription_payments,public.subscription_token_grants,public.subscription_audit_log to authenticated;

create or replace function public.grant_subscription_period_tokens(
 p_user_subscription_id uuid, p_period_start timestamptz, p_period_end timestamptz, p_provider_invoice_id text default null
) returns boolean
language plpgsql security definer set search_path='' as $$
declare v_sub record; v_tokens integer; v_bonus_tokens integer; v_grant_id uuid; v_transaction_id uuid;
begin
 if p_period_start is null or p_period_end is null or p_period_end<=p_period_start then raise exception 'Invalid subscription billing period'; end if;
 select us.id,us.user_id,us.plan_id,us.status into v_sub
 from public.user_subscriptions us where us.id=p_user_subscription_id for update;
 if v_sub.id is null then raise exception 'Subscription not found'; end if;
 if v_sub.status not in ('active','cancel_at_period_end') then raise exception 'Subscription is not eligible for token allocation'; end if;
 select sp.token_allowance,sp.monthly_bonus_tokens into v_tokens,v_bonus_tokens from public.subscription_plans sp where sp.id=v_sub.plan_id and sp.active=true;
 if v_tokens is null or v_bonus_tokens is null then raise exception 'Subscription plan is unavailable'; end if;
 insert into public.subscription_token_grants(user_subscription_id,user_id,period_start,period_end,tokens_granted,provider_invoice_id)
 values(v_sub.id,v_sub.user_id,p_period_start,p_period_end,v_tokens+v_bonus_tokens,nullif(trim(p_provider_invoice_id),''))
 on conflict do nothing returning id into v_grant_id;
 if v_grant_id is null then return false; end if;
 if v_tokens>0 then
   insert into public.token_transactions(user_id,amount,transaction_type,reference_id,description)
   values(v_sub.user_id,v_tokens,'premium_monthly',v_sub.id,
     format('Monthly subscription token allowance (%s to %s)',p_period_start,p_period_end))
   returning id into v_transaction_id;
   update public.subscription_token_grants set token_transaction_id=v_transaction_id where id=v_grant_id;
 end if;
 if v_bonus_tokens>0 then
   insert into public.token_transactions(user_id,amount,transaction_type,reference_id,description)
   values(v_sub.user_id,v_bonus_tokens,'premium_monthly',v_sub.id,
     format('PhonePe subscription promotional bonus (%s tokens; %s to %s)',v_bonus_tokens,p_period_start,p_period_end));
 end if;
 insert into public.subscription_audit_log(user_id,user_subscription_id,actor,action,details)
 values(v_sub.user_id,v_sub.id,'phonepe','monthly_tokens_granted',
   jsonb_build_object('base_tokens',v_tokens,'bonus_tokens',v_bonus_tokens,'total_tokens',v_tokens+v_bonus_tokens,'period_start',p_period_start,'period_end',p_period_end,'provider_invoice_id',p_provider_invoice_id));
 return true;
end $$;
revoke all on function public.grant_subscription_period_tokens(uuid,timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function public.grant_subscription_period_tokens(uuid,timestamptz,timestamptz,text) to service_role;

-- Configure the agreed launch offer for existing ₹10 / 50-token plans.
-- The gateway fee is absorbed by RoomOra; advertised tokens do not change.
update public.subscription_plans
set monthly_bonus_tokens = 5,
    description = coalesce(description, '₹10 monthly plan: 50 subscription tokens + 5 promotional bonus tokens')
where active = true and monthly_price = 10 and token_allowance = 50;

commit;
