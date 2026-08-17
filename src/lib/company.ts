/**
 * Kurumsal bilgiler — sitenin her yerinde (footer, iletişim, harita, proforma belge)
 * buradan okunur. Bilgileri değiştirmek için yalnızca bu dosyayı düzenlemeniz yeterli.
 *
 * Boş bırakılan alanlar arayüzde hiç gösterilmez; uydurma bilgi görünmesin diye
 * bilerek böyle yapıldı. Gerçek değerleri girdikçe ilgili satırlar otomatik belirir.
 */
interface CompanyInfo {
  legalName: string;
  brandName: string;
  tagline: string;
  /**
   * Sitenin canlı adresi (protokol dahil, sonunda / olmadan). SEO meta etiketleri,
   * sitemap.xml, robots.txt ve PayTR bildirim URL'i buradan türetilir — domain
   * değişirse yalnızca burayı güncellemek yeterli.
   */
  siteUrl: string;
  addressLine: string;
  district: string;
  city: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHours: string[];
  instagram: string;
  taxOffice: string;
  taxNumber: string;
  /** Google Maps'te doğrulanmış tam konum — girilirse harita ve yol tarifi bunu kullanır. */
  coordinates: { lat: number; lng: number } | null;
  /** Google Maps paylaşım linki (ör. maps.app.goo.gl/...) — "Google Maps'te Aç" için. */
  mapsUrl: string;
}

export const COMPANY: CompanyInfo = {
  legalName: "Adana Color Foto Albüm San. Tic. Ltd. Şti.",
  brandName: "Adana Color Albüm",
  tagline: "Fotoğrafçılar için albüm, canvas ve baskı üretimi",
  siteUrl: "https://adanacoloralbums.com",

  /** Açık adres (mahalle/cadde/no). Boşsa footer'da yalnızca şehir görünür. */
  addressLine: "A, Yeşiloba Mahallesi, 46069. Sokak No:10, 01210 Seyhan/Adana",
  district: "",
  city: "Adana",
  country: "Türkiye",

  /** Telefon/e-posta boşsa o satır footer'da görünmez. */
  phone: "03224289299",
  /** Sadece rakam, ülke koduyla: 905xxxxxxxxx */
  whatsapp: "wa.me/905072138340",
  email: "",

  /** Örn: ["Pazartesi - Cuma: 09:00 - 18:00", "Cumartesi: 09:00 - 14:00"] */
  workingHours: ["Pazartesi - Cumartesi: 08:00 - 18:00", "Pazar: Kapalı"],

  instagram: "https://www.instagram.com/adanacoloralbum/",

  /** Vergi dairesi / no, Mersis vb. — kurumsal şeffaflık için, boşsa gizlenir. */
  taxOffice: "",
  taxNumber: "",

  // Google Maps paylaşım linkinden (https://maps.app.goo.gl/XaTSdKyKPtS8ibkJ9) çözümlendi.
  coordinates: { lat: 36.9901639, lng: 35.2450924 },
  mapsUrl: "https://maps.app.goo.gl/XaTSdKyKPtS8ibkJ9",
};

/** Footer ve iletişim bölümünde gösterilecek tek satırlık adres. */
export function formatAddress() {
  return [COMPANY.addressLine, COMPANY.district, COMPANY.city, COMPANY.country]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
}

/** Google Maps embed (API anahtarı gerektirmez) ve "yol tarifi" bağlantısı için sorgu. */
export function mapsQuery() {
  const parts = [COMPANY.addressLine, COMPANY.district, COMPANY.city, COMPANY.country]
    .map((p) => p.trim())
    .filter(Boolean);
  // Açık adres girilmediyse işletme adıyla ara.
  return parts.length > 2 ? parts.join(", ") : `${COMPANY.legalName}, ${COMPANY.city}`;
}

export function mapsEmbedUrl() {
  if (COMPANY.coordinates) {
    const { lat, lng } = COMPANY.coordinates;
    return `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery())}&output=embed`;
}

/** "Yol tarifi al" için — doğrulanmış koordinat varsa onu, yoksa paylaşım linkini kullanır. */
export function mapsDirectionsUrl() {
  if (COMPANY.coordinates) {
    const { lat, lng } = COMPANY.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (COMPANY.mapsUrl) return COMPANY.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery())}`;
}
