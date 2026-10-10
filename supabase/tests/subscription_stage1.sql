-- Run only after applying Stage 1 in a development database.
do $$ begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_plans' and column_name='monthly_listing_limit') then raise exception 'Missing monthly_listing_limit'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_plans' and column_name='razorpay_plan_id') then raise exception 'Missing razorpay_plan_id'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='user_subscriptions' and column_name='razorpay_subscription_id') then raise exception 'Missing razorpay_subscription_id'; end if;
 if to_regclass('public.subscription_payments') is null then raise exception 'Missing subscription_payments'; end if;
 if to_regclass('public.subscription_webhook_events') is null then raise exception 'Missing subscription_webhook_events'; end if;
 if to_regclass('public.subscription_token_grants') is null then raise exception 'Missing subscription_token_grants'; end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='subscription_webhook_events' and c.relrowsecurity) then raise exception 'Webhook event table must have RLS enabled'; end if;
 if has_function_privilege('authenticated','public.grant_subscription_period_tokens(uuid,timestamp with time zone,timestamp with time zone,text)','EXECUTE') then raise exception 'Authenticated users must not grant subscription tokens'; end if;
 if not exists(select 1 from pg_constraint where conrelid='public.user_subscriptions'::regclass and conname='user_subscriptions_status_check') then raise exception 'Missing lifecycle status constraint'; end if;
 raise notice 'RoomOra subscription Stage 1 schema checks passed';
end $$;
