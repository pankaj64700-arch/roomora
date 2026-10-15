-- Run after both RoomOra subscription migrations in a disposable development database.
do $$
begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='user_subscriptions' and column_name='phonepe_merchant_subscription_id') then raise exception 'Missing phonepe_merchant_subscription_id'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='user_subscriptions' and column_name='next_renewal_notification_at') then raise exception 'Missing next_renewal_notification_at'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_payments' and column_name='payment_purpose') then raise exception 'Missing payment_purpose'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_payments' and column_name='billing_period_start') then raise exception 'Missing billing_period_start'; end if;
 if not exists(select 1 from pg_indexes where schemaname='public' and indexname='subscription_payments_one_order_per_period_uidx') then raise exception 'Missing idempotent renewal-order index'; end if;
end $$;
