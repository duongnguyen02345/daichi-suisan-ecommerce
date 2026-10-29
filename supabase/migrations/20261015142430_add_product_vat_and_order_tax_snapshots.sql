alter table public.catalog_products
  add column vat_rate numeric(5, 2) not null default 0
    check (vat_rate between 0 and 100),
  add column vat_calculation text not null default 'inclusive'
    check (vat_calculation in ('exclusive', 'inclusive'));

alter table public.orders
  add column net_subtotal integer not null default 0 check (net_subtotal >= 0),
  add column vat_total integer not null default 0 check (vat_total >= 0);

alter table public.order_items
  add column vat_rate numeric(5, 2) not null default 0
    check (vat_rate between 0 and 100),
  add column vat_calculation text not null default 'inclusive'
    check (vat_calculation in ('exclusive', 'inclusive')),
  add column net_unit_price integer not null default 0 check (net_unit_price >= 0),
  add column vat_unit_amount integer not null default 0 check (vat_unit_amount >= 0);

comment on column public.catalog_products.vat_calculation is
  'exclusive: giá nhập chưa gồm VAT; inclusive: giá nhập đã gồm VAT';
comment on column public.orders.net_subtotal is
  'Tổng tiền hàng trước VAT, trước mã giảm giá và phí vận chuyển';
comment on column public.orders.vat_total is
  'Tổng VAT của tiền hàng tại thời điểm đặt đơn';

drop policy if exists "Public can read published products" on public.catalog_products;
create policy "Public can read published products"
on public.catalog_products for select
to anon, authenticated
using (
  publication_status = 'published'
  and is_active
  and exists (
    select 1
    from public.categories
    where categories.slug = catalog_products.category_slug
      and categories.is_active
  )
);

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
  v_net_unit_price integer;
  v_vat_unit_amount integer;
  v_gross_unit_price integer;
  v_original_gross_unit_price integer;
  v_subtotal integer := 0;
  v_net_subtotal integer := 0;
  v_vat_total integer := 0;
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
    where id = v_item->>'productId'
      and is_active
      and publication_status = 'published'
      and not temporarily_unavailable
      and stock >= v_quantity;
    if not found then raise exception 'Sản phẩm không tồn tại hoặc không đủ hàng: %', v_item->>'productId'; end if;

    if v_product.vat_calculation = 'exclusive' then
      v_net_unit_price := v_product.price;
      v_vat_unit_amount := round(v_product.price * v_product.vat_rate / 100.0);
      v_gross_unit_price := v_net_unit_price + v_vat_unit_amount;
      v_original_gross_unit_price := v_product.original_price
        + round(v_product.original_price * v_product.vat_rate / 100.0);
    else
      v_gross_unit_price := v_product.price;
      v_net_unit_price := case
        when v_product.vat_rate = 0 then v_product.price
        else round(v_product.price * 100.0 / (100.0 + v_product.vat_rate))
      end;
      v_vat_unit_amount := v_gross_unit_price - v_net_unit_price;
      v_original_gross_unit_price := v_product.original_price;
    end if;

    v_subtotal := v_subtotal + (v_original_gross_unit_price * v_quantity);
    v_net_subtotal := v_net_subtotal + (v_net_unit_price * v_quantity);
    v_vat_total := v_vat_total + (v_vat_unit_amount * v_quantity);
    v_current_total := v_current_total + (v_gross_unit_price * v_quantity);
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
    code, customer_id, access_token_hash, subtotal, net_subtotal, vat_total,
    product_discount, coupon_discount, shipping_fee, total, status, payment_method,
    payment_status, transfer_reference, payment_provider, payment_expires_at,
    bank_account_id, recipient_name, phone, email, address, latitude, longitude,
    delivery_date, delivery_time_slot, note, coupon_code
  ) values (
    v_code, p_customer_id, p_access_token_hash, v_subtotal, v_net_subtotal, v_vat_total,
    v_subtotal - v_current_total, v_coupon_discount, v_shipping_fee, v_total,
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

    if v_product.vat_calculation = 'exclusive' then
      v_net_unit_price := v_product.price;
      v_vat_unit_amount := round(v_product.price * v_product.vat_rate / 100.0);
      v_gross_unit_price := v_net_unit_price + v_vat_unit_amount;
      v_original_gross_unit_price := v_product.original_price
        + round(v_product.original_price * v_product.vat_rate / 100.0);
    else
      v_gross_unit_price := v_product.price;
      v_net_unit_price := case
        when v_product.vat_rate = 0 then v_product.price
        else round(v_product.price * 100.0 / (100.0 + v_product.vat_rate))
      end;
      v_vat_unit_amount := v_gross_unit_price - v_net_unit_price;
      v_original_gross_unit_price := v_product.original_price;
    end if;

    insert into public.order_items (
      order_id, product_id, product_name, unit_price, original_unit_price, quantity,
      vat_rate, vat_calculation, net_unit_price, vat_unit_amount
    ) values (
      v_order.id, v_product.id, v_product.name, v_gross_unit_price,
      v_original_gross_unit_price, v_quantity, v_product.vat_rate,
      v_product.vat_calculation, v_net_unit_price, v_vat_unit_amount
    );
  end loop;

  return jsonb_build_object(
    'id', v_order.id,
    'code', v_order.code,
    'subtotal', v_order.subtotal,
    'netSubtotal', v_order.net_subtotal,
    'vatTotal', v_order.vat_total,
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
