-- Website CMS foundation for DAICHI SUISAN.
-- Public visitors can only read the published singleton profile and active media.
-- Administrative writes are authorized with auth.users.raw_app_meta_data.role.

create table if not exists public.site_profiles (
  id text primary key default 'primary' check (id = 'primary'),
  brand_name varchar(120) not null,
  legal_name varchar(220) not null,
  tagline varchar(220) not null default '',
  company_description text not null default '',
  tax_code varchar(40) not null default '',
  hotline varchar(40) not null default '',
  support_label varchar(100) not null default '',
  email varchar(254) not null default '',
  address text not null default '',
  business_hours varchar(180) not null default '',
  logo_url text not null default '',
  favicon_url text not null default '',
  copyright_text text not null default '',
  is_published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'site-media',
  object_path text not null unique,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text varchar(240) not null default '',
  uploaded_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_active_created_idx
  on public.media_assets (created_at desc)
  where archived_at is null;

create or replace function public.set_site_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_profiles_updated_at on public.site_profiles;
create trigger set_site_profiles_updated_at
before update on public.site_profiles
for each row execute function public.set_site_profile_updated_at();

insert into public.site_profiles (
  id,
  brand_name,
  legal_name,
  tagline,
  company_description,
  tax_code,
  hotline,
  support_label,
  email,
  address,
  business_hours,
  copyright_text,
  is_published
)
values (
  'primary',
  'DAICHI SUISAN',
  'Công ty TNHH Thương mại và Dịch vụ DAICHI SUISAN',
  'Tinh hoa thực phẩm Nhật',
  'Mang tinh hoa thực phẩm Nhật Bản đến gần hơn với mọi gia đình.',
  '0111155633',
  '0398 018 639',
  'Hỗ trợ theo giờ làm việc',
  '',
  '446 Đội Cấn, Ba Đình, Hà Nội',
  'Theo giờ làm việc do quản trị viên cấu hình',
  'DAICHI SUISAN TRADING AND SERVICES COMPANY LIMITED. Tất cả quyền được bảo lưu.',
  true
)
on conflict (id) do nothing;

alter table public.site_profiles enable row level security;
alter table public.media_assets enable row level security;

revoke all on public.site_profiles from anon, authenticated;
revoke all on public.media_assets from anon, authenticated;

grant select on public.site_profiles to anon, authenticated;
grant insert, update on public.site_profiles to authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, update, delete on public.media_assets to authenticated;

drop policy if exists "Public read published site profile" on public.site_profiles;
create policy "Public read published site profile"
on public.site_profiles for select
to anon, authenticated
using (
  is_published = true
  or (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins create site profile" on public.site_profiles;
create policy "Admins create site profile"
on public.site_profiles for insert
to authenticated
with check (
  id = 'primary'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (updated_by is null or updated_by = (select auth.uid()))
);

drop policy if exists "Admins update site profile" on public.site_profiles;
create policy "Admins update site profile"
on public.site_profiles for update
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check (
  id = 'primary'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (updated_by is null or updated_by = (select auth.uid()))
);

drop policy if exists "Public read active media metadata" on public.media_assets;
create policy "Public read active media metadata"
on public.media_assets for select
to anon, authenticated
using (
  archived_at is null
  or (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins create media metadata" on public.media_assets;
create policy "Admins create media metadata"
on public.media_assets for insert
to authenticated
with check (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (uploaded_by is null or uploaded_by = (select auth.uid()))
);

drop policy if exists "Admins update media metadata" on public.media_assets;
create policy "Admins update media metadata"
on public.media_assets for update
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admins delete media metadata" on public.media_assets;
create policy "Admins delete media metadata"
on public.media_assets for delete
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read site media" on storage.objects;
drop policy if exists "Admins read site media" on storage.objects;
create policy "Public read site media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-media');

drop policy if exists "Admins upload site media" on storage.objects;
create policy "Admins upload site media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins update site media" on storage.objects;
create policy "Admins update site media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'site-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
)
with check (
  bucket_id = 'site-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins delete site media" on storage.objects;
create policy "Admins delete site media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'site-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);
