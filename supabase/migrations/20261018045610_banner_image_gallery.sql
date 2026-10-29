alter table public.banners
  add column if not exists image_gallery text[] not null default '{}'::text[];

update public.banners
set image_gallery = array[image_url]
where cardinality(image_gallery) = 0;

-- Collapse legacy rows that shared one placement into a single banner area.
-- Their existing images become ordered gallery items on the first row.
with area_images as (
  select
    placement,
    (array_agg(id order by sort_order, created_at))[1] as keeper_id,
    (array_agg(image_url order by sort_order, created_at))[1:10] as images
  from public.banners
  where publication_status <> 'archived'
  group by placement
)
update public.banners as banner
set
  image_url = area.images[1],
  image_gallery = area.images,
  updated_at = now()
from area_images as area
where banner.id = area.keeper_id;

with area_keepers as (
  select
    placement,
    (array_agg(id order by sort_order, created_at))[1] as keeper_id
  from public.banners
  where publication_status <> 'archived'
  group by placement
)
update public.banners as banner
set publication_status = 'archived', updated_at = now()
from area_keepers as area
where banner.placement = area.placement
  and banner.id <> area.keeper_id
  and banner.publication_status <> 'archived';

alter table public.banners
  drop constraint if exists banners_image_gallery_size_check;

alter table public.banners
  add constraint banners_image_gallery_size_check
  check (cardinality(image_gallery) between 1 and 10);

create unique index if not exists banners_one_current_area_idx
  on public.banners (placement)
  where publication_status <> 'archived';

comment on column public.banners.image_gallery is
  'Ordered desktop image URLs for automatic banner carousel; image_url mirrors the first item for backwards compatibility.';
