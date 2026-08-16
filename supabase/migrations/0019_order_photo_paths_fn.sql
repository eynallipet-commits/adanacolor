-- deleteOrderPhotosAction, silinecek dosya yollarını "{company_id}/{item_id}/..." varsayarak
-- kendi kurmak yerine gerçek storage.objects kayıtlarından okumalı: canlı veride bazı eski
-- fotoğrafların "{order_id}/{item_id}/..." yolunda kaldığı görüldü (2026-08-14'teki cari-bazlı
-- yola geçişten önce yüklenmiş dosyalar) — path'i varsayarak silme bu dosyaları asla bulamıyordu.
-- order_photo_storage_by_order() ile AYNI eşleştirme mantığını kullanır ki rapor ile silme her
-- zaman birebir tutarlı olsun.
create or replace function public.order_photo_paths(p_order_id uuid)
returns table(path text)
language sql security definer set search_path = public, storage as $$
  select obj.name as path
  from storage.objects obj
  join order_items oi
    on split_part(obj.name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and oi.id = split_part(obj.name, '/', 2)::uuid
  where obj.bucket_id = 'order-photos'
    and oi.order_id = p_order_id
    and public.is_admin();
$$;
