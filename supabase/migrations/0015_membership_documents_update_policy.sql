-- Gerçek kök neden bulundu: apply-form.tsx vergi levhası yüklerken supabase-js'in
-- `{ upsert: true }` seçeneğini kullanıyor (kullanıcı dosyayı değiştirip aynı isimle tekrar
-- seçerse üzerine yazabilsin diye). Storage'ın upsert mekanizması aynı yolda bir obje varsa
-- UPDATE politikası gerektiriyor — bu bucket için hiç UPDATE politikası tanımlanmamıştı, bu
-- yüzden "new row violates row-level security policy" hatası alınıyordu (anon + curl ile ham
-- INSERT test edildiğinde politika doğru çalışıyordu; sorun yalnızca upsert/update yolundaydı).
create policy "membership_documents_public_update" on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'membership-documents')
  with check (bucket_id = 'membership-documents');
