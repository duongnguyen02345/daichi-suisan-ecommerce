-- Admin order operations for FreshMart.
-- Status changes are exposed only through checked RPC functions so a browser
-- client cannot bypass the order workflow with a direct update.

create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  from_payment_status text,
  to_payment_status text,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_created_idx
  on public.order_status_history (order_id, created_at desc);

alter table public.order_status_history enable row level security;

grant select on public.orders, public.order_items, public.payment_transactions,
  public.order_status_history to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders"
on public.orders for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins read order items" on public.order_items;
create policy "Admins read order items"
on public.order_items for select
to authenticated
using (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and exists (
    select 1 from public.orders
    where public.orders.id = order_items.order_id
  )
);

drop policy if exists "Admins read payment transactions" on public.payment_transactions;
create policy "Admins read payment transactions"
on public.payment_transactions for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins read order status history" on public.order_status_history;
create policy "Admins read order status history"
on public.order_status_history for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

create or replace function public.transition_freshmart_order(
  p_order_id uuid,
  p_status text,
  p_note text default null
) returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_previous_status text;
begin
  if ((select auth.jwt()->'app_metadata'->>'role') is distinct from 'admin') then
    raise exception 'Bạn không có quyền cập nhật đơn hàng';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'Không tìm thấy đơn hàng'; end if;
  v_previous_status := v_order.status;

  if not (
    (v_order.status = 'awaiting_payment' and p_status = 'cancelled')
    or (v_order.status = 'pending' and p_status in ('shipping', 'cancelled'))
    or (v_order.status = 'shipping' and p_status in ('delivered', 'returned'))
    or (v_order.status = 'delivered' and p_status = 'returned')
  ) then
    raise exception 'Không thể chuyển đơn từ % sang %', v_order.status, p_status;
  end if;

  if p_status = 'cancelled' and v_order.payment_status = 'paid' then
    raise exception 'Đơn đã thanh toán cần được hoàn tiền trước khi hủy';
  end if;

  update public.orders
  set status = p_status, updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (
    order_id, from_status, to_status, from_payment_status,
    to_payment_status, note, changed_by
  ) values (
    v_order.id, v_previous_status, v_order.status, v_order.payment_status,
    v_order.payment_status, nullif(trim(p_note), ''), auth.uid()
  );

  return v_order;
end;
$$;

create or replace function public.confirm_freshmart_order_payment(
  p_order_id uuid,
  p_provider_transaction_id text default null,
  p_note text default null
) returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_previous_status text;
  v_previous_payment_status text;
begin
  if ((select auth.jwt()->'app_metadata'->>'role') is distinct from 'admin') then
    raise exception 'Bạn không có quyền xác nhận thanh toán';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'Không tìm thấy đơn hàng'; end if;
  if v_order.payment_method <> 'bank_transfer' then
    raise exception 'Đơn hàng không sử dụng chuyển khoản';
  end if;
  if v_order.status <> 'awaiting_payment'
    or v_order.payment_status not in ('awaiting_confirmation', 'review_required') then
    raise exception 'Đơn hàng không ở trạng thái chờ xác nhận chuyển khoản';
  end if;

  v_previous_status := v_order.status;
  v_previous_payment_status := v_order.payment_status;

  update public.orders
  set
    payment_status = 'paid',
    status = 'pending',
    paid_at = coalesce(paid_at, now()),
    provider_transaction_id = coalesce(nullif(trim(p_provider_transaction_id), ''), provider_transaction_id),
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (
    order_id, from_status, to_status, from_payment_status,
    to_payment_status, note, changed_by
  ) values (
    v_order.id, v_previous_status, v_order.status, v_previous_payment_status,
    v_order.payment_status, coalesce(nullif(trim(p_note), ''), 'Admin xác nhận chuyển khoản'),
    auth.uid()
  );

  return v_order;
end;
$$;

revoke all on function public.transition_freshmart_order(uuid, text, text)
  from public, anon;
grant execute on function public.transition_freshmart_order(uuid, text, text)
  to authenticated;

revoke all on function public.confirm_freshmart_order_payment(uuid, text, text)
  from public, anon;
grant execute on function public.confirm_freshmart_order_payment(uuid, text, text)
  to authenticated;
