-- Schéma aligné cahier des charges + Djomy (GNF, stock marketing)
-- Exécuter dans Supabase SQL Editor (ou migrations)

create extension if not exists "pgcrypto";

-- Visites optionnelles pour taux de conversion dashboard
create table if not exists public.page_views (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  product_id uuid references public.products(id) on delete cascade,
  slug text not null
);

create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  slug text unique not null,
  title text not null,
  -- Regroupement admin (ex. catégories informatique)
  category text default 'Autres',
  -- Type du produit : electronic = livrable instantané (email), physical = livraison manuelle
  product_type text default 'electronic',
  price_original numeric not null,
  price_promo numeric not null,
  currency text default 'GNF',
  timer_duration_minutes int default 15,
  stock_total int default 100,
  sales_count_initial int default 0,
  main_image_url text,
  gallery_urls text[] default '{}',
  product_file_path text,
  payment_link_url text,
  description_html text,
  features jsonb default '[]'::jsonb,
  use_cases jsonb default '[]'::jsonb,
  how_it_works jsonb default '[]'::jsonb,
  testimonials jsonb default '[]'::jsonb,
  faqs jsonb default '[]'::jsonb,
  is_published boolean default true
);

-- Mise à jour (si la table existe déjà) : ajoute la colonne de catégorie
alter table public.products
  add column if not exists category text default 'Autres';

-- Mise à jour : type produit
alter table public.products
  add column if not exists product_type text default 'electronic';

create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  product_id uuid references public.products(id) on delete set null,
  customer_email text not null,
  customer_name text,
  customer_phone text,
  customer_address text,
  amount numeric not null,
  currency text default 'GNF',
  status text default 'pending',
  payment_provider text default 'djomy',
  provider_transaction_id text unique,
  stripe_session_id text unique,
  is_delivered boolean default false,
  delivery_error text
);

-- Demandes de produits physiques (sans paiement en ligne)
create table if not exists public.physical_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  product_id uuid references public.products(id) on delete set null,
  slug text not null,
  customer_email text not null,
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_note text,
  status text default 'new'
);

create index if not exists idx_physical_requests_created on public.physical_requests(created_at desc);
create index if not exists idx_physical_requests_product on public.physical_requests(product_id);

-- Mise à jour (si la table existe déjà) : infos livraison physique
alter table public.sales add column if not exists customer_phone text;
alter table public.sales add column if not exists customer_address text;

create index if not exists idx_sales_product on public.sales(product_id);
create index if not exists idx_sales_created on public.sales(created_at desc);
create index if not exists idx_page_views_product on public.page_views(product_id);

alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.page_views enable row level security;
alter table public.physical_requests enable row level security;

-- Lecture publique produits publiés
drop policy if exists "Allow public read products" on public.products;
create policy "Allow public read products" on public.products
  for select using (is_published = true);

-- Ventes : pas de lecture publique
drop policy if exists "Deny public sales" on public.sales;
create policy "Deny public sales" on public.sales
  for select using (false);

-- Demandes physiques : insert public (CTA), pas de lecture publique
drop policy if exists "Allow insert physical requests" on public.physical_requests;
create policy "Allow insert physical requests" on public.physical_requests
  for insert with check (true);

drop policy if exists "Deny public read physical requests" on public.physical_requests;
create policy "Deny public read physical requests" on public.physical_requests
  for select using (false);

-- Les écritures admin passent par service role (API routes serveur) — évite d’exposer des policies trop larges sur authenticated

-- Page views : insert anonyme pour stats (front incrémente)
drop policy if exists "Allow insert page views" on public.page_views;
create policy "Allow insert page views" on public.page_views
  for insert with check (true);

drop policy if exists "Deny read page views anon" on public.page_views;
create policy "Deny read page views anon" on public.page_views
  for select using (false);

comment on table public.products is 'Pages de vente single-page';
comment on table public.sales is 'Commandes ; complétées via webhook Djomy';
comment on column public.sales.provider_transaction_id is 'ID transaction côté Djomy';

-- ---------------------------------------------------------------------------
-- Stat publique : ventes complétées pour une page publiée (sans lecture directe de `sales`)
-- À exécuter si la fonction n’existe pas encore (mise à jour du schéma).
-- ---------------------------------------------------------------------------
create or replace function public.completed_sales_count_for_slug(product_slug text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.sales s
  inner join public.products p on p.id = s.product_id
  where p.slug = product_slug
    and p.is_published = true
    and s.status = 'completed';
$$;

revoke all on function public.completed_sales_count_for_slug(text) from public;
grant execute on function public.completed_sales_count_for_slug(text) to anon;
grant execute on function public.completed_sales_count_for_slug(text) to authenticated;
