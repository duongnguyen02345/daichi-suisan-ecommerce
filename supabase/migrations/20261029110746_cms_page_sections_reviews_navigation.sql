-- CMS Page Sections, Navigation Menus, SEO Settings, and Product Reviews
-- Provides schema and RLS for page management, site menus, SEO metadata, and product reviews.

-- 1. PAGE SECTIONS TABLE
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  title text not null default '',
  subtitle text not null default '',
  body jsonb not null default '{}'::jsonb,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  cta_text text not null default '',
  cta_link text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  publication_status text not null default 'published'
    check (publication_status in ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint page_sections_page_section_unique unique (page_key, section_key)
);

create index if not exists page_sections_public_idx
  on public.page_sections (page_key, sort_order)
  where is_visible = true and publication_status = 'published';

create or replace function public.set_page_sections_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_page_sections_updated_at_trg on public.page_sections;
create trigger set_page_sections_updated_at_trg
before update on public.page_sections
for each row execute function public.set_page_sections_updated_at();

-- 2. SITE NAVIGATION / MENUS
create table if not exists public.site_navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_location text not null check (menu_location in ('header', 'footer', 'footer_quick_links', 'footer_policy', 'mobile')),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  is_external boolean not null default false,
  open_in_new_tab boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_navigation_items_location_idx
  on public.site_navigation_items (menu_location, sort_order)
  where is_active = true;

-- 3. SITE SEO SETTINGS
create table if not exists public.site_seo_settings (
  id uuid primary key default gen_random_uuid(),
  page_path text not null unique,
  meta_title text not null default '',
  meta_description text not null default '',
  og_image_url text not null default '',
  og_title text not null default '',
  og_description text not null default '',
  canonical_url text not null default '',
  keywords text not null default '',
  is_indexable boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 4. PRODUCT REVIEWS TABLE
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.catalog_products(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null default '',
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  comment text not null,
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'hidden', 'spam')),
  admin_reply text not null default '',
  admin_replied_at timestamptz,
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_reviews_product_approved_idx
  on public.product_reviews (product_id, created_at desc)
  where status = 'approved';

-- 5. RLS POLICIES & GRANTS

alter table public.page_sections enable row level security;
alter table public.site_navigation_items enable row level security;
alter table public.site_seo_settings enable row level security;
alter table public.product_reviews enable row level security;

revoke all on public.page_sections from anon, authenticated;
revoke all on public.site_navigation_items from anon, authenticated;
revoke all on public.site_seo_settings from anon, authenticated;
revoke all on public.product_reviews from anon, authenticated;

grant select on public.page_sections to anon, authenticated;
grant insert, update, delete on public.page_sections to authenticated;

grant select on public.site_navigation_items to anon, authenticated;
grant insert, update, delete on public.site_navigation_items to authenticated;

grant select on public.site_seo_settings to anon, authenticated;
grant insert, update, delete on public.site_seo_settings to authenticated;

grant select on public.product_reviews to anon, authenticated;
grant insert on public.product_reviews to anon, authenticated;
grant update, delete on public.product_reviews to authenticated;

