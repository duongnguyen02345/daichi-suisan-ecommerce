create extension if not exists pgcrypto;

create table public.catalog_products (
  id text primary key,
  name text not null,
  price integer not null check (price >= 0),
  original_price integer not null check (original_price >= price),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.promotions (
  code text primary key,
  title text not null,
  discount_amount integer check (discount_amount is null or discount_amount >= 0),
  discount_percent numeric(5, 2) check (discount_percent is null or discount_percent between 0 and 100),
  min_order integer not null default 0 check (min_order >= 0),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  check (ends_on >= starts_on)
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_id text not null,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  is_active boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (bank_id, account_number)
);

create unique index bank_accounts_one_active_idx
  on public.bank_accounts ((is_active))
  where is_active;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid references auth.users(id) on delete set null,
  access_token_hash text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  subtotal integer not null check (subtotal >= 0),
  product_discount integer not null default 0 check (product_discount >= 0),
  coupon_discount integer not null default 0 check (coupon_discount >= 0),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  total integer not null check (total >= 0),
  status text not null check (status in ('awaiting_payment', 'pending', 'shipping', 'delivered', 'returned', 'cancelled')),
  payment_method text not null check (payment_method in ('cod', 'bank_transfer')),
  payment_status text not null check (payment_status in ('cash_on_delivery', 'awaiting_confirmation', 'paid', 'review_required', 'failed', 'expired', 'refunded')),
  transfer_reference text unique,
  qr_url text,
  payment_provider text,
  provider_transaction_id text,
  payment_expires_at timestamptz,
  paid_at timestamptz,
  bank_account_id uuid references public.bank_accounts(id),
  recipient_name text not null,
  phone text not null,
  email text,
  address text not null,
  latitude double precision,
  longitude double precision,
  delivery_date date not null,
  delivery_time_slot text not null,
  note text,
  coupon_code text references public.promotions(code)
);

create index orders_payment_lookup_idx
  on public.orders (transfer_reference, payment_status);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.catalog_products(id),
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  original_unit_price integer not null check (original_unit_price >= unit_price),
  quantity integer not null check (quantity between 1 and 99),
  line_total integer generated always as (unit_price * quantity) stored
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_transaction_id text not null,
  gateway text,
  account_number text,
  transfer_type text,
  transfer_amount integer check (transfer_amount is null or transfer_amount >= 0),
  transfer_reference text,
  bank_reference_code text,
  transaction_at timestamptz,
  processing_status text not null check (processing_status in ('received', 'matched', 'unmatched', 'ignored', 'amount_mismatch')),
  matched_order_id uuid references public.orders(id),
  raw_payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

alter table public.catalog_products enable row level security;
alter table public.promotions enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;

revoke all on public.catalog_products, public.promotions, public.bank_accounts,
  public.orders, public.order_items, public.payment_transactions from anon, authenticated;
grant all on public.catalog_products, public.promotions, public.bank_accounts,
  public.orders, public.order_items, public.payment_transactions to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into public.catalog_products (id, name, price, original_price, stock) values
  ('p-1', 'Táo Fuji Nhật Bản', 89000, 109000, 152),
  ('p-2', 'Chuối tiêu', 25000, 28000, 200),
  ('p-3', 'Thịt bò thăn', 285000, 285000, 35),
  ('p-4', 'Cá hồi tươi', 320000, 350000, 22),
  ('p-5', 'Súp lơ xanh', 18000, 22000, 88),
  ('p-6', 'Sữa tươi Vinamilk 1L', 32000, 35000, 120),
  ('p-7', 'Dâu tây Đà Lạt', 69000, 79000, 45),
  ('p-8', 'Cà rốt tươi Đà Lạt', 16000, 19000, 100),
  ('p-9', 'Cà chua Đà Lạt', 18000, 22000, 100),
  ('p-10', 'Khoai tây Đà Lạt', 22000, 25000, 100),
  ('p-11', 'Thịt gà ức', 89000, 95000, 50),
  ('p-12', 'Trứng gà ta Ba Huân', 28000, 32000, 100),
  ('p-13', 'Dưa leo sạch', 16000, 19000, 80),
  ('p-14', 'Nho xanh không hạt', 129000, 149000, 50),
  ('p-15', 'Cam Úc', 69000, 79000, 60),
  ('p-16', 'Lê Hàn Quốc', 89000, 99000, 55),
  ('p-17', 'Rau cải xanh', 18000, 22000, 90),
  ('p-18', 'Sữa tươi TH True Milk 1L', 32000, 35000, 110),
  ('p-19', 'Táo Envy New Zealand', 99000, 119000, 42),
  ('p-20', 'Táo Gala', 75000, 85000, 64),
  ('p-21', 'Xà lách thủy tinh', 22000, 26000, 70),
  ('p-22', 'Cà chua bi vàng Đà Lạt', 32000, 38000, 40)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  stock = excluded.stock,
  updated_at = now();

