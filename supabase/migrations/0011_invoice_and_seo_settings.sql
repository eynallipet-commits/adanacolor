-- Muhasebe/fatura şablonu ve SEO ayarları için app_settings genişletmesi, alıcı vergi dairesi,
-- ve sipariş bazlı fatura numarası desteği.

alter table app_settings
  add column invoice_seller_tax_office text,
  add column invoice_seller_tax_no text,
  add column invoice_seller_iban text,
  add column invoice_kdv_rate numeric(5,2) not null default 20,
  add column seo_meta_title text,
  add column seo_meta_description text;

alter table companies
  add column tax_office text;

alter table orders
  add column invoice_no text unique;

create sequence if not exists invoice_no_seq;

-- Sipariş "Ödendi" ve sonrası bir duruma geçtiğinde fatura numarası otomatik atanır
-- (ilk atamadan sonra değişmez) — hem admin hem fotoğrafçı tetikleyebileceği durum
-- geçişlerinde (kredi kartı ödemesi anında "paid" olabiliyor) sorunsuz çalışsın diye
-- RLS'e bağlı kalmadan trigger içinde atanır.
create or replace function public.set_invoice_no() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.invoice_no is null and new.status in ('paid', 'in_production', 'shipped', 'delivered') then
    new.invoice_no := 'AC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_no_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_invoice_no before insert or update on orders
  for each row execute function public.set_invoice_no();
