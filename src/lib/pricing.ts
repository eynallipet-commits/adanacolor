import type { PackagePagePrice, PackageType } from "@/lib/database.types";

/** Fiyat hesabı için gereken en küçük kademe şekli (DB satırının tamamı gerekmiyor). */
export type PagePriceTier = Pick<PackagePagePrice, "min_pages" | "max_pages" | "extra_page_price">;

/**
 * Verilen toplam sayfa sayısı için geçerli "sayfa başı ek ücret"i bulur.
 *
 * Kampanya kademeleri toplam sayfa sayısına göre eşleşir ve eşleşen kademenin ücreti
 * TÜM ek sayfalara uygulanır (dilimli değil). Birden fazla aralık kapsıyorsa en yüksek
 * min_pages değerine sahip olan (en spesifik/en avantajlı kampanya) kazanır.
 * Hiçbiri eşleşmezse paketin varsayılan ek sayfa ücreti kullanılır.
 */
export function resolveExtraPagePrice(
  pkg: Pick<PackageType, "extra_page_price">,
  tiers: PagePriceTier[],
  pageCount: number
): number {
  let best: PagePriceTier | null = null;
  for (const tier of tiers) {
    const inRange = pageCount >= tier.min_pages && (tier.max_pages === null || pageCount <= tier.max_pages);
    if (inRange && (best === null || tier.min_pages > best.min_pages)) {
      best = tier;
    }
  }
  return best ? best.extra_page_price : pkg.extra_page_price;
}

/** Ek sayfa maliyeti dahil birim albüm fiyatı hesabı. */
export function calcAlbumUnitPrice(
  basePrice: number,
  pkg: Pick<PackageType, "base_page_count" | "extra_page_price">,
  pageCount: number,
  tiers: PagePriceTier[]
) {
  const extraPages = Math.max(0, pageCount - pkg.base_page_count);
  if (extraPages === 0) return basePrice;
  const perPage = resolveExtraPagePrice(pkg, tiers, pageCount);
  return Math.round((basePrice + extraPages * perPage) * 100) / 100;
}

/** Sipariş ekranında ek sayfa maliyetini kullanıcıya açıklamak için ayrıntı. */
export function describeExtraPages(
  pkg: Pick<PackageType, "base_page_count" | "extra_page_price">,
  tiers: PagePriceTier[],
  pageCount: number
) {
  const extraPages = Math.max(0, pageCount - pkg.base_page_count);
  const perPage = resolveExtraPagePrice(pkg, tiers, pageCount);
  const total = Math.round(extraPages * perPage * 100) / 100;
  // Kampanya sayesinde paketin varsayılan ücretinden ucuza geliyorsa vurgulamak için.
  const savings = Math.round(extraPages * (pkg.extra_page_price - perPage) * 100) / 100;
  return { extraPages, perPage, total, isCampaign: perPage !== pkg.extra_page_price, savings };
}

export interface PricedLine {
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export function sumLines(lines: PricedLine[]) {
  return lines.reduce((sum, l) => sum + l.lineTotal, 0);
}

export function calcOrderTotals(subtotal: number, discountRate: number) {
  const discountAmount = Math.round(subtotal * (discountRate / 100) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  return { discountAmount, total };
}