insert into public.promotions
  (code, title, discount_amount, min_order, starts_on, ends_on, is_active)
values
  ('FRESH30', 'Giảm 30K cho đơn từ 300K', 30000, 300000, '2026-06-01', '2026-06-30', true),
  ('FREESHIP', 'Miễn phí vận chuyển toàn quốc', 25000, 300000, '2026-06-01', '2026-12-31', true),
  ('FRESH50', 'Giảm 50K cho đơn từ 500K', 50000, 500000, '2026-06-15', '2026-09-30', true)
on conflict (code) do update set
  title = excluded.title,
  discount_amount = excluded.discount_amount,
  min_order = excluded.min_order,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_active = excluded.is_active;

create or replace function public.save_freshmart_bank_account(
  p_bank_id text,
  p_bank_name text,
  p_account_number text,
  p_account_name text,
  p_is_active boolean
) returns public.bank_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.bank_accounts;
  v_number text := regexp_replace(p_account_number, '[^A-Za-z0-9]', '', 'g');
begin
  if length(v_number) < 6 or length(trim(p_account_name)) < 3 then
    raise exception 'Thông tin tài khoản ngân hàng không hợp lệ';
  end if;

  if p_is_active then
    update public.bank_accounts set is_active = false, updated_at = now() where is_active;
  end if;

  insert into public.bank_accounts
    (bank_id, bank_name, account_number, account_name, is_active, updated_at)
  values
    (upper(trim(p_bank_id)), trim(p_bank_name), v_number, upper(trim(p_account_name)), p_is_active, now())
  on conflict (bank_id, account_number) do update set
    bank_name = excluded.bank_name,
    account_name = excluded.account_name,
    is_active = excluded.is_active,
    updated_at = now()
  returning * into v_account;

  return v_account;
end;
$$;

