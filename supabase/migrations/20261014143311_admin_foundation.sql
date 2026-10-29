-- FreshMart admin foundation.
-- Authorization is based on auth.users.raw_app_meta_data.role, exposed in the JWT
-- as app_metadata.role. Never use user_metadata for authorization decisions.

create schema if not exists private;

alter table public.catalog_products
  add column if not exists sku text,
  add column if not exists slug text,
  add column if not exists category_slug text,
  add column if not exists category_name text,
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists unit text not null default 'Sản phẩm',
  add column if not exists origin text not null default 'Việt Nam',
  add column if not exists storage_instructions text not null default '',
  add column if not exists expiry text not null default '',
  add column if not exists rating numeric(3, 2) not null default 5 check (rating between 0 and 5),
  add column if not exists review_count integer not null default 0 check (review_count >= 0),
  add column if not exists sold_count text,
  add column if not exists is_organic boolean not null default false,
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists brand text,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists publication_status text not null default 'published'
    check (publication_status in ('draft', 'published', 'archived')),
  add column if not exists low_stock_threshold integer not null default 10
    check (low_stock_threshold >= 0),
  add column if not exists temporarily_unavailable boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

update public.catalog_products
set
  sku = coalesce(sku, upper(replace(id, '-', ''))),
  slug = coalesce(slug, id),
  category_slug = coalesce(category_slug, 'khac'),
  category_name = coalesce(category_name, 'Khác')
where sku is null or slug is null or category_slug is null or category_name is null;

alter table public.catalog_products
  alter column sku set not null,
  alter column slug set not null,
  alter column category_slug set not null,
  alter column category_name set not null;

create unique index if not exists catalog_products_sku_uidx
  on public.catalog_products (lower(sku));
create unique index if not exists catalog_products_slug_uidx
  on public.catalog_products (lower(slug));
create index if not exists catalog_products_public_listing_idx
  on public.catalog_products (category_slug, updated_at desc)
  where publication_status = 'published' and is_active;
create index if not exists catalog_products_low_stock_idx
  on public.catalog_products (stock)
  where publication_status <> 'archived' and is_active;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_slug_uidx on public.categories (lower(slug));
