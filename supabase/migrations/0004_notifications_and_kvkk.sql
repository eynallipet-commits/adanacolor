-- Bildirim merkezi
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on notifications(recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- KVKK onayı (üyelik başvurusu)
alter table membership_applications
  add column kvkk_consent boolean not null default false,
  add column kvkk_consent_at timestamptz;

-- Durum etiketleri (bildirim başlığı için)
create or replace function public.order_status_label(s order_status) returns text
language sql immutable as $$
  select case s
    when 'draft' then 'Taslak'
    when 'pending_payment' then 'Ödeme Bekleniyor'
    when 'payment_review' then 'Ödeme İnceleniyor'
    when 'paid' then 'Ödendi'
    when 'in_production' then 'Üretimde'
    when 'shipped' then 'Kargoda'
    when 'delivered' then 'Teslim Edildi'
    when 'cancelled' then 'İptal Edildi'
  end;
$$;

-- Sipariş bildirimleri: yeni sipariş -> adminler; durum değişimi -> o carinin fotoğrafçıları
-- (+ havale incelemesi gerektiğinde adminler de ayrıca bilgilendirilir)
create or replace function public.log_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into public.order_status_history(order_id, status, changed_by)
    values (new.id, new.status, auth.uid());

    if tg_op = 'INSERT' then
      for v_recipient in select id from public.profiles where role = 'admin' loop
        insert into public.notifications(recipient_id, type, title, link)
        values (v_recipient, 'new_order', 'Yeni sipariş: ' || coalesce(new.order_no, ''), '/admin/siparisler/' || new.id);
      end loop;
    else
      for v_recipient in
        select id from public.profiles where company_id = new.company_id and role = 'photographer' and status = 'active'
      loop
        insert into public.notifications(recipient_id, type, title, link)
        values (
          v_recipient, 'order_status',
          coalesce(new.order_no, '') || ' — ' || public.order_status_label(new.status),
          '/panel/siparisler/' || new.id
        );
      end loop;

      if new.status = 'payment_review' then
        for v_recipient in select id from public.profiles where role = 'admin' loop
          insert into public.notifications(recipient_id, type, title, link)
          values (v_recipient, 'payment_review', 'Havale onayı bekliyor: ' || coalesce(new.order_no, ''), '/admin/siparisler/' || new.id);
        end loop;
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Yeni üyelik başvurusu -> adminlere bildirim
create or replace function public.notify_new_application() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
begin
  for v_recipient in select id from public.profiles where role = 'admin' loop
    insert into public.notifications(recipient_id, type, title, link)
    values (v_recipient, 'new_application', 'Yeni üyelik başvurusu: ' || new.company_name, '/admin/basvurular');
  end loop;
  return new;
end;
$$;

create trigger trg_new_application after insert on membership_applications
  for each row execute function public.notify_new_application();