create or replace function public.create_freshmart_order(
  p_items jsonb,
  p_payment_method text,
  p_coupon_code text,
  p_recipient_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_latitude double precision,
  p_longitude double precision,
  p_delivery_date date,
  p_delivery_time_slot text,
  p_note text,
  p_access_token_hash text,
  p_customer_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_bank public.bank_accounts;
  v_product public.catalog_products;
  v_promotion public.promotions;
  v_item jsonb;
  v_quantity integer;
  v_subtotal integer := 0;
  v_current_total integer := 0;
  v_coupon_discount integer := 0;
  v_shipping_fee integer := 0;
  v_total integer := 0;
  v_code text;
  v_coupon text := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
begin
  if p_payment_method not in ('cod', 'bank_transfer') then
    raise exception 'Phương thức thanh toán không hợp lệ';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Giỏ hàng không hợp lệ';
  end if;
  if length(trim(p_recipient_name)) < 2 or length(trim(p_phone)) < 8 or length(trim(p_address)) < 8 then
    raise exception 'Thông tin nhận hàng không hợp lệ';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'Số lượng sản phẩm không hợp lệ'; end if;

    select * into v_product
    from public.catalog_products
    where id = v_item->>'productId' and is_active and stock >= v_quantity;
    if not found then raise exception 'Sản phẩm không tồn tại hoặc không đủ hàng: %', v_item->>'productId'; end if;

    v_subtotal := v_subtotal + (v_product.original_price * v_quantity);
    v_current_total := v_current_total + (v_product.price * v_quantity);
  end loop;

  v_shipping_fee := case when v_current_total >= 500000 then 0 else 25000 end;

  if v_coupon is not null then
    select * into v_promotion
    from public.promotions
    where code = v_coupon
      and is_active
      and current_date between starts_on and ends_on
      and v_current_total >= min_order;
    if not found then raise exception 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện'; end if;

    if v_coupon = 'FREESHIP' then
      v_shipping_fee := 0;
    elsif v_promotion.discount_amount is not null then
      v_coupon_discount := least(v_promotion.discount_amount, v_current_total);
    elsif v_promotion.discount_percent is not null then
      v_coupon_discount := least(v_current_total, round(v_current_total * v_promotion.discount_percent / 100.0));
    end if;
  end if;

  if p_payment_method = 'bank_transfer' then
    select * into v_bank from public.bank_accounts where is_active order by updated_at desc limit 1;
    if not found then raise exception 'Admin chưa cấu hình tài khoản nhận chuyển khoản'; end if;
  end if;

  v_total := greatest(0, v_current_total - v_coupon_discount + v_shipping_fee);
  v_code := 'FM' || to_char(clock_timestamp(), 'YYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    code, customer_id, access_token_hash, subtotal, product_discount, coupon_discount,
    shipping_fee, total, status, payment_method, payment_status, transfer_reference,
    payment_provider, payment_expires_at, bank_account_id, recipient_name, phone,
    email, address, latitude, longitude, delivery_date, delivery_time_slot, note, coupon_code
  ) values (
    v_code, p_customer_id, p_access_token_hash, v_subtotal, v_subtotal - v_current_total, v_coupon_discount,
    v_shipping_fee, v_total,
    case when p_payment_method = 'bank_transfer' then 'awaiting_payment' else 'pending' end,
    p_payment_method,
    case when p_payment_method = 'bank_transfer' then 'awaiting_confirmation' else 'cash_on_delivery' end,
    case when p_payment_method = 'bank_transfer' then v_code else null end,
    case when p_payment_method = 'bank_transfer' then 'sepay' else null end,
    case when p_payment_method = 'bank_transfer' then now() + interval '30 minutes' else null end,
    v_bank.id, trim(p_recipient_name), trim(p_phone), nullif(trim(p_email), ''), trim(p_address),
    p_latitude, p_longitude, p_delivery_date, trim(p_delivery_time_slot), nullif(trim(p_note), ''), v_coupon
  ) returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.catalog_products where id = v_item->>'productId';
    insert into public.order_items
      (order_id, product_id, product_name, unit_price, original_unit_price, quantity)
    values
      (v_order.id, v_product.id, v_product.name, v_product.price, v_product.original_price, v_quantity);
  end loop;

  return jsonb_build_object(
    'id', v_order.id,
    'code', v_order.code,
    'subtotal', v_order.subtotal,
    'productDiscount', v_order.product_discount,
    'couponDiscount', v_order.coupon_discount,
    'shippingFee', v_order.shipping_fee,
    'total', v_order.total,
    'status', v_order.status,
    'paymentStatus', v_order.payment_status,
    'transferReference', v_order.transfer_reference,
    'paymentExpiresAt', v_order.payment_expires_at,
    'bankAccount', case when v_bank.id is null then null else jsonb_build_object(
      'bankId', v_bank.bank_id,
      'bankName', v_bank.bank_name,
      'accountNumber', v_bank.account_number,
      'accountName', v_bank.account_name
    ) end
  );
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
  where is_active
    and regexp_replace(account_number, '[^A-Za-z0-9]', '', 'g') = regexp_replace(coalesce(p_payload->>'accountNumber', ''), '[^A-Za-z0-9]', '', 'g')
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
    and payment_status in ('awaiting_confirmation', 'review_required')
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

  update public.orders
    set payment_status = 'paid', status = 'pending', paid_at = now(), updated_at = now(),
        provider_transaction_id = v_provider_id
    where id = v_order.id;
  update public.payment_transactions
    set processing_status = 'matched', matched_order_id = v_order.id, transfer_reference = v_reference
    where id = v_transaction_id;

  return jsonb_build_object('duplicate', false, 'matched', true, 'orderId', v_order.id, 'orderCode', v_order.code);
end;
$$;

revoke all on function public.save_freshmart_bank_account(text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.create_freshmart_order(jsonb, text, text, text, text, text, text, double precision, double precision, date, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.process_sepay_webhook(jsonb) from public, anon, authenticated;
grant execute on function public.save_freshmart_bank_account(text, text, text, text, boolean) to service_role;
grant execute on function public.create_freshmart_order(jsonb, text, text, text, text, text, text, double precision, double precision, date, text, text, text, uuid) to service_role;
grant execute on function public.process_sepay_webhook(jsonb) to service_role;
