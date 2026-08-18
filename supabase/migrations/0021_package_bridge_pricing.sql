-- Kampanyalar arası "ek sayfa köprüsü".
--
-- Atölyenin fiyat mantığı: "Tek Albüm 5 Sayfa" ile "Tek Albüm 10 Sayfa" aslında aynı
-- ürünün iki kademesi. Müşteri 5 sayfalık kampanyayı seçip sayfa eklediğinde, 10.
-- sayfaya geldiğinde tam olarak 10 sayfalık kampanyanın fiyatına ulaşmalı. Yani ek
-- sayfa ücreti sabit değil, EBADA GÖRE değişir ve iki kampanyanın o ebattaki fiyat
-- farkından türetilir:
--
--   sayfa başı ücret = (üst kampanya fiyatı − bu kampanya fiyatı) / (sayfa farkı)
--
-- Örn. 21x54: (1700 − 1300) / (10 − 5) = 80 ₺/sayfa. 6. sayfa +80, 10. sayfada toplam
-- 1700 — yani 10 sayfa kampanyasıyla birebir aynı. Üst kampanyanın taban sayfasını
-- aşan sayfalar ise üst kampanyanın kendi ek sayfa ücretinden (veya sayfa
-- kampanyalarından) fiyatlanır; hesap özyinelemeli olarak zincir boyunca ilerler.
--
-- Kolon null ise paket eskisi gibi sabit extra_page_price / package_page_prices ile
-- çalışır — geriye dönük tamamen uyumlu.
alter table package_types
  add column bridge_package_type_id uuid references package_types(id) on delete set null;

-- Kendine köprü kurulamaz; daha derin döngüler uygulama katmanında engellenir ve
-- fiyat hesabında ziyaret edilen paketler takip edilerek kırılır.
alter table package_types
  add constraint package_types_bridge_not_self
  check (bridge_package_type_id is null or bridge_package_type_id <> id);

create index package_types_bridge_idx on package_types(bridge_package_type_id);

comment on column package_types.bridge_package_type_id is
  'Ek sayfa fiyatının türetileceği üst kampanya. Taban sayfa sayısı bu paketten büyük olmalı.';