-- Policies for page_sections
drop policy if exists "Public read published sections" on public.page_sections;
create policy "Public read published sections"
on public.page_sections for select
to anon, authenticated
using (
  (is_visible = true and publication_status = 'published')
  or (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins insert page sections" on public.page_sections;
create policy "Admins insert page sections"
on public.page_sections for insert
to authenticated
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins update page sections" on public.page_sections;
create policy "Admins update page sections"
on public.page_sections for update
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins delete page sections" on public.page_sections;
create policy "Admins delete page sections"
on public.page_sections for delete
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Policies for site_navigation_items
drop policy if exists "Public read active navigation items" on public.site_navigation_items;
create policy "Public read active navigation items"
on public.site_navigation_items for select
to anon, authenticated
using (
  is_active = true
  or (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins manage navigation items" on public.site_navigation_items;
create policy "Admins manage navigation items"
on public.site_navigation_items for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Policies for site_seo_settings
drop policy if exists "Public read seo settings" on public.site_seo_settings;
create policy "Public read seo settings"
on public.site_seo_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage seo settings" on public.site_seo_settings;
create policy "Admins manage seo settings"
on public.site_seo_settings for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Policies for product_reviews
drop policy if exists "Public read approved reviews" on public.product_reviews;
create policy "Public read approved reviews"
on public.product_reviews for select
to anon, authenticated
using (
  status = 'approved'
  or (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  or customer_id = (select auth.uid())
);

drop policy if exists "Anyone can submit review" on public.product_reviews;
create policy "Anyone can submit review"
on public.product_reviews for insert
to anon, authenticated
with check (
  rating between 1 and 5
  and length(comment) > 0
);

drop policy if exists "Admins manage reviews" on public.product_reviews;
create policy "Admins manage reviews"
on public.product_reviews for update
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins delete reviews" on public.product_reviews;
create policy "Admins delete reviews"
on public.product_reviews for delete
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 6. SEED DATA

-- Seed page_sections
insert into public.page_sections (page_key, section_key, title, subtitle, body, cta_text, cta_link, sort_order, is_visible, publication_status)
values
  ('home', 'hero', 'Hải Sản Tươi Ngon Chuẩn Nhật', 'Nhập khẩu trực tiếp từ ngư trường Toyosu & Hokkaido', '{"badge": "HẢI SẢN CAO CẤP", "features": ["Giao hỏa tốc 2H", "Chuẩn sashimi 100%", "Bảo quản âm sâu -60°C"]}'::jsonb, 'Khám phá ngay', '/products', 1, true, 'published'),
  ('home', 'intro', 'Về DAICHI SUISAN', 'Đưa tinh hoa ẩm thực xứ hoa anh đào tới bàn ăn Việt', '{"description": "DAICHI SUISAN tự hào là cầu nối ẩm thực biển Nhật Bản cao cấp. Mỗi loại hải sản đều được tuyển lựa nghiêm ngặt và vận chuyển đường hàng không để đảm bảo độ tươi tuyệt hảo."}'::jsonb, 'Xem thêm', '/about', 2, true, 'published'),
  ('home', 'artisan', 'Nghệ Thuật Xử Lý Chuẩn Sashimi', 'Phương pháp Ikijime giữ trọn vẹn vị umami tự nhiên', '{"quote": "Sự tươi ngon không chỉ là thời gian, đó là cả một nghệ thuật bảo quản và chế biến chuẩn mực Nhật Bản."}'::jsonb, 'Tìm hiểu quy trình', '/about', 3, true, 'published'),
  ('home', 'commitments', 'Cam Kết Vàng Từ DAICHI SUISAN', 'Tiêu chuẩn chất lượng vượt trội', '{"items": [{"title": "100% Nguồn Gốc Nhật", "desc": "Có đầy đủ chứng nhận xuất xứ CO/CQ từng lô hàng"}, {"title": "Cấp Đông Siêu Tốc", "desc": "Công nghệ cấp đông proton giữ trọn vẹn kết cấu tế bào cá"}, {"title": "Giao Hàng Chuyên Biệt", "desc": "Thùng lạnh giữ nhiệt chuyên dụng kèm đá gel tiêu chuẩn"}]}'::jsonb, '', '', 4, true, 'published'),
  ('about', 'hero', 'Câu Chuyện DAICHI SUISAN', 'Hành trình mang hương vị biển Nhật đến gia đình Việt', '{"badge": "VỀ CHÚNG TÔI"}'::jsonb, '', '', 1, true, 'published'),
  ('about', 'vision', 'Tầm Nhìn & Sứ Mệnh', 'Trở thành thương hiệu hải sản Nhật Bản uy tín hàng đầu', '{"vision": "Xây dựng chuỗi cung ứng hải sản Nhật chất lượng cao và minh bạch số một tại Việt Nam.", "mission": "Đem đến nguồn thực phẩm an lành, dinh dưỡng tinh hoa và trải nghiệm trọn vẹn cho khách hàng."}'::jsonb, '', '', 2, true, 'published'),
  ('about', 'values', 'Giá Trị Cốt Lõi', 'Chất Lượng - Minh Bạch - Tận Tâm', '{"values": [{"name": "Chất Lượng Thật", "desc": "Không thỏa hiệp về độ tươi ngon"}, {"name": "Minh Bạch", "desc": "Nguồn gốc rõ ràng và kiểm định nghiêm ngặt"}, {"name": "Tận Tâm", "desc": "Phục vụ chu đáo mọi yêu cầu của khách hàng"}]}'::jsonb, '', '', 3, true, 'published'),
  ('contact', 'hero', 'Liên Hệ Với Chúng Tôi', 'Chúng tôi luôn sẵn sàng hỗ trợ quý khách', '{"hotline": "0398 018 639", "address": "446 Đội Cấn, Ba Đình, Hà Nội", "hours": "08:00 - 21:00 hàng ngày"}'::jsonb, 'Gọi ngay', 'tel:0398018639', 1, true, 'published'),
  ('common', 'header_notice', 'Thông Báo Website', 'Giao hàng miễn phí cho đơn từ 1.000.000đ trong nội thành Hà Nội', '{}'::jsonb, '', '', 1, true, 'published')
on conflict (page_key, section_key) do nothing;

-- Seed site_navigation_items
insert into public.site_navigation_items (menu_location, label, url, sort_order, is_external, open_in_new_tab, is_active)
values
  ('header', 'Trang chủ', '/', 1, false, false, true),
  ('header', 'Sản phẩm', '/products', 2, false, false, true),
  ('header', 'Về chúng tôi', '/about', 3, false, false, true),
  ('header', 'Bài viết', '/articles', 4, false, false, true),
  ('header', 'Liên hệ', '/contact', 5, false, false, true),
  ('footer_quick_links', 'Trang chủ', '/', 1, false, false, true),
  ('footer_quick_links', 'Danh mục sản phẩm', '/products', 2, false, false, true),
  ('footer_quick_links', 'Về chúng tôi', '/about', 3, false, false, true),
  ('footer_quick_links', 'Tin tức & Khuyến mại', '/articles', 4, false, false, true),
  ('footer_quick_links', 'Liên hệ & Bản đồ', '/contact', 5, false, false, true),
  ('footer_policy', 'Chính sách giao hàng', '/shipping-policy', 1, false, false, true),
  ('footer_policy', 'Chính sách đổi trả', '/refund-policy', 2, false, false, true),
  ('footer_policy', 'Bảo mật thông tin', '/privacy-policy', 3, false, false, true),
  ('footer_policy', 'Hướng dẫn mua hàng', '/ordering-guide', 4, false, false, true)
on conflict do nothing;

-- Seed site_seo_settings
insert into public.site_seo_settings (page_path, meta_title, meta_description, keywords, is_indexable)
values
  ('default', 'DAICHI SUISAN - Tinh Hoa Hải Sản Nhật Bản', 'Chuyên cung cấp hải sản cao cấp nhập khẩu trực tiếp từ Nhật Bản: Cá hồi Nauy, Cá ngừ đại dương, Bào ngư, Sò điệp Hotate, Cua Tuyết...', 'hải sản nhật bản, sashimi, daichi suisan, cá hồi, sò điệp hokkaido', true),
  ('/', 'DAICHI SUISAN | Tinh Hoa Thực Phẩm Nhật Bản', 'Hải sản nhập khẩu trực tiếp từ ngư trường Toyosu & Hokkaido. Giao hàng hỏa tốc trong 2 giờ.', 'hải sản nhật, sashimi tươi, thực phẩm nhật bản, daichi suisan', true),
  ('/about', 'Về Chúng Tôi - DAICHI SUISAN', 'Tìm hiểu câu chuyện, sứ mệnh và cam kết chất lượng của DAICHI SUISAN trong hành trình mang tinh hoa ẩm thực biển Nhật Bản.', 'về daichi suisan, câu chuyện thương hiệu, hải sản nhật chất lượng', true),
  ('/contact', 'Liên Hệ - DAICHI SUISAN', 'Liên hệ đặt hàng, hỗ trợ dịch vụ khách hàng và phản ánh chất lượng. Hotline: 0398 018 639.', 'liên hệ daichi suisan, địa chỉ hải sản nhật, hotline đặt hàng', true),
  ('/products', 'Tất Cả Sản Phẩm - DAICHI SUISAN', 'Khám phá danh mục hải sản Nhật Bản cao cấp: Sashimi, Cá tươi, Đồ khô & Gia vị truyền thống.', 'sản phẩm daichi suisan, mua sashimi, hải sản nhập khẩu', true),
  ('/articles', 'Tin Tức & Kiến Thức Ẩm Thực - DAICHI SUISAN', 'Cập nhật kiến thức ẩm thực Nhật, công thức chế biến sashimi và các chương trình ưu đãi mới nhất.', 'kiến thức ẩm thực nhật, công thức sashimi, ưu đãi hải sản', true)
on conflict (page_path) do nothing;
