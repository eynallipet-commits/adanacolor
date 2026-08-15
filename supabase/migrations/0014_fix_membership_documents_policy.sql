-- membership-documents bucket'ının insert politikası anonim başvurularda "new row violates
-- row-level security policy" hatası veriyordu — canlı DB'de politika muhtemelen eksik/farklı
-- uygulanmış (0001-0008 migration'ları CLI'a bağlanmadan önce elle SQL Editor'den çalıştırılmıştı).
-- Bucket'ı ve tüm ilgili politikaları burada garanti şekilde (idempotent) yeniden kuruyoruz.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'membership-documents', 'membership-documents', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "membership_documents_public_insert" on storage.objects;
drop policy if exists "membership_documents_admin_select" on storage.objects;
drop policy if exists "membership_documents_admin_delete" on storage.objects;

create policy "membership_documents_public_insert" on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'membership-documents');

create policy "membership_documents_admin_select" on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'membership-documents' and is_admin());

create policy "membership_documents_admin_delete" on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'membership-documents' and is_admin());
