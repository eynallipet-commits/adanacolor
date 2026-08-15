-- Ödeme sonrası (üretime alınana kadar) fotoğrafçının "bu fotoğrafı yanlış gönderdim,
-- değiştirmek istiyorum" diyebilmesi için resmi bir talep mekanizması. Talep açıldığında o
-- kalem için tekrar yükleme/silme hakkı geri açılır (uygulama tarafında kontrol edilir),
-- üretime alındıktan sonra artık talep de açılamaz.

create table photo_change_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  note text not null,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_by uuid references profiles(id),
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index photo_change_requests_order_item_idx on photo_change_requests(order_item_id);
create index photo_change_requests_order_idx on photo_change_requests(order_id);

alter table photo_change_requests enable row level security;

create policy "photo_change_requests_select" on photo_change_requests for select
  using (is_admin() or company_id = my_company_id());
create policy "photo_change_requests_insert" on photo_change_requests for insert
  with check (company_id = my_company_id());
create policy "photo_change_requests_admin_update" on photo_change_requests for update
  using (is_admin()) with check (is_admin());

create or replace function public.notify_photo_change_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
  v_order_no text;
begin
  select order_no into v_order_no from orders where id = new.order_id;
  for v_recipient in select id from public.profiles where role = 'admin' loop
    insert into public.notifications(recipient_id, type, title, link)
    values (
      v_recipient, 'photo_change_request',
      'Fotoğraf değişikliği talebi: ' || coalesce(v_order_no, ''),
      '/admin/siparisler/' || new.order_id
    );
  end loop;
  return new;
end;
$$;

create trigger trg_photo_change_request after insert on photo_change_requests
  for each row execute function public.notify_photo_change_request();
