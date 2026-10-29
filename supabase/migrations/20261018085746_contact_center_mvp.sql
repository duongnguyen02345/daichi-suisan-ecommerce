-- FreshMart contact center: configurable public channels and secure customer/admin chat.

create table public.contact_channels (
  id text primary key check (id in ('phone', 'zalo', 'facebook', 'internal_chat')),
  label text not null check (char_length(label) between 2 and 40),
  contact_value text not null default '',
  target_url text not null default '',
  is_active boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 100),
  available_from time,
  available_to time,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.contact_channels (id, label, is_active, sort_order) values
  ('zalo', 'Zalo', false, 10),
  ('phone', 'Điện thoại', false, 20),
  ('facebook', 'Facebook', false, 30),
  ('internal_chat', 'Chat với FreshMart', true, 40)
on conflict (id) do nothing;

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  guest_token_hash text unique,
  guest_name text not null default '',
  guest_phone text not null default '',
  order_code text,
  status text not null default 'waiting_admin'
    check (status in ('open', 'waiting_admin', 'waiting_customer', 'resolved', 'spam')),
  assigned_admin_id uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  customer_last_read_at timestamptz,
  admin_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_id is not null or guest_token_hash is not null),
  check (char_length(guest_name) <= 80),
  check (char_length(guest_phone) <= 20),
  check (order_code is null or char_length(order_code) <= 40)
);

create index chat_conversations_queue_idx
  on public.chat_conversations (status, last_message_at desc);
create index chat_conversations_customer_idx
  on public.chat_conversations (customer_id, last_message_at desc)
  where customer_id is not null;

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index chat_messages_conversation_idx
  on public.chat_messages (conversation_id, created_at, id);

-- Only the chat Edge Function (service role) can access this table.
create table public.chat_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.contact_channels enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_rate_limits enable row level security;

grant select on public.contact_channels to anon, authenticated;
grant insert, update, delete on public.contact_channels to authenticated;
grant select, update on public.chat_conversations to authenticated;
grant select, insert, update on public.chat_messages to authenticated;
grant usage, select on sequence public.chat_messages_id_seq to authenticated;

create policy "Public read active contact channels"
on public.contact_channels for select
to anon, authenticated
using (is_active = true or ((select auth.jwt())->'app_metadata'->>'role') = 'admin');

create policy "Admins manage contact channels"
on public.contact_channels for all
to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
with check (
  ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
  and updated_by = (select auth.uid())
);

create policy "Customers read their conversations"
on public.chat_conversations for select
to authenticated
using (
  customer_id = (select auth.uid())
  or ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
);

create policy "Admins update conversations"
on public.chat_conversations for update
to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');

create policy "Customers read their messages"
on public.chat_messages for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and (
        c.customer_id = (select auth.uid())
        or ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
      )
  )
);

create policy "Admins send chat messages"
on public.chat_messages for insert
to authenticated
with check (
  ((select auth.jwt())->'app_metadata'->>'role') = 'admin'
  and sender_type = 'admin'
  and sender_user_id = (select auth.uid())
);

create policy "Admins mark chat messages read"
on public.chat_messages for update
to authenticated
using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.touch_chat_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_conversations
  set
    last_message_at = new.created_at,
    updated_at = now(),
    status = case
      when new.sender_type = 'customer' then 'waiting_admin'
      when new.sender_type = 'admin' then 'waiting_customer'
      else status
    end
  where id = new.conversation_id;
  return new;
end;
$$;

revoke all on function private.touch_chat_conversation() from public, anon, authenticated;

create trigger chat_message_updates_conversation
after insert on public.chat_messages
for each row execute function private.touch_chat_conversation();

create or replace function public.consume_freshmart_chat_rate_limit(
  p_rate_key text,
  p_limit integer default 20,
  p_window_seconds integer default 60
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.chat_rate_limits;
begin
  if char_length(p_rate_key) < 32 or p_limit < 1 or p_window_seconds < 10 then
    return false;
  end if;

  insert into public.chat_rate_limits (rate_key, request_count)
  values (p_rate_key, 1)
  on conflict (rate_key) do update
    set
      window_started_at = case
        when public.chat_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
          then now()
        else public.chat_rate_limits.window_started_at
      end,
      request_count = case
        when public.chat_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
          then 1
        else public.chat_rate_limits.request_count + 1
      end,
      updated_at = now()
  returning * into v_row;

  return v_row.request_count <= p_limit;
end;
$$;

revoke all on function public.consume_freshmart_chat_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_freshmart_chat_rate_limit(text, integer, integer)
  to service_role;

-- Enable Postgres Changes for the authenticated admin inbox.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_conversations'
  ) then
    alter publication supabase_realtime add table public.chat_conversations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;
