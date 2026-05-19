-- "호캉스 어디?" 도메인: stays / stay_videos / stay_blogs
-- 꽃 명소(spots)와 별도 도메인으로 분리.

begin;

create table if not exists public.stays (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region_primary text not null,
  region_secondary text not null,
  address text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  stay_type text not null check (stay_type in ('city', 'resort', 'poolvilla', 'onsen', 'kids')),
  season_tags text[] not null default '{}',
  season_window_start text check (
    season_window_start is null
    or season_window_start ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
  ),
  season_window_end text check (
    season_window_end is null
    or season_window_end ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
  ),
  short_tagline text not null,
  description text not null,
  recommendation_points text[] not null default '{}'
    check (array_length(recommendation_points, 1) is null or array_length(recommendation_points, 1) <= 10),
  thumbnail_url text,
  booking_query_override text,
  naver_rating_score numeric(2, 1) check (naver_rating_score is null or naver_rating_score between 0 and 5),
  naver_rating_url text,
  google_rating_score numeric(2, 1) check (google_rating_score is null or google_rating_score between 0 and 5),
  google_rating_url text,
  rating_captured_at date,
  source_type text not null default 'manual_json' check (source_type = 'manual_json'),
  source_note text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug ~ '^[a-z0-9-]+$'),
  check ((season_window_start is null) = (season_window_end is null)),
  check ((naver_rating_score is null) = (naver_rating_url is null)),
  check ((google_rating_score is null) = (google_rating_url is null)),
  check (
    (naver_rating_score is null and google_rating_score is null)
    or rating_captured_at is not null
  )
);

alter table public.stays enable row level security;

drop trigger if exists stays_set_updated_at on public.stays;
create trigger stays_set_updated_at
before update on public.stays
for each row
execute function public.set_updated_at();

drop policy if exists stays_authenticated_all on public.stays;
create policy stays_authenticated_all
on public.stays
for all
to authenticated
using (true)
with check (true);

drop policy if exists stays_anon_read on public.stays;
create policy stays_anon_read
on public.stays
for select
using (status = 'published');

create index if not exists stays_status_order_idx
  on public.stays (status, display_order);

create index if not exists stays_published_featured_idx
  on public.stays (is_featured desc, display_order)
  where status = 'published';

create table if not exists public.stay_videos (
  id              uuid primary key default gen_random_uuid(),
  stay_id         uuid not null references public.stays(id) on delete cascade,
  video_id        text not null,
  title           text not null,
  channel_title   text,
  thumbnail_url   text,
  published_at    timestamptz,
  view_count      integer,
  relevance_score numeric(3, 2),
  fetched_at      timestamptz not null default now(),
  unique (stay_id, video_id)
);

create index if not exists stay_videos_stay_rel_idx
  on public.stay_videos (stay_id, relevance_score desc, published_at desc);

alter table public.stay_videos enable row level security;

drop policy if exists "stay_videos_anon_read" on public.stay_videos;
create policy "stay_videos_anon_read" on public.stay_videos
for select
using (
  exists (
    select 1 from public.stays s
    where s.id = stay_videos.stay_id and s.status = 'published'
  )
);

create table if not exists public.stay_blogs (
  id              uuid primary key default gen_random_uuid(),
  stay_id         uuid not null references public.stays(id) on delete cascade,
  url             text not null,
  title           text not null,
  description     text,
  blogger_name    text,
  posted_at       timestamptz,
  relevance_score numeric(3, 2),
  fetched_at      timestamptz not null default now(),
  unique (stay_id, url)
);

create index if not exists stay_blogs_stay_rel_idx
  on public.stay_blogs (stay_id, relevance_score desc, posted_at desc);

alter table public.stay_blogs enable row level security;

drop policy if exists "stay_blogs_anon_read" on public.stay_blogs;
create policy "stay_blogs_anon_read" on public.stay_blogs
for select
using (
  exists (
    select 1 from public.stays s
    where s.id = stay_blogs.stay_id and s.status = 'published'
  )
);

commit;
