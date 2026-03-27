create extension if not exists pgcrypto;

create table if not exists public.flowers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ko text not null,
  name_en text,
  color_hex text not null,
  season_start_month smallint not null check (season_start_month between 1 and 12),
  season_end_month smallint not null check (season_end_month between 1 and 12),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug ~ '^[a-z0-9-]+$'),
  check (color_hex ~ '^#([A-Fa-f0-9]{6})$')
);

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  flower_id uuid not null references public.flowers(id) on delete restrict,
  slug text not null unique,
  name text not null,
  region_primary text not null,
  region_secondary text not null,
  address text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  description text not null,
  short_tip text not null,
  parking_info text,
  admission_fee text,
  festival_name text,
  festival_start_at date,
  festival_end_at date,
  bloom_start_at date not null,
  bloom_end_at date not null,
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  source_type text not null default 'manual_json' check (source_type = 'manual_json'),
  source_note text,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (slug ~ '^[a-z0-9-]+$'),
  check (bloom_start_at <= bloom_end_at),
  check (
    festival_start_at is null
    or festival_end_at is null
    or festival_start_at <= festival_end_at
  )
);
