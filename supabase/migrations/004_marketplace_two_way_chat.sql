create table if not exists public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.marketplace_items(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint marketplace_conversations_participants_check check (buyer_id <> seller_id),
  constraint marketplace_conversations_item_buyer_key unique (item_id, buyer_id)
);

create index if not exists marketplace_conversations_buyer_idx on public.marketplace_conversations (buyer_id, last_message_at desc);
create index if not exists marketplace_conversations_seller_idx on public.marketplace_conversations (seller_id, last_message_at desc);
create index if not exists marketplace_conversations_item_idx on public.marketplace_conversations (item_id);

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  inquiry_id uuid references public.marketplace_inquiries(id) on delete set null,
  constraint marketplace_messages_inquiry_unique unique (inquiry_id)
);

create index if not exists marketplace_messages_conversation_idx on public.marketplace_messages (conversation_id, created_at);
create index if not exists marketplace_messages_sender_idx on public.marketplace_messages (sender_id, created_at);

alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;

drop policy if exists "Conversation participants can view conversations" on public.marketplace_conversations;
create policy "Conversation participants can view conversations" on public.marketplace_conversations
for select to authenticated using ((select auth.uid()) = buyer_id or (select auth.uid()) = seller_id);

drop policy if exists "Conversation participants can view messages" on public.marketplace_messages;
create policy "Conversation participants can view messages" on public.marketplace_messages
for select to authenticated using (
  exists (
    select 1 from public.marketplace_conversations c
    where c.id = marketplace_messages.conversation_id
      and ((select auth.uid()) = c.buyer_id or (select auth.uid()) = c.seller_id)
  )
);

revoke all on table public.marketplace_conversations from anon, authenticated;
grant select on table public.marketplace_conversations to authenticated;
revoke all on table public.marketplace_messages from anon, authenticated;
grant select on table public.marketplace_messages to authenticated;

insert into public.marketplace_conversations (item_id,buyer_id,seller_id,created_at,updated_at,last_message_at)
select i.item_id,i.requester_id,i.publisher_id,min(i.created_at),max(i.updated_at),max(i.created_at)
from public.marketplace_inquiries i
group by i.item_id,i.requester_id,i.publisher_id
on conflict (item_id,buyer_id) do update
set seller_id=excluded.seller_id,
    updated_at=greatest(public.marketplace_conversations.updated_at,excluded.updated_at),
    last_message_at=greatest(public.marketplace_conversations.last_message_at,excluded.last_message_at);

insert into public.marketplace_messages (conversation_id,sender_id,body,created_at,inquiry_id)
select c.id,i.requester_id,i.message,i.created_at,i.id
from public.marketplace_inquiries i
join public.marketplace_conversations c on c.item_id=i.item_id and c.buyer_id=i.requester_id
on conflict (inquiry_id) do nothing;

create or replace function public.start_marketplace_conversation(p_item_id uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_seller uuid; v_conversation uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if char_length(trim(coalesce(p_message,'')))<1 or char_length(trim(coalesce(p_message,'')))>2000 then raise exception 'Message must be between 1 and 2000 characters'; end if;
 select mi.user_id into v_seller from public.marketplace_items mi where mi.id=p_item_id and mi.status='published' and mi.expires_at>now();
 if v_seller is null then raise exception 'This listing is no longer available'; end if;
 if v_seller=v_user then raise exception 'You cannot message yourself'; end if;
 select c.id into v_conversation from public.marketplace_conversations c where c.item_id=p_item_id and c.buyer_id=v_user;
 if v_conversation is null then
   insert into public.marketplace_conversations(item_id,buyer_id,seller_id) values(p_item_id,v_user,v_seller) returning id into v_conversation;
 end if;
 insert into public.marketplace_messages(conversation_id,sender_id,body) values(v_conversation,v_user,trim(p_message));
 update public.marketplace_conversations set updated_at=now(),last_message_at=now() where id=v_conversation;
 return v_conversation;
end;
$$;

create or replace function public.send_marketplace_message(p_conversation_id uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_message_id uuid; v_allowed boolean;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if char_length(trim(coalesce(p_message,'')))<1 or char_length(trim(coalesce(p_message,'')))>2000 then raise exception 'Message must be between 1 and 2000 characters'; end if;
 select exists(select 1 from public.marketplace_conversations c where c.id=p_conversation_id and (c.buyer_id=v_user or c.seller_id=v_user)) into v_allowed;
 if not v_allowed then raise exception 'Conversation not found'; end if;
 insert into public.marketplace_messages(conversation_id,sender_id,body) values(p_conversation_id,v_user,trim(p_message)) returning id into v_message_id;
 update public.marketplace_conversations set updated_at=now(),last_message_at=now() where id=p_conversation_id;
 return v_message_id;
end;
$$;

create or replace function public.mark_marketplace_conversation_read(p_conversation_id uuid)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_count integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.marketplace_conversations c where c.id=p_conversation_id and (c.buyer_id=v_user or c.seller_id=v_user)) then raise exception 'Conversation not found'; end if;
 update public.marketplace_messages m set read_at=now() where m.conversation_id=p_conversation_id and m.sender_id<>v_user and m.read_at is null;
 get diagnostics v_count=row_count;
 return v_count;
end;
$$;

revoke execute on function public.start_marketplace_conversation(uuid,text) from public,anon;
grant execute on function public.start_marketplace_conversation(uuid,text) to authenticated;
revoke execute on function public.send_marketplace_message(uuid,text) from public,anon;
grant execute on function public.send_marketplace_message(uuid,text) to authenticated;
revoke execute on function public.mark_marketplace_conversation_read(uuid) from public,anon;
grant execute on function public.mark_marketplace_conversation_read(uuid) to authenticated;

do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='marketplace_messages') then
   alter publication supabase_realtime add table public.marketplace_messages;
 end if;
end
$$;
