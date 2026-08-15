-- Albüm modeli ↔ desteklenen ebatlar eşleşmesi
create table album_model_sizes (
  model_id uuid not null references album_models(id) on delete cascade,
  size_id uuid not null references album_sizes(id) on delete cascade,
  primary key (model_id, size_id)
);

alter table album_model_sizes enable row level security;
create policy "album_model_sizes_select" on album_model_sizes for select using (auth.uid() is not null);
create policy "album_model_sizes_admin_write" on album_model_sizes for all
  using (is_admin()) with check (is_admin());

-- Mevcut modeller için tüm ebatları açık başlat (davranış değişmesin)
insert into album_model_sizes (model_id, size_id)
select m.id, s.id from album_models m cross join album_sizes s
on conflict do nothing;

-- Genel kumaş/renk paleti (kataloglarda ortak kullanılıyor)
create table album_colors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text,
  hex text,
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table album_colors enable row level security;
create policy "album_colors_select" on album_colors for select using (auth.uid() is not null);
create policy "album_colors_admin_write" on album_colors for all
  using (is_admin()) with check (is_admin());

-- Modelin sunduğu renkler
create table album_model_colors (
  model_id uuid not null references album_models(id) on delete cascade,
  color_id uuid not null references album_colors(id) on delete cascade,
  primary key (model_id, color_id)
);

alter table album_model_colors enable row level security;
create policy "album_model_colors_select" on album_model_colors for select using (auth.uid() is not null);
create policy "album_model_colors_admin_write" on album_model_colors for all
  using (is_admin()) with check (is_admin());

-- Sipariş kaleminde seçilen renk (etiket, renk sonradan silinse de siparişte kalsın diye kopyalanır)
alter table order_items add column album_color_id uuid references album_colors(id);
alter table order_items add column album_color_label text;

-- Katalogdaki renk kodları (hex değerleri yaklaşık — admin panelinden düzeltilebilir)
insert into album_colors (code, hex, sort_order) values
  ('500', '#e8e4dc', 10),
  ('520', '#2b2b2d', 20),
  ('730', '#c09a6b', 30),
  ('750', '#9e2e3c', 40),
  ('570', '#c4ae97', 50),
  ('590', '#2f5c86', 60),
  ('760', '#131313', 70),
  ('800', '#c4707e', 80),
  ('610', '#8a8a8a', 90),
  ('620', '#5a4032', 100),
  ('810', '#2e7ca6', 110),
  ('820', '#cfc3b0', 120),
  ('630', '#7b2d57', 130),
  ('650', '#b9b4ae', 140),
  ('830', '#a87a3d', 150),
  ('840', '#b4521f', 160),
  ('670', '#2e4433', 170),
  ('690', '#3a414e', 180),
  ('850', '#c9c4b8', 190),
  ('700', '#6e6e6e', 200),
  ('710', '#d6c3a5', 210)
on conflict (code) do nothing;

-- Mevcut modellere tüm renkleri tanımla (admin daraltabilir)
insert into album_model_colors (model_id, color_id)
select m.id, c.id from album_models m cross join album_colors c
on conflict do nothing;
