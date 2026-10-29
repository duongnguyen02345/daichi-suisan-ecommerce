begin;

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);

set local role authenticated;

insert into public.catalog_products (
  id,
  name,
  price,
  original_price,
  stock,
  sku,
  slug,
  category_slug,
  category_name
) values (
  'p-admin-save-flow-test',
  'Sản phẩm kiểm thử lưu admin',
  25000,
  30000,
  5,
  'ADMIN-SAVE-FLOW-TEST',
  'san-pham-kiem-thu-luu-admin',
  'rau-cu-qua',
  'Rau củ quả'
);

reset role;
rollback;

select 'admin product insert through RLS verified; test row rolled back' as result;
