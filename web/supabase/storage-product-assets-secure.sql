-- Optionnel : restreindre la lecture publique aux assets marketing (images / features).
-- Les fichiers livrables (dossier fichiers/) passent uniquement par /api/download/deliver (URL signée).
-- À exécuter dans Supabase SQL Editor après storage-product-assets.sql.

drop policy if exists "Public read product assets" on storage.objects;

create policy "Public read product marketing assets"
on storage.objects for select
using (
  bucket_id = 'product-assets'
  and (
    name like 'images/%'
    or name like 'features/%'
  )
);
