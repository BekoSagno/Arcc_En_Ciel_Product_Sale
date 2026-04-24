-- Bucket public pour images / fichiers produits (admin upload, lecture publique)
-- À exécuter dans Supabase SQL Editor après le schéma principal.
-- Pour ne pas exposer les fichiers livrables (dossier fichiers/), exécuter ensuite storage-product-assets-secure.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-assets',
  'product-assets',
  true,
  52428800,
  null
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Lecture publique (URLs affichées sur les pages de vente)
drop policy if exists "Public read product assets" on storage.objects;
create policy "Public read product assets"
  on storage.objects for select
  using (bucket_id = 'product-assets');

-- Écriture : utilisateurs connectés (session admin)
drop policy if exists "Auth upload product assets" on storage.objects;
create policy "Auth upload product assets"
  on storage.objects for insert
  with check (
    bucket_id = 'product-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth update product assets" on storage.objects;
create policy "Auth update product assets"
  on storage.objects for update
  using (
    bucket_id = 'product-assets'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Auth delete product assets" on storage.objects;
create policy "Auth delete product assets"
  on storage.objects for delete
  using (
    bucket_id = 'product-assets'
    and auth.role() = 'authenticated'
  );
