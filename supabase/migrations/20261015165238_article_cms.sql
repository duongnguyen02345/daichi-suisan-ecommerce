-- FreshMart article CMS and representative media storage.

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title varchar(150) not null check (char_length(btrim(title)) between 1 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt varchar(300) not null default '',
  content text not null check (char_length(btrim(content)) > 0),
  cover_url text not null default '',
  cover_type text not null default 'image' check (cover_type in ('image', 'video')),
  category text not null default 'Tin tức',
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publication_status <> 'published' or published_at is not null)
);

create index if not exists articles_publication_idx
  on public.articles (publication_status, published_at desc);
create index if not exists articles_category_idx
  on public.articles (category, published_at desc);

create or replace function public.set_article_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_articles_updated_at on public.articles;
create trigger set_articles_updated_at
before update on public.articles
for each row execute function public.set_article_updated_at();

alter table public.articles enable row level security;

grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

drop policy if exists "Public can read published articles" on public.articles;
create policy "Public can read published articles"
on public.articles
for select
to anon, authenticated
using (
  publication_status = 'published'
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Admins can manage articles" on public.articles;
create policy "Admins can manage articles"
on public.articles
for all
to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-media',
  'article-media',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload article media" on storage.objects;
create policy "Admins can upload article media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'article-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins can update article media" on storage.objects;
create policy "Admins can update article media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'article-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
)
with check (
  bucket_id = 'article-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);

drop policy if exists "Admins can delete article media" on storage.objects;
create policy "Admins can delete article media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'article-media'
  and (select auth.jwt()->'app_metadata'->>'role') = 'admin'
);
