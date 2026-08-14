import type { PackageType } from "@/lib/database.types";

/** Ek sayfa maliyeti dahil birim albüm fiyatı hesabı. */
export function calcAlbumUnitPrice(
  basePrice: number,
  pkg: Pick<PackageType, "base_page_count" | "extra_page_price">,
  pageCount: number
) {
  const extraPages = Math.max(0, pageCount - pkg.base_page_count);
  return basePrice + extraPages * pkg.extra_page_price;
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
