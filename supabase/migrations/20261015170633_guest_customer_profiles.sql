-- Profiles for customers who check out without creating an Auth account.
-- Phone is the customer code, but personal data is never readable by anon users.

create table if not exists public.guest_customers (
  customer_code text primary key,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  email text,
  access_token_hash text not null unique,
  order_count integer not null default 1 check (order_count >= 0),
  first_order_id uuid references public.orders(id) on delete set null,
  last_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_code ~ '^(0[0-9]{9,10}|\+84[0-9]{9,10})$')
);

create table if not exists public.guest_customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null references public.guest_customers(customer_code) on delete cascade,
  formatted_address text not null check (char_length(btrim(formatted_address)) between 10 and 250),
  address_hash text not null,
  latitude double precision,
  longitude double precision,
  times_used integer not null default 1 check (times_used > 0),
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (customer_code, address_hash)
);

create index if not exists guest_customers_last_order_idx
  on public.guest_customers (updated_at desc);
create index if not exists guest_customer_addresses_recent_idx
  on public.guest_customer_addresses (customer_code, last_used_at desc);

alter table public.guest_customers enable row level security;
alter table public.guest_customer_addresses enable row level security;

revoke all on public.guest_customers, public.guest_customer_addresses from anon, authenticated;
grant all on public.guest_customers, public.guest_customer_addresses to service_role;
grant select on public.guest_customers, public.guest_customer_addresses to authenticated;

drop policy if exists "Admins can read guest customers" on public.guest_customers;
create policy "Admins can read guest customers"
on public.guest_customers
for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins can read guest customer addresses" on public.guest_customer_addresses;
create policy "Admins can read guest customer addresses"
on public.guest_customer_addresses
for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
