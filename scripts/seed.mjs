// Kullanım: node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function upsert(table, rows, onConflict) {
  const { error } = await supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table}: ${rows.length} kayıt`);
}

// ---- Ebatlar ----
const sizes = [
  { code: "21x54", width_cm: 21, height_cm: 54, sort_order: 1 },
  { code: "25x52", width_cm: 25, height_cm: 52, sort_order: 2 },
  { code: "25x60", width_cm: 25, height_cm: 60, sort_order: 3 },
  { code: "25x70", width_cm: 25, height_cm: 70, sort_order: 4 },
  { code: "30x50", width_cm: 30, height_cm: 50, sort_order: 5 },
  { code: "30x60", width_cm: 30, height_cm: 60, sort_order: 6 },
  { code: "30x70", width_cm: 30, height_cm: 70, sort_order: 7 },
  { code: "30x76", width_cm: 30, height_cm: 76, sort_order: 8 },
  { code: "35x65", width_cm: 35, height_cm: 65, sort_order: 9 },
  { code: "30x80", width_cm: 30, height_cm: 80, sort_order: 10 },
];
await upsert("album_sizes", sizes, "code");
const { data: sizeRows } = await supabase.from("album_sizes").select("id,code");
const sizeIdByCode = Object.fromEntries(sizeRows.map((s) => [s.code, s.id]));

// ---- Paket tipleri ----
const packages = [
  { code: "tek_5", name: "Tek Albüm 5 Sayfa", base_page_count: 5, extra_page_price: 200, sort_order: 1 },
  { code: "tek_5_2cep", name: "5.Sayfa 2 Cep", base_page_count: 5, extra_page_price: 200, sort_order: 2 },
  { code: "tek_10", name: "Tek Albüm 10 Sayfa", base_page_count: 10, extra_page_price: 200, sort_order: 3 },
  { code: "eco", name: "Eco Paket", base_page_count: 5, extra_page_price: 200, sort_order: 4 },
  { code: "eco_plus", name: "Eco Plus Paket", base_page_count: 5, extra_page_price: 200, sort_order: 5 },
  { code: "super", name: "Süper Paket", base_page_count: 10, extra_page_price: 250, sort_order: 6 },
  { code: "gold", name: "Gold Paket", base_page_count: 10, extra_page_price: 250, sort_order: 7 },
];
await upsert("package_types", packages, "code");
const { data: pkgRows } = await supabase.from("package_types").select("id,code");
const pkgIdByCode = Object.fromEntries(pkgRows.map((p) => [p.code, p.id]));

// ---- Ebat x Paket fiyat matrisi (2026 Fiyat Listesi) ----
// [tek_5, tek_5_2cep, tek_10, eco, eco_plus, super, gold] — null = bu ebatta yok
const priceMatrix = {
  "21x54": [1300, 1500, 1700, 1900, null, null, null],
  "25x52": [1300, 1500, 1900, 2200, 2800, null, null],
  "25x60": [1400, 1600, 2050, 2300, 3000, 3000, 3700],
  "25x70": [1600, 1800, 2450, 2700, 3400, 3200, 3900],
  "30x50": [1400, 1600, 2050, 2300, 3000, 3000, 3700],
  "30x60": [1600, 1800, 2450, 2700, 3400, 3200, 3900],
  "30x70": [1700, 1900, 2600, 2800, 3600, 3500, 4300],
  "30x76": [1850, 2050, 2700, 3000, 3900, 3600, 4500],
  "35x65": [1800, 2000, 2700, 3000, 3900, 3600, 4600],
  "30x80": [1900, 2100, 2800, 3100, 4000, 3800, 4800],
};
const pkgOrder = ["tek_5", "tek_5_2cep", "tek_10", "eco", "eco_plus", "super", "gold"];
const priceRows = [];
for (const [sizeCode, prices] of Object.entries(priceMatrix)) {
  prices.forEach((price, i) => {
    if (price !== null) {
      priceRows.push({ size_id: sizeIdByCode[sizeCode], package_type_id: pkgIdByCode[pkgOrder[i]], price });
    }
  });
}
await upsert("album_size_prices", priceRows, "size_id,package_type_id");

// ---- Ekstra ürünler (2026 Ekstra Baskı Fiyat Listesi) ----
const extras = [
  // Canvaslar
  { category: "canvas", name: "30x40 Canvas", price: 300, sort_order: 1 },
  { category: "canvas", name: "40x50 Canvas", price: 350, sort_order: 2 },
  { category: "canvas", name: "40x60 Canvas", price: 400, sort_order: 3 },
  { category: "canvas", name: "50x70 Canvas", price: 550, sort_order: 4 },
  { category: "canvas", name: "60x90 Canvas", price: 900, sort_order: 5 },
  { category: "canvas", name: "75x100 Canvas", price: 950, sort_order: 6 },
  { category: "canvas", name: "75x100 5 Parça Canvas", price: 1800, sort_order: 7 },
  { category: "canvas", name: "75x120 5 Parça Canvas", price: 1950, sort_order: 8 },
  { category: "canvas", name: "75x150 5 Parça Canvas", price: 2200, sort_order: 9 },
  { category: "canvas", name: "25x45 Canvas Saat", price: 400, sort_order: 10 },
  // Fotobüyütmeler
  { category: "print", name: "10x15 Baskı", price: 10, sort_order: 11 },
  { category: "print", name: "13x18 Baskı", price: 15, sort_order: 12 },
  { category: "print", name: "15x21 Baskı", price: 18, sort_order: 13 },
  { category: "print", name: "18x24 Baskı", price: 80, sort_order: 14 },
  { category: "print", name: "20x30 Baskı", price: 90, sort_order: 15 },
  { category: "print", name: "24x30 Baskı", price: 100, sort_order: 16 },
  { category: "print", name: "30x40 Foto", price: 120, sort_order: 17 },
  { category: "print", name: "50x70 Foto", price: 350, sort_order: 18 },
  { category: "print", name: "75x100 Foto", price: 600, sort_order: 19 },
  // Kutular
  { category: "box", name: "15x21 Ahşap Fotoğraf Kutusu", price: 500, sort_order: 20 },
  { category: "box", name: "15x21 Bölmeli Kutu", price: 600, sort_order: 21 },
  { category: "box", name: "25x52 Kutu", price: 750, sort_order: 22 },
  { category: "box", name: "30x60 Kutu", price: 800, sort_order: 23 },
  { category: "box", name: "25x70 Kutu", price: 900, sort_order: 24 },
  { category: "box", name: "30x80 Kutu", price: 1000, sort_order: 25 },
];
// Bu tablonun name üzerinde unique kısıtı yok; önce var olanları temizleyip (sadece global,
// company_id null olanlar) yeniden ekliyoruz ki script tekrar çalıştırılabilir olsun.
await supabase.from("extra_products").delete().is("company_id", null);
await upsert("extra_products", extras);

// ---- Örnek kapak modelleri (global) ----
const models = [
  { name: "Safir", image_url: "/albums/safir.jpg", sort_order: 1 },
  { name: "Punto", image_url: "/albums/punto.jpg", sort_order: 2 },
  { name: "Golden", image_url: "/albums/golden.jpg", sort_order: 3 },
  { name: "Carbon", image_url: "/albums/carbon.jpg", sort_order: 4 },
  { name: "Loft", image_url: "/albums/loft.jpg", sort_order: 5 },
];
await supabase.from("album_models").delete().is("company_id", null);
await upsert("album_models", models);

// ---- Demo hesaplar ----
async function ensureUser(email, password) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) return existing;
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}

// Admin
const adminEmail = "admin@adanacoloralbum.com";
const adminPassword = "AdanaAdmin2026!";
const adminUser = await ensureUser(adminEmail, adminPassword);
await supabase.from("profiles").upsert(
  { id: adminUser.id, role: "admin", full_name: "Atölye Yöneticisi", status: "active" },
  { onConflict: "id" }
);
console.log(`✓ admin: ${adminEmail} / ${adminPassword}`);

// Demo cari + fotoğrafçı
const { data: demoCompany } = await supabase
  .from("companies")
  .upsert(
    { name: "Demo Foto Stüdyo", tax_no: "1234567890", phone: "05555555555", email: "demo@fotostudyo.com", discount_rate: 10 },
    { onConflict: "id" }
  )
  .select("id")
  .maybeSingle();

let demoCompanyId = demoCompany?.id;
if (!demoCompanyId) {
  const { data: found } = await supabase.from("companies").select("id").eq("name", "Demo Foto Stüdyo").maybeSingle();
  demoCompanyId = found?.id;
}

const photographerEmail = "demo@fotostudyo.com";
const photographerPassword = "DemoFoto2026!";
const photographerUser = await ensureUser(photographerEmail, photographerPassword);
await supabase.from("profiles").upsert(
  {
    id: photographerUser.id,
    role: "photographer",
    full_name: "Demo Fotoğrafçı",
    company_id: demoCompanyId,
    status: "active",
  },
  { onConflict: "id" }
);
console.log(`✓ fotoğrafçı: ${photographerEmail} / ${photographerPassword}`);

console.log("Seed tamamlandı.");
