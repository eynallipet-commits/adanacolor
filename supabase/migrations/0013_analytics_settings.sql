-- Google Analytics / Google Tag Manager / Meta (Facebook) Pixel / Google Search Console
-- doğrulama kodlarının admin panelinden girilebilmesi için.
alter table app_settings
  add column ga_measurement_id text,
  add column gtm_id text,
  add column facebook_pixel_id text,
  add column google_site_verification text;
