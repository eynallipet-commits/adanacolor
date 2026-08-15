-- 2026-2027 ALBUM CATALOG'daki 30 kapak modeli: görsel, basılabilen ebatlar ve renkler.
-- Kaynak: "ADANA COLOR.pdf" (her modelin katalog sayfasındaki ebat tikleri ve renk paleti).
-- Not: katalogdaki tam palet 21 renk; bazı modellerde 590/610/650/700 sunulmuyor,
-- Foto Kapak'ta ise kumaş rengi seçimi yok.

do $$
declare
  v_base text := 'https://tbgfigvmcpgejqeaklth.supabase.co/storage/v1/object/public/site-assets/album-models/catalog-';
  v_all text[] := array['500','520','730','750','570','590','760','800','610','620','810','820',
                        '630','650','830','840','670','690','850','700','710'];
  v_lite text[] := array['500','520','730','750','570','760','800','620','810','820',
                         '630','830','840','670','690','850','710'];
  v_none text[] := array[]::text[];
  v_full_sizes text[] := array['35x65','30x80','30x76','30x60','30x50','25x70','25x60','25x52'];
  r record;
  v_id uuid;
begin
  for r in
    select * from (values
      ('Safir',      'safir.jpg',      10,  v_full_sizes, v_all),
      ('Sedef',      'sedef.jpg',      20,  v_full_sizes, v_all),
      ('Leon',       'leon.jpg',       30,  array['35x65','30x80','30x76','30x60','25x70','25x60'], v_all),
      ('Golden',     'golden.jpg',     40,  v_full_sizes, v_lite),
      ('Punto',      'punto.jpg',      50,  v_full_sizes, v_all),
      ('Piero',      'piero.jpg',      60,  array['35x65','30x80','30x76','30x60','30x50','25x70','25x52'], v_all),
      ('Nova',       'nova.jpg',       70,  v_full_sizes, v_lite),
      ('Lidya',      'lidya.jpg',      80,  v_full_sizes, v_lite),
      ('Line',       'line.jpg',       90,  v_full_sizes, v_all),
      ('Madrid',     'madrid.jpg',     100, v_full_sizes, v_lite),
      ('Mila',       'mila.jpg',       110, v_full_sizes, v_all),
      ('Asya',       'asya.jpg',       120, v_full_sizes, v_lite),
      ('Carbon',     'carbon.jpg',     130, array['35x65','30x80','30x76','30x60','25x70','25x60'], v_all),
      ('Dream',      'dream.jpg',      140, v_full_sizes, v_all),
      ('Galaxy',     'galaxy.jpg',     150, v_full_sizes, v_all),
      ('Halbert',    'halbert.jpg',    160, v_full_sizes, v_lite),
      ('Gold Elit',  'gold-elit.jpg',  170, v_full_sizes, v_all),
      ('Delta',      'delta.jpg',      180, v_full_sizes, v_all),
      ('Paris',      'paris.jpg',      190, array['30x80','30x76','30x60','30x50','25x70','25x60','25x52'], v_all),
      ('İnci',       'inci.jpg',       200, array['30x80','30x76','30x60','30x50','25x60','25x52'], v_all),
      ('Royal',      'royal.jpg',      210, v_full_sizes, v_lite),
      ('Loft',       'loft.jpg',       220, array['30x80','30x76','30x60','25x70','25x60'], v_all),
      ('Alberta',    'alberta.jpg',    230, array['35x65','30x80','30x76','25x70','25x60'], v_all),
      ('Helen',      'helen.jpg',      240, v_full_sizes, v_lite),
      ('Vienza',     'vienza.jpg',     250, v_full_sizes, v_lite),
      ('Foto Kapak', 'foto-kapak.jpg', 260, v_full_sizes, v_none),
      ('Baby 1',     'baby-1.jpg',     270, v_full_sizes, v_all),
      ('Baby 2',     'baby-2.jpg',     280, array['30x80','30x76','30x60','30x50','25x70','25x60','25x52'], v_lite),
      ('Baby 3',     'baby-3.jpg',     290, array['30x80','30x76','30x60','30x50','25x70','25x60','25x52'], v_lite),
      ('Gala',       'gala.jpg',       300, v_full_sizes, v_lite)
    ) as t(name, file, sort_order, size_codes, color_codes)
  loop
    -- Mevcut model varsa (isim büyük/küçük harf duyarsız) güncelle, yoksa oluştur.
    select id into v_id from album_models
      where company_id is null and lower(name) = lower(r.name) limit 1;

    if v_id is null then
      insert into album_models (name, image_url, company_id, active, sort_order)
      values (r.name, v_base || r.file, null, true, r.sort_order)
      returning id into v_id;
    else
      update album_models
        set name = r.name, image_url = v_base || r.file, sort_order = r.sort_order, active = true
        where id = v_id;
    end if;

    delete from album_model_sizes where model_id = v_id;
    insert into album_model_sizes (model_id, size_id)
      select v_id, s.id from album_sizes s where s.code = any(r.size_codes);

    delete from album_model_colors where model_id = v_id;
    insert into album_model_colors (model_id, color_id)
      select v_id, c.id from album_colors c where c.code = any(r.color_codes);
  end loop;
end $$;
