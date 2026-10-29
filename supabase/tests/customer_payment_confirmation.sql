begin;

insert into public.orders (
  id,
  code,
  access_token_hash,
  subtotal,
  product_discount,
  coupon_discount,
  shipping_fee,
  total,
  status,
  payment_method,
  payment_status,
  transfer_reference,
  payment_provider,
  payment_expires_at,
  bank_account_id,
  recipient_name,
  phone,
  email,
  address,
  delivery_date,
  delivery_time_slot
) values (
  '00000000-0000-4000-8000-000000000123',
  'FMTESTPAY123',
  repeat('a', 64),
  1000,
  0,
  0,
  0,
  1000,
  'awaiting_payment',
  'bank_transfer',
  'awaiting_confirmation',
  'FMTESTPAY123',
  'sepay',
  now() + interval '30 minutes',
  (select id from public.bank_accounts where is_active order by updated_at desc limit 1),
  'Khách kiểm thử',
  '0900000000',
  'test@example.com',
  'Địa chỉ kiểm thử không lưu',
  current_date + 1,
  '09:00-11:00'
);

select public.report_freshmart_order_payment(
  '00000000-0000-4000-8000-000000000123',
  repeat('a', 64)
);

do $$
declare
  v_order public.orders;
  v_shipping_blocked boolean := false;
begin
  select * into v_order
  from public.orders
  where id = '00000000-0000-4000-8000-000000000123';

  if v_order.status <> 'pending'
    or v_order.payment_status <> 'customer_reported'
    or v_order.payment_reported_at is null then
    raise exception 'Customer payment report state was not applied correctly';
  end if;

  if not exists (
    select 1
    from public.order_status_history
    where order_id = v_order.id
      and to_payment_status = 'customer_reported'
  ) then
    raise exception 'Customer payment report history was not written';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000999","app_metadata":{"role":"admin"}}',
    true
  );

  begin
    perform public.transition_freshmart_order(
      v_order.id,
      'shipping',
      'This transition must be blocked while payment is unverified'
    );
  exception when others then
    if position('Chưa thể giao đơn chuyển khoản' in sqlerrm) > 0 then
      v_shipping_blocked := true;
    else
      raise;
    end if;
  end;

  if not v_shipping_blocked then
    raise exception 'Unverified transfer order was allowed to enter shipping';
  end if;
end;
$$;

rollback;

select 'customer payment confirmation and shipping guard verified; test data rolled back' as result;