create index if not exists categories_listing_idx
  on public.categories (sort_order, name)
  where is_active;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.catalog_products(id) on delete restrict,
  movement_type text not null check (
    movement_type in ('initial', 'purchase', 'sale', 'reservation', 'release', 'adjustment', 'return')
  ),
  quantity_delta integer not null check (quantity_delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  reference_type text,
  reference_id text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_product_created_idx
  on public.inventory_movements (product_id, created_at desc);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  image_url text not null,
  mobile_image_url text,
  cta_text text not null default 'Xem ngay',
  cta_link text not null default '/',
  badge text,
  color_scheme text not null default 'green'
    check (color_scheme in ('green', 'orange', 'red')),
  placement text not null default 'home_hero'
    check (placement in ('home_hero', 'home_secondary', 'category', 'checkout')),
  sort_order integer not null default 0,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'scheduled', 'published', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create index if not exists banners_public_listing_idx
  on public.banners (placement, sort_order, created_at desc)
  where publication_status in ('scheduled', 'published');

alter table public.promotions
  add column if not exists description text,
  add column if not exists discount_type text not null default 'fixed'
    check (discount_type in ('fixed', 'percentage', 'free_shipping')),
  add column if not exists max_discount integer check (max_discount is null or max_discount >= 0),
  add column if not exists usage_limit integer check (usage_limit is null or usage_limit > 0),
  add column if not exists usage_limit_per_customer integer
    check (usage_limit_per_customer is null or usage_limit_per_customer > 0),
  add column if not exists usage_count integer not null default 0 check (usage_count >= 0),
  add column if not exists stackable boolean not null default false,
  add column if not exists publication_status text not null default 'published'
    check (publication_status in ('draft', 'scheduled', 'published', 'paused', 'archived')),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists promotions_public_lookup_idx
  on public.promotions (upper(code), starts_on, ends_on)
  where is_active and publication_status in ('scheduled', 'published');

create table if not exists public.promotion_products (
  promotion_code text not null references public.promotions(code) on delete cascade,
  product_id text not null references public.catalog_products(id) on delete cascade,
  primary key (promotion_code, product_id)
);

create table if not exists public.promotion_categories (
  promotion_code text not null references public.promotions(code) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (promotion_code, category_id)
);

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs (entity_type, entity_id, created_at desc);
create index if not exists admin_audit_logs_admin_idx
  on public.admin_audit_logs (admin_user_id, created_at desc);

create or replace function private.write_freshmart_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entity_id text;
begin
  v_entity_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'code', to_jsonb(old)->>'id', to_jsonb(old)->>'code');

  insert into public.admin_audit_logs (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(v_entity_id, 'unknown'),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists catalog_products_admin_audit on public.catalog_products;
create trigger catalog_products_admin_audit
after insert or update or delete on public.catalog_products
for each row execute function private.write_freshmart_admin_audit_log();

drop trigger if exists categories_admin_audit on public.categories;
create trigger categories_admin_audit
after insert or update or delete on public.categories
for each row execute function private.write_freshmart_admin_audit_log();

drop trigger if exists banners_admin_audit on public.banners;
create trigger banners_admin_audit
after insert or update or delete on public.banners
for each row execute function private.write_freshmart_admin_audit_log();

drop trigger if exists promotions_admin_audit on public.promotions;
create trigger promotions_admin_audit
after insert or update or delete on public.promotions
for each row execute function private.write_freshmart_admin_audit_log();

alter table public.categories enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.banners enable row level security;
alter table public.promotion_products enable row level security;
alter table public.promotion_categories enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Data API access is explicit because new Supabase projects may not expose new
-- public tables automatically. RLS below still determines which rows are visible.
grant select on public.catalog_products, public.categories, public.banners, public.promotions,
  public.promotion_products, public.promotion_categories to anon, authenticated;
grant insert, update, delete on public.catalog_products, public.categories, public.banners,
  public.promotions, public.promotion_products, public.promotion_categories to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select on public.admin_audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists "Public can read published products" on public.catalog_products;
create policy "Public can read published products"
on public.catalog_products for select
to anon, authenticated
using (publication_status = 'published' and is_active);

drop policy if exists "Admins manage products" on public.catalog_products;
create policy "Admins manage products"
on public.catalog_products for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
to anon, authenticated
using (is_active);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Public can read live banners" on public.banners;
create policy "Public can read live banners"
on public.banners for select
to anon, authenticated
using (
  publication_status in ('scheduled', 'published')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "Admins manage banners" on public.banners;
create policy "Admins manage banners"
on public.banners for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Public can read live promotions" on public.promotions;
create policy "Public can read live promotions"
on public.promotions for select
to anon, authenticated
using (
  is_active
  and publication_status in ('scheduled', 'published')
  and current_date between starts_on and ends_on
);

drop policy if exists "Admins manage promotions" on public.promotions;
create policy "Admins manage promotions"
on public.promotions for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Public can read active promotion products" on public.promotion_products;
create policy "Public can read active promotion products"
on public.promotion_products for select
to anon, authenticated
using (
  exists (
    select 1 from public.promotions p
    where p.code = promotion_code
      and p.is_active
      and p.publication_status in ('scheduled', 'published')
      and current_date between p.starts_on and p.ends_on
  )
);

drop policy if exists "Admins manage promotion products" on public.promotion_products;
create policy "Admins manage promotion products"
on public.promotion_products for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Public can read active promotion categories" on public.promotion_categories;
create policy "Public can read active promotion categories"
on public.promotion_categories for select
to anon, authenticated
using (
  exists (
    select 1 from public.promotions p
    where p.code = promotion_code
      and p.is_active
      and p.publication_status in ('scheduled', 'published')
      and current_date between p.starts_on and p.ends_on
  )
);

drop policy if exists "Admins manage promotion categories" on public.promotion_categories;
create policy "Admins manage promotion categories"
on public.promotion_categories for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins read inventory movements" on public.inventory_movements;
create policy "Admins read inventory movements"
on public.inventory_movements for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins create inventory movements" on public.inventory_movements;
create policy "Admins create inventory movements"
on public.inventory_movements for insert
to authenticated
with check (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and created_by = (select auth.uid())
);

drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs"
on public.admin_audit_logs for select
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

create or replace function public.adjust_freshmart_inventory(
  p_product_id text,
  p_quantity_delta integer,
  p_movement_type text default 'adjustment',
  p_note text default null,
  p_reference_type text default null,
  p_reference_id text default null
) returns public.catalog_products
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product public.catalog_products;
  v_new_stock integer;
begin
  if ((select auth.jwt()->'app_metadata'->>'role') is distinct from 'admin') then
    raise exception 'Bạn không có quyền điều chỉnh tồn kho';
  end if;

  if p_quantity_delta = 0 then
    raise exception 'Số lượng điều chỉnh phải khác 0';
  end if;

  if p_movement_type not in ('initial', 'purchase', 'sale', 'reservation', 'release', 'adjustment', 'return') then
    raise exception 'Loại biến động kho không hợp lệ';
  end if;

  select * into v_product
  from public.catalog_products
  where id = p_product_id
  for update;

  if not found then raise exception 'Không tìm thấy sản phẩm'; end if;

  v_new_stock := v_product.stock + p_quantity_delta;
  if v_new_stock < 0 then raise exception 'Tồn kho không thể nhỏ hơn 0'; end if;

  update public.catalog_products
  set stock = v_new_stock, updated_at = now()
  where id = p_product_id
  returning * into v_product;

  insert into public.inventory_movements (
    product_id, movement_type, quantity_delta, stock_after,
    reference_type, reference_id, note, created_by
  ) values (
    p_product_id, p_movement_type, p_quantity_delta, v_new_stock,
    nullif(trim(p_reference_type), ''), nullif(trim(p_reference_id), ''),
    nullif(trim(p_note), ''), auth.uid()
  );

  return v_product;
end;
$$;

revoke all on function public.adjust_freshmart_inventory(text, integer, text, text, text, text)
  from public, anon;
grant execute on function public.adjust_freshmart_inventory(text, integer, text, text, text, text)
  to authenticated;

-- Seed categories from the current storefront. Re-running is safe.
insert into public.categories (name, slug, sort_order, is_active) values
  ('Rau củ quả', 'rau-cu-qua', 10, true),
  ('Trái cây tươi', 'trai-cay-tuoi', 20, true),
  ('Thịt, hải sản', 'thit-hai-san', 30, true),
  ('Thực phẩm chế biến', 'thuc-pham-che-bien', 40, true),
  ('Sữa & trứng', 'sua-trung', 50, true),
  ('Đồ khô, gia vị', 'do-kho-gia-vi', 60, true),
  ('Đồ uống', 'do-uong', 70, true),
  ('Bánh kẹo, ăn vặt', 'banh-keo-an-vat', 80, true),
  ('Thực phẩm hữu cơ', 'thuc-pham-huu-co', 90, true),
  ('Combo tiết kiệm', 'combo-tiet-kiem', 100, true)
on conflict (lower(slug)) do nothing;

insert into public.banners (
  id, title, subtitle, image_url, cta_text, cta_link, badge,
  color_scheme, placement, sort_order, publication_status
) values
  (
    '00000000-0000-4000-8000-000000000001',
    E'Thực phẩm tươi sạch\nCho bữa ăn an toàn',
    'Nguồn gốc rõ ràng • Giao hàng tận nơi • Tươi ngon mỗi ngày',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    'Mua ngay', '/products', 'Tươi ngon mỗi ngày', 'green', 'home_hero', 10, 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    E'Trái cây tươi\nGiảm đến 30%',
    'Trái cây nội địa & nhập khẩu tươi ngon ngọt mát',
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
    'Mua ngay', '/category/trai-cay-tuoi', null, 'orange', 'home_secondary', 20, 'published'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    E'Thịt sạch, an toàn\nƯu đãi tuần này',
    'Kiểm dịch đầy đủ, nguồn gốc trang trại tiêu chuẩn',
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
    'Mua ngay', '/category/thit-hai-san', null, 'red', 'home_secondary', 30, 'published'
  )
on conflict (id) do nothing;

update public.promotions
set discount_type = case
  when code = 'FREESHIP' then 'free_shipping'
  when discount_percent is not null then 'percentage'
  else 'fixed'
end;
