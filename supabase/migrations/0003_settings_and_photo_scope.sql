-- Ayarlar tablosu (tek satır) — teslimat süresi vb. admin tarafından yönetilir.
create table app_settings (
  id boolean primary key default true,
  estimated_min_days int not null default 7,
  estimated_max_days int not null default 14,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

insert into app_settings (id) values (true);

alter table app_settings enable row level security;

create policy "app_settings_select" on app_settings for select
  using (auth.uid() is not null);
create policy "app_settings_admin_write" on app_settings for all
  using (is_admin()) with check (is_admin());

-- Sipariş fotoğrafları artık siparişten bağımsız, cari bazlı saklanıyor:
-- {company_id}/{order_item_id}/{dosya} — fotoğrafçı siparişi oluşturmadan (sepet aşamasında)
-- yükleyebilsin diye order_id'ye bağımlılık kaldırıldı.
drop policy if exists "order_photos_select" on storage.objects;
drop policy if exists "order_photos_insert" on storage.objects;
drop policy if exists "order_photos_delete" on storage.objects;

create policy "order_photos_select" on storage.objects for select
  using (
    bucket_id = 'order-photos' and (
      is_admin() or (storage.foldername(name))[1] = my_company_id()::text
    )
  );

create policy "order_photos_insert" on storage.objects for insert
  with check (
    bucket_id = 'order-photos' and (
      is_admin() or (storage.foldername(name))[1] = my_company_id()::text
    )
  );

create policy "order_photos_delete" on storage.objects for delete
  using (
    bucket_id = 'order-photos' and (
      is_admin() or (storage.foldername(name))[1] = my_company_id()::text
    )
  );
