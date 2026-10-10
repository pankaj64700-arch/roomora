-- Minimal disposable PostgreSQL fixture for testing the Stage 1 migration.
-- This is not a production migration and must only run in CI/local throwaway databases.
create schema if not exists auth;
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create table auth.users(id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create table public.profiles(id uuid primary key references auth.users(id),is_admin boolean not null default false);
create table public.subscription_plans(
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 monthly_price numeric not null default 0,
 token_allowance integer not null default 0 check(token_allowance>=0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.user_subscriptions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 plan_id uuid not null references public.subscription_plans(id),
 status text not null default 'active' check(status=any(array['active','expired','cancelled'])),
 started_at timestamptz not null default now(),
 current_period_start timestamptz not null default now(),
 current_period_end timestamptz not null default (now()+interval '1 month'),
 created_at timestamptz not null default now()
);
create table public.token_transactions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 amount integer not null,
 transaction_type text not null check(transaction_type=any(array['initial_free','premium_monthly','advertisement','refund','adjustment','marketplace_item'])),
 reference_id uuid,
 description text,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.token_transactions enable row level security;
create policy plans_read_active on public.subscription_plans for select to public using(active=true);
