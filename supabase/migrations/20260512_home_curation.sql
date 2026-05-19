-- 홈 큐레이션 슬롯: 메인 화면에서 노출할 배너/CTA를 어드민이 관리.

begin;

create table if not exists public.home_curation (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  title text not null,
  subtitle text,
  cta_route text not null,
  cta_label text not null default '바로가기',
  cover_image_url text,
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slot_key ~ '^[a-z0-9-]+$'),
  check (cta_route ~ '^/([a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*)?$')
);

alter table public.home_curation enable row level security;

drop trigger if exists home_curation_set_updated_at on public.home_curation;
create trigger home_curation_set_updated_at
before update on public.home_curation
for each row
execute function public.set_updated_at();

drop policy if exists home_curation_authenticated_all on public.home_curation;
create policy home_curation_authenticated_all
on public.home_curation
for all
to authenticated
using (true)
with check (true);

drop policy if exists home_curation_anon_read on public.home_curation;
create policy home_curation_anon_read
on public.home_curation
for select
using (is_active = true);

create index if not exists home_curation_active_order_idx
  on public.home_curation (display_order)
  where is_active = true;

commit;
