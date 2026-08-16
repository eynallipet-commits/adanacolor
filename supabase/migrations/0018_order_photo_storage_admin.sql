-- Depolama yönetimi: admin panelinden sipariş bazlı fotoğraf boyutunu görüp, artık ihtiyaç
-- kalmayan siparişlerin fotoğraflarını manuel olarak silebilmek için. order-photos bucket'ındaki
-- dosya yolu deseni "{company_id}/{order_item_id}/{dosya}" olduğundan, ikinci path segmentinden
-- order_items üzerinden siparişe ulaşılıyor.
create or replace function public.order_photo_storage_by_order()
returns table(
  order_id uuid,
  order_no text,
  status text,
  created_at timestamptz,
  total_bytes bigint,
  file_count bigint
)
language sql security definer set search_path = public, storage as $$
  with parsed as (
    select obj.id, obj.metadata, split_part(obj.name, '/', 2) as item_id_text
    from storage.objects obj
    where obj.bucket_id = 'order-photos' and public.is_admin()
  )
  select
    o.id as order_id,
    o.order_no,
    o.status::text,
    o.created_at,
    coalesce(sum((p.metadata->>'size')::bigint), 0) as total_bytes,
    count(p.id) as file_count
  from parsed p
  join order_items oi
    on p.item_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and oi.id = p.item_id_text::uuid
  join orders o on o.id = oi.order_id
  group by o.id, o.order_no, o.status, o.created_at
  order by total_bytes desc;
$$;
