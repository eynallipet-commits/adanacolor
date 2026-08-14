-- Katalog seed verisi (fiyat listelerinden) — auth kullanıcıları içermez.

insert into album_sizes (code, width_cm, height_cm, sort_order) values
  ('21x54', 21, 54, 1),
  ('25x52', 25, 52, 2),
  ('25x60', 25, 60, 3),
  ('25x70', 25, 70, 4),
  ('30x50', 30, 50, 5),
  ('30x60', 30, 60, 6),
  ('30x70', 30, 70, 7),
  ('30x76', 30, 76, 8),
  ('35x65', 35, 65, 9),
  ('30x80', 30, 80, 10)
on conflict (code) do nothing;

insert into package_types (code, name, base_page_count, extra_page_price, sort_order) values
  ('tek_5', 'Tek Albüm 5 Sayfa', 5, 200, 1),
  ('tek_5_2cep', '5.Sayfa 2 Cep', 5, 200, 2),
  ('tek_10', 'Tek Albüm 10 Sayfa', 10, 200, 3),
  ('eco', 'Eco Paket', 5, 200, 4),
  ('eco_plus', 'Eco Plus Paket', 5, 200, 5),
  ('super', 'Süper Paket', 10, 250, 6),
  ('gold', 'Gold Paket', 10, 250, 7)
on conflict (code) do nothing;

insert into album_size_prices (size_id, package_type_id, price)
select s.id, p.id, v.price
from (values
  ('21x54','tek_5',1300),('21x54','tek_5_2cep',1500),('21x54','tek_10',1700),('21x54','eco',1900),
  ('25x52','tek_5',1300),('25x52','tek_5_2cep',1500),('25x52','tek_10',1900),('25x52','eco',2200),('25x52','eco_plus',2800),
  ('25x60','tek_5',1400),('25x60','tek_5_2cep',1600),('25x60','tek_10',2050),('25x60','eco',2300),('25x60','eco_plus',3000),('25x60','super',3000),('25x60','gold',3700),
  ('25x70','tek_5',1600),('25x70','tek_5_2cep',1800),('25x70','tek_10',2450),('25x70','eco',2700),('25x70','eco_plus',3400),('25x70','super',3200),('25x70','gold',3900),
  ('30x50','tek_5',1400),('30x50','tek_5_2cep',1600),('30x50','tek_10',2050),('30x50','eco',2300),('30x50','eco_plus',3000),('30x50','super',3000),('30x50','gold',3700),
  ('30x60','tek_5',1600),('30x60','tek_5_2cep',1800),('30x60','tek_10',2450),('30x60','eco',2700),('30x60','eco_plus',3400),('30x60','super',3200),('30x60','gold',3900),
  ('30x70','tek_5',1700),('30x70','tek_5_2cep',1900),('30x70','tek_10',2600),('30x70','eco',2800),('30x70','eco_plus',3600),('30x70','super',3500),('30x70','gold',4300),
  ('30x76','tek_5',1850),('30x76','tek_5_2cep',2050),('30x76','tek_10',2700),('30x76','eco',3000),('30x76','eco_plus',3900),('30x76','super',3600),('30x76','gold',4500),
  ('35x65','tek_5',1800),('35x65','tek_5_2cep',2000),('35x65','tek_10',2700),('35x65','eco',3000),('35x65','eco_plus',3900),('35x65','super',3600),('35x65','gold',4600),
  ('30x80','tek_5',1900),('30x80','tek_5_2cep',2100),('30x80','tek_10',2800),('30x80','eco',3100),('30x80','eco_plus',4000),('30x80','super',3800),('30x80','gold',4800)
) as v(size_code, pkg_code, price)
join album_sizes s on s.code = v.size_code
join package_types p on p.code = v.pkg_code
on conflict (size_id, package_type_id) do update set price = excluded.price;

delete from extra_products where company_id is null;
insert into extra_products (category, name, price, sort_order) values
  ('canvas', '30x40 Canvas', 300, 1),
  ('canvas', '40x50 Canvas', 350, 2),
  ('canvas', '40x60 Canvas', 400, 3),
  ('canvas', '50x70 Canvas', 550, 4),
  ('canvas', '60x90 Canvas', 900, 5),
  ('canvas', '75x100 Canvas', 950, 6),
  ('canvas', '75x100 5 Parça Canvas', 1800, 7),
  ('canvas', '75x120 5 Parça Canvas', 1950, 8),
  ('canvas', '75x150 5 Parça Canvas', 2200, 9),
  ('canvas', '25x45 Canvas Saat', 400, 10),
  ('print', '10x15 Baskı', 10, 11),
  ('print', '13x18 Baskı', 15, 12),
  ('print', '15x21 Baskı', 18, 13),
  ('print', '18x24 Baskı', 80, 14),
  ('print', '20x30 Baskı', 90, 15),
  ('print', '24x30 Baskı', 100, 16),
  ('print', '30x40 Foto', 120, 17),
  ('print', '50x70 Foto', 350, 18),
  ('print', '75x100 Foto', 600, 19),
  ('box', '15x21 Ahşap Fotoğraf Kutusu', 500, 20),
  ('box', '15x21 Bölmeli Kutu', 600, 21),
  ('box', '25x52 Kutu', 750, 22),
  ('box', '30x60 Kutu', 800, 23),
  ('box', '25x70 Kutu', 900, 24),
  ('box', '30x80 Kutu', 1000, 25);

delete from album_models where company_id is null;
insert into album_models (name, image_url, sort_order) values
  ('Safir', '/albums/safir.jpg', 1),
  ('Punto', '/albums/punto.jpg', 2),
  ('Golden', '/albums/golden.jpg', 3),
  ('Carbon', '/albums/carbon.jpg', 4),
  ('Loft', '/albums/loft.jpg', 5);
