-- Migration: Enable Category Drag & Drop Reorder and Promotion as Category
-- 1. Allow reading all categories (both active and inactive) so Admin panel can display inactive categories to re-activate
drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (true);

-- 2. Allow updating categories for reordering and active toggle
drop policy if exists "Public can update categories" on public.categories;
create policy "Public can update categories"
on public.categories for update
to anon, authenticated
using (true)
with check (true);

-- 3. Insert or update the 'Khuyến mại' category
insert into public.categories (name, slug, description, image_url, sort_order, is_active)
values (
  'Khuyến mại',
  'khuyen-mai',
  'Ưu đãi nổi bật với giá bán thấp hơn giá gốc, được cập nhật trực tiếp từ sản phẩm.',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
  0,
  true
)
on conflict (lower(slug)) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  is_active = true,
  updated_at = now();

-- 4. Reorder function for batch updating sort orders
create or replace function public.reorder_freshmart_categories(
  p_items jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(p_items) loop
    update public.categories
    set sort_order = (item->>'sort_order')::int,
        updated_at = now()
    where id = (item->>'id')::uuid;
  end loop;
end;
$$;

grant execute on function public.reorder_freshmart_categories(jsonb) to anon, authenticated;
