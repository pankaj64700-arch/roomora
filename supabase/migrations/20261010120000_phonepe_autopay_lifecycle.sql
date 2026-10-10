begin;

alter table public.user_subscriptions
  add column if not exists phonepe_merchant_subscription_id text,
  add column if not exists next_renewal_notification_at timestamptz;

alter table public.subscription_payments
  add column if not exists payment_purpose text not null default 'initial',
  add column if not exists billing_period_start timestamptz,
  add column if not exists billing_period_end timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_payments'::regclass and conname='subscription_payments_purpose_check') then
    alter table public.subscription_payments add constraint subscription_payments_purpose_check check (payment_purpose in ('initial','renewal'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.subscription_payments'::regclass and conname='subscription_payments_period_check') then
    alter table public.subscription_payments add constraint subscription_payments_period_check check (billing_period_start is null or billing_period_end is null or billing_period_end > billing_period_start);
  end if;
end $$;

-- A renewal period may only have one payment order, even if the scheduler is retried.
create unique index if not exists subscription_payments_one_order_per_period_uidx
  on public.subscription_payments(user_subscription_id, billing_period_start)
  where payment_purpose='renewal' and billing_period_start is not null;

create index if not exists user_subscriptions_phonepe_renewal_due_idx
  on public.user_subscriptions(current_period_end)
  where status='active' and billing_provider='phonepe' and phonepe_merchant_subscription_id is not null and cancel_at_period_end=false;

commit;