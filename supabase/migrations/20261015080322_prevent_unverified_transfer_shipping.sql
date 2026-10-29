-- Do not allow fulfilment of a bank-transfer order before the payment has
-- been verified by SePay or explicitly confirmed by an administrator.
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

  if p_status = 'shipping'
    and v_order.payment_method = 'bank_transfer'
    and v_order.payment_status <> 'paid' then
    raise exception 'Chưa thể giao đơn chuyển khoản khi thanh toán chưa được xác minh';
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
