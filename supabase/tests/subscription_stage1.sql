-- Run only after applying Stage 1 in a development database.
do $$ begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_plans' and column_name='monthly_listing_limit') then raise exception 'Missing monthly_listing_limit'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_plans' and column_name='monthly_bonus_tokens') then raise exception 'Missing monthly_bonus_tokens'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='subscription_plans' and column_name='phonepe_plan_id') then raise exception 'Missing phonepe_plan_id'; end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='user_subscriptions' and column_name='phonepe_subscription_id') then raise exception 'Missing phonepe_subscription_id'; end if;
 if to_regclass('public.subscription_payments') is null then raise exception 'Missing subscription_payments'; end if;
 if to_regclass('public.subscription_webhook_events') is null then raise exception 'Missing subscription_webhook_events'; end if;
 if to_regclass('public.subscription_token_grants') is null then raise exception 'Missing subscription_token_grants'; end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='subscription_webhook_events' and c.relrowsecurity) then raise exception 'Webhook event table must have RLS enabled'; end if;
 if has_function_privilege('authenticated','public.grant_subscription_period_tokens(uuid,timestamp with time zone,timestamp with time zone,text)','EXECUTE') then raise exception 'Authenticated users must not grant subscription tokens'; end if;
 if not exists(select 1 from pg_constraint where conrelid='public.user_subscriptions'::regclass and conname='user_subscriptions_status_check') then raise exception 'Missing lifecycle status constraint'; end if;
 raise notice 'RoomOra subscription Stage 1 schema checks passed';
end $$;

-- Behavioral test: token grants are idempotent per billing period and invoice.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000101');
insert into public.profiles(id,is_admin) values ('00000000-0000-4000-8000-000000000101',false);
insert into public.subscription_plans(id,name,monthly_price,token_allowance,monthly_bonus_tokens,active)
 values ('00000000-0000-4000-8000-000000000201','CI Subscription Plan',10,50,5,true);
insert into public.user_subscriptions(id,user_id,plan_id,status,current_period_start,current_period_end)
 values ('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000201','active','2026-10-01T00:00:00Z','2026-11-01T00:00:00Z');
do $$
declare first_result boolean; second_result boolean; total_tokens integer; grant_count integer; granted integer;
begin
 first_result := public.grant_subscription_period_tokens('00000000-0000-4000-8000-000000000301','2026-10-01T00:00:00Z','2026-11-01T00:00:00Z','ci-invoice-1');
 second_result := public.grant_subscription_period_tokens('00000000-0000-4000-8000-000000000301','2026-10-01T00:00:00Z','2026-11-01T00:00:00Z','ci-invoice-1');
 if first_result is distinct from true then raise exception 'First token grant should succeed'; end if;
 if second_result is distinct from false then raise exception 'Duplicate token grant should be ignored'; end if;
 select count(*) into total_tokens from public.token_transactions where user_id='00000000-0000-4000-8000-000000000101' and transaction_type='premium_monthly' and amount in (5,50);
 select count(*) into grant_count from public.subscription_token_grants where user_subscription_id='00000000-0000-4000-8000-000000000301';
 select tokens_granted into granted from public.subscription_token_grants where user_subscription_id='00000000-0000-4000-8000-000000000301';
 if total_tokens <> 2 then raise exception 'Expected separate base and bonus token transactions, got %',total_tokens; end if;
 if grant_count <> 1 then raise exception 'Expected exactly one token grant row, got %',grant_count; end if;
 if granted <> 55 then raise exception 'Expected 50 base + 5 bonus = 55 tokens, got %',granted; end if;
end $$;
rollback;
