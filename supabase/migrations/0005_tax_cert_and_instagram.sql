-- Vergi levhası (üyelik başvurusu) — sadece admin erişebilir
alter table membership_applications add column tax_certificate_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'membership-documents', 'membership-documents', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Herkes (başvuru formu, kimlik doğrulaması olmadan) belge yükleyebilir ama SADECE admin okuyabilir.
create policy "membership_documents_public_insert" on storage.objects for insert
  with check (bucket_id = 'membership-documents');

create policy "membership_documents_admin_select" on storage.objects for select
  using (bucket_id = 'membership-documents' and is_admin());

create policy "membership_documents_admin_delete" on storage.objects for delete
  using (bucket_id = 'membership-documents' and is_admin());

-- Instagram galerisi: admin yönetir, herkes (landing page) görüntüler
create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  permalink text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table instagram_posts enable row level security;

create policy "instagram_posts_select" on instagram_posts for select using (true);
create policy "instagram_posts_admin_write" on instagram_posts for all
  using (is_admin()) with check (is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "site_assets_public_select" on storage.objects for select
  using (bucket_id = 'site-assets');

create policy "site_assets_admin_insert" on storage.objects for insert
  with check (bucket_id = 'site-assets' and is_admin());

create policy "site_assets_admin_delete" on storage.objects for delete
  using (bucket_id = 'site-assets' and is_admin());
