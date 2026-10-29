-- Customer-reported bank transfer flow.
-- A customer report never marks an order as paid. It only moves the order into
-- the admin processing queue until SePay or an authenticated admin confirms it.

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in (
    'cash_on_delivery',
    'awaiting_confirmation',
    'customer_reported',
    'paid',
    'review_required',
    'failed',
    'expired',
    'refunded'
  ));

alter table public.orders
  add column if not exists payment_reported_at timestamptz;

create index if not exists orders_customer_reported_idx
  on public.orders (payment_reported_at desc)
  where payment_status = 'customer_reported';

create or replace function public.report_freshmart_order_payment(
  p_order_id uuid,
  p_access_token_hash text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_previous_status text;
  v_previous_payment_status text;
begin
  if p_access_token_hash is null or length(p_access_token_hash) <> 64 then
    raise exception 'Thông tin xác thực đơn hàng không hợp lệ';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
    and access_token_hash = p_access_token_hash
  for update;

  if not found then
    raise exception 'Không tìm thấy đơn hàng';
  end if;

  if v_order.payment_method <> 'bank_transfer' then
    raise exception 'Đơn hàng không sử dụng chuyển khoản';
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object(
      'id', v_order.id,
      'code', v_order.code,
      'status', v_order.status,
      'paymentStatus', v_order.payment_status,
      'paymentReportedAt', v_order.payment_reported_at,
      'paidAt', v_order.paid_at,
      'alreadyPaid', true
    );
  end if;

  if v_order.payment_status = 'customer_reported' then
    return jsonb_build_object(
      'id', v_order.id,
      'code', v_order.code,
      'status', v_order.status,
      'paymentStatus', v_order.payment_status,
      'paymentReportedAt', v_order.payment_reported_at,
      'alreadyReported', true
    );
  end if;

  if v_order.status <> 'awaiting_payment'
    or v_order.payment_status <> 'awaiting_confirmation' then
    raise exception 'Đơn hàng không còn ở trạng thái chờ khách chuyển khoản';
  end if;

  v_previous_status := v_order.status;
  v_previous_payment_status := v_order.payment_status;

  update public.orders
  set
    status = 'pending',
    payment_status = 'customer_reported',
    payment_reported_at = coalesce(payment_reported_at, now()),
    updated_at = now()
  where id = v_order.id
  returning * into v_order;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    from_payment_status,
    to_payment_status,
    note,
    changed_by
  ) values (
    v_order.id,
    v_previous_status,
    v_order.status,
    v_previous_payment_status,
    v_order.payment_status,
    'Khách hàng báo đã chuyển khoản; chờ SePay hoặc admin xác minh',
    null
  );

  return jsonb_build_object(
    'id', v_order.id,
    'code', v_order.code,
    'status', v_order.status,
    'paymentStatus', v_order.payment_status,
    'paymentReportedAt', v_order.payment_reported_at,
    'alreadyReported', false
  );
end;
$$;

revoke all on function public.report_freshmart_order_payment(uuid, text)
  from public, anon, authenticated;
grant execute on function public.report_freshmart_order_payment(uuid, text)
  to service_role;

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
  if v_order.status not in ('awaiting_payment', 'pending')
    or v_order.payment_status not in ('awaiting_confirmation', 'customer_reported', 'review_required') then
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
    v_order.payment_status, coalesce(nullif(trim(p_note), ''), 'Admin xác nhận chuyển khoản thành công'),
    auth.uid()
  );

  return v_order;
end;
$$;

create or replace function public.process_sepay_webhook(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider_id text := p_payload->>'id';
  v_reference text := upper(coalesce(p_payload->>'code', ''));
  v_amount integer := coalesce((p_payload->>'transferAmount')::integer, 0);
  v_transaction_id uuid;
  v_order public.orders;
  v_account public.bank_accounts;
  v_regex_match text[];
  v_previous_status text;
  v_previous_payment_status text;
begin
  if v_provider_id is null or v_provider_id = '' then raise exception 'Thiếu mã giao dịch SePay'; end if;

  insert into public.payment_transactions (
    provider, provider_transaction_id, gateway, account_number, transfer_type,
    transfer_amount, transfer_reference, bank_reference_code, transaction_at,
    processing_status, raw_payload
  ) values (
    'sepay', v_provider_id, p_payload->>'gateway', p_payload->>'accountNumber',
    p_payload->>'transferType', v_amount, nullif(v_reference, ''), p_payload->>'referenceCode',
    case when p_payload->>'transactionDate' is null then null
      else ((p_payload->>'transactionDate')::timestamp at time zone 'Asia/Ho_Chi_Minh') end,
    'received', p_payload
  ) on conflict (provider, provider_transaction_id) do nothing
  returning id into v_transaction_id;

  if v_transaction_id is null then
    return jsonb_build_object('duplicate', true, 'matched', false);
  end if;

  if p_payload->>'transferType' <> 'in' then
    update public.payment_transactions set processing_status = 'ignored' where id = v_transaction_id;
    return jsonb_build_object('duplicate', false, 'matched', false, 'reason', 'not_incoming');
  end if;

  select * into v_account
  from public.bank_accounts
  where regexp_replace(account_number, '[^A-Za-z0-9]', '', 'g') =
    regexp_replace(coalesce(p_payload->>'accountNumber', ''), '[^A-Za-z0-9]', '', 'g')
  order by is_active desc, updated_at desc
  limit 1;

  if not found then
    update public.payment_transactions set processing_status = 'unmatched' where id = v_transaction_id;
    return jsonb_build_object('duplicate', false, 'matched', false, 'reason', 'wrong_account');
  end if;

  if v_reference = '' then
    v_regex_match := regexp_match(upper(coalesce(p_payload->>'content', '')), '(FM[0-9A-Z]{8,20})');
    if v_regex_match is not null then v_reference := v_regex_match[1]; end if;
  end if;

  select * into v_order
  from public.orders
  where transfer_reference = v_reference
    and bank_account_id = v_account.id
    and payment_status in ('awaiting_confirmation', 'customer_reported', 'review_required')
  for update;

  if not found then
    update public.payment_transactions
      set processing_status = 'unmatched', transfer_reference = nullif(v_reference, '')
      where id = v_transaction_id;
    return jsonb_build_object('duplicate', false, 'matched', false, 'reason', 'order_not_found');
  end if;

  if v_order.total <> v_amount then
    update public.orders
      set payment_status = 'review_required', updated_at = now()
      where id = v_order.id;
    update public.payment_transactions
      set processing_status = 'amount_mismatch', matched_order_id = v_order.id, transfer_reference = v_reference
      where id = v_transaction_id;
    return jsonb_build_object('duplicate', false, 'matched', false, 'reason', 'amount_mismatch', 'orderId', v_order.id);
  end if;

  v_previous_status := v_order.status;
  v_previous_payment_status := v_order.payment_status;

  update public.orders
    set payment_status = 'paid', status = 'pending', paid_at = now(), updated_at = now(),
        provider_transaction_id = v_provider_id
    where id = v_order.id;

  update public.payment_transactions
    set processing_status = 'matched', matched_order_id = v_order.id, transfer_reference = v_reference
    where id = v_transaction_id;

  insert into public.order_status_history (
    order_id, from_status, to_status, from_payment_status,
    to_payment_status, note, changed_by
  ) values (
    v_order.id, v_previous_status, 'pending', v_previous_payment_status,
    'paid', 'SePay tự động xác nhận giao dịch chuyển khoản', null
  );

  return jsonb_build_object('duplicate', false, 'matched', true, 'orderId', v_order.id, 'orderCode', v_order.code);
end;
$$;
