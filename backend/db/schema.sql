-- Iris — Supabase Şeması
-- Bu dosyayı Supabase SQL Editor'da çalıştır.

-- UUID uzantısı
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────
-- USERS
-- ─────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  tier        text not null default 'free' check (tier in ('free', 'pro', 'ultra')),
  stripe_customer_id text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────
-- COLLECTIONS
-- ─────────────────────────────────────
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- Her kullanıcı için yalnızca 1 default koleksiyon
create unique index if not exists collections_user_default_idx
  on public.collections (user_id)
  where is_default = true;

-- ─────────────────────────────────────
-- SAVED PRODUCTS
-- ─────────────────────────────────────
create table if not exists public.saved_products (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  collection_id    uuid not null references public.collections(id) on delete cascade,
  product_name     text not null,
  price            numeric(12, 2),
  currency         text not null default 'USD',
  store_name       text not null,
  store_url        text not null,
  image_url        text not null,
  similarity_score numeric(4, 3) check (similarity_score between 0 and 1),
  category         text,
  source_api       text not null,
  created_at       timestamptz not null default now()
);

-- Performans index'leri
create index if not exists saved_products_user_idx on public.saved_products (user_id);
create index if not exists saved_products_collection_idx on public.saved_products (collection_id);

-- ─────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────
-- Backend service key bypass eder, RLS extension'dan gelen anon key'i korur.
alter table public.users enable row level security;
alter table public.collections enable row level security;
alter table public.saved_products enable row level security;

-- Şimdilik açık (backend service key ile erişir):
-- Faz 2'de JWT tabanlı user policy'ler eklenecek.
create policy "service_full_access_users" on public.users
  for all using (true) with check (true);
create policy "service_full_access_collections" on public.collections
  for all using (true) with check (true);
create policy "service_full_access_saved_products" on public.saved_products
  for all using (true) with check (true);
