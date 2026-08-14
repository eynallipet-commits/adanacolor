-- Sipariş fotoğrafları için Storage bucket + RLS
-- Dosya yolu şeması: {order_id}/{uuid}-{orijinal dosya adı}

insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', false)
on conflict (id) do nothing;

create policy "order_photos_select" on storage.objects for select
  using (
    bucket_id = 'order-photos' and (
      is_admin() or exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[1]
        and o.company_id = my_company_id()
      )
    )
  );

create policy "order_photos_insert" on storage.objects for insert
  with check (
    bucket_id = 'order-photos' and (
      is_admin() or exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[1]
        and o.company_id = my_company_id()
        and o.status not in ('delivered', 'cancelled')
      )
    )
  );

create policy "order_photos_delete" on storage.objects for delete
  using (
    bucket_id = 'order-photos' and (
      is_admin() or exists (
        select 1 from orders o
        where o.id::text = (storage.foldername(name))[1]
        and o.company_id = my_company_id()
        and o.status not in ('delivered', 'cancelled')
      )
    )
  );
