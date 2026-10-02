create extension if not exists pgcrypto;

create type public.listing_status as enum ('draft','published','paused','archived');
create type public.item_condition as enum ('new','second_hand');
create type public.marketplace_owner_type as enum ('tenant','shop');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  is_tenant boolean not null default false,
  is_owner boolean not null default false,
  is_shop boolean not null default false,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_owner_exclusive check (not (is_tenant and is_owner)),
  constraint admin_separate check (not (is_admin and (is_tenant or is_owner or is_shop)))
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  address text not null,
  locality text not null,
  city text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  monthly_price integer not null check (monthly_price > 0),
  deposit integer check (deposit is null or deposit >= 0),
  furnished boolean not null default false,
  furniture_details text,
  facilities text[] not null default '{}',
  status public.listing_status not null default 'draft',
  available_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_images (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null, sort_order integer not null default 0, created_at timestamptz not null default now()
);

create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id) on delete cascade,
  seller_type public.marketplace_owner_type not null, title text not null, description text, category text not null,
  condition public.item_condition not null, price integer not null check (price >= 0), quantity integer not null default 1 check (quantity > 0),
  status public.listing_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.marketplace_images (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  storage_path text not null, sort_order integer not null default 0, created_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text,
  monthly_price integer not null default 0 check (monthly_price >= 0), monthly_tokens integer not null default 0 check (monthly_tokens >= 0),
  active boolean not null default true, created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id), status text not null default 'active',
  started_at timestamptz not null default now(), renews_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now()
);

create table public.token_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null, reason text not null, reference_id uuid, created_at timestamptz not null default now()
);

create table public.owner_contact_unlocks (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade, room_id uuid references public.rooms(id) on delete set null,
  token_cost integer not null check (token_cost >= 0), created_at timestamptz not null default now(), unique(requester_id, owner_id, room_id)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null,
  message text not null, status text not null default 'open', created_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(), title text not null, body text not null, active boolean not null default true,
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text, scheduled_for timestamptz not null, sent_at timestamptz, created_at timestamptz not null default now()
);

create index rooms_city_locality_idx on public.rooms(city, locality);
create index rooms_price_idx on public.rooms(monthly_price);
create index marketplace_category_idx on public.marketplace_listings(category, condition);
create index subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index token_ledger_user_created_idx on public.token_ledger(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_images enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_images enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.token_ledger enable row level security;
alter table public.owner_contact_unlocks enable row level security;
alter table public.feedback enable row level security;
alter table public.notices enable row level security;
alter table public.reminders enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_admin = true and is_active = true);
$$;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy "published rooms are public" on public.rooms for select using (status = 'published' or owner_id = auth.uid() or public.is_admin());
create policy "owners create rooms" on public.rooms for insert with check (owner_id = auth.uid() and exists(select 1 from public.profiles p where p.id = auth.uid() and (p.is_owner or p.is_shop) and p.is_active));
create policy "owners update rooms" on public.rooms for update using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy "owners delete rooms" on public.rooms for delete using (owner_id = auth.uid() or public.is_admin());

create policy "published marketplace public" on public.marketplace_listings for select using (status = 'published' or seller_id = auth.uid() or public.is_admin());
create policy "tenant or shop creates marketplace" on public.marketplace_listings for insert with check (seller_id = auth.uid() and exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_active and ((seller_type = 'tenant' and p.is_tenant) or (seller_type = 'shop' and p.is_shop))));
create policy "seller updates marketplace" on public.marketplace_listings for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy "seller deletes marketplace" on public.marketplace_listings for delete using (seller_id = auth.uid() or public.is_admin());

create policy "active plans public" on public.subscription_plans for select using (active = true or public.is_admin());
create policy "own subscriptions" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "own token ledger" on public.token_ledger for select using (user_id = auth.uid() or public.is_admin());
create policy "own contact unlocks" on public.owner_contact_unlocks for select using (requester_id = auth.uid() or owner_id = auth.uid() or public.is_admin());

create policy "own feedback" on public.feedback for select using (user_id = auth.uid() or public.is_admin());
create policy "signed users submit feedback" on public.feedback for insert with check (user_id = auth.uid());
create policy "admin manages feedback" on public.feedback for update using (public.is_admin()) with check (public.is_admin());

create policy "active notices public" on public.notices for select using (active = true or public.is_admin());
create policy "admins manage notices" on public.notices for all using (public.is_admin()) with check (public.is_admin());
create policy "own reminders" on public.reminders for select using (recipient_id = auth.uid() or public.is_admin());
create policy "admins manage reminders" on public.reminders for all using (public.is_admin()) with check (public.is_admin());
