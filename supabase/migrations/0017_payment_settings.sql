-- Havale/EFT banka bilgileri (herkese açık — sipariş veren fotoğrafçı IBAN'ı görebilmeli),
-- app_settings'e ekleniyor (mevcut geniş "authenticated" select politikasıyla aynı hassasiyet
-- seviyesinde — zaten invoice_seller_iban de burada).
alter table app_settings
  add column bank_transfer_bank_name text,
  add column bank_transfer_account_name text,
  add column bank_transfer_iban text;

-- PayTR mağaza anahtarı/gizli anahtarı GERÇEK SIR niteliğinde — app_settings'in "herhangi bir
-- giriş yapmış kullanıcı okuyabilir" politikasına asla girmemeli (sızarsa sahte "ödeme başarılı"
-- webhook'ları üretilebilir). Bu yüzden tamamen ayrı, yalnızca admin'in okuyabildiği/yazabildiği
-- bir tabloda tutuluyor; sunucu tarafı kod (token üretimi, webhook doğrulama) buraya her zaman
-- service-role client ile erişir, fotoğrafçı oturumu üzerinden asla okunmaz.
create table payment_provider_settings (
  id boolean primary key default true,
  paytr_enabled boolean not null default false,
  paytr_test_mode boolean not null default true,
  paytr_merchant_id text,
  paytr_merchant_key text,
  paytr_merchant_salt text,
  updated_at timestamptz not null default now(),
  constraint payment_provider_settings_singleton check (id)
);
insert into payment_provider_settings (id) values (true);

alter table payment_provider_settings enable row level security;
create policy "payment_provider_settings_admin_all" on payment_provider_settings for all
  using (is_admin()) with check (is_admin());
