-- Sayfa sayısına/aralığına özel kampanya fiyatlandırması.
--
-- Mevcut yapıda her paketin tek bir "ek sayfa ücreti" vardı (taban sayfayı aşan her
-- sayfa için sabit tutar). Atölye, çok sayfa yaptıran müşteriye sayfa başı daha ucuz
-- fiyat verebilmek istiyor (ör. taban 5 sayfa, 6-9 sayfa arası sayfa başı 200₺ ama
-- 10 ve üzeri sayfada sayfa başı 150₺).
--
-- Kural: bir sipariş kaleminin TOPLAM sayfa sayısı hangi aralığa düşüyorsa, o aralığın
-- sayfa başı ücreti TÜM ek sayfalara uygulanır (kademeli/dilimli değil). Hiçbir aralık
-- eşleşmezse paketin kendi extra_page_price'ı kullanılır — yani bu tablo boşken sistem
-- eskisi gibi çalışır, geriye dönük uyumlu.
create table package_page_prices (
  id uuid primary key default gen_random_uuid(),
  package_type_id uuid not null references package_types(id) on delete cascade,
  -- Toplam sayfa sayısı aralığı (her ikisi de dahil). max_pages null = "ve üzeri".
  min_pages int not null,
  max_pages int,
  extra_page_price numeric(10,2) not null,
  created_at timestamptz not null default now(),
  constraint package_page_prices_range_valid check (max_pages is null or max_pages >= min_pages),
  constraint package_page_prices_min_positive check (min_pages > 0),
  constraint package_page_prices_price_positive check (extra_page_price >= 0)
);

create index package_page_prices_package_idx on package_page_prices(package_type_id, min_pages);

alter table package_page_prices enable row level security;

-- Fiyat bilgisi: giriş yapmış herkes okur (fotoğrafçı sipariş ekranında görmeli), admin yönetir.
create policy "package_page_prices_select" on package_page_prices for select
  using (auth.uid() is not null);
create policy "package_page_prices_admin_write" on package_page_prices for all
  using (is_admin()) with check (is_admin());
