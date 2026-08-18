import type { AlbumSizePrice, PackagePagePrice, PackageType } from "@/lib/database.types";

/** Fiyat hesabı için gereken en küçük kademe şekli (DB satırının tamamı gerekmiyor). */
export type PagePriceTier = Pick<PackagePagePrice, "min_pages" | "max_pages" | "extra_page_price">;

/** Motorun paketten ihtiyaç duyduğu alanlar. */
export type PricingPackage = Pick<
  PackageType,
  "id" | "base_page_count" | "extra_page_price" | "bridge_package_type_id"
>;

const round2 = (n: number) => Math.round(n * 100) / 100;

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

/** Ek sayfa maliyetinin tek bir dilimi — kullanıcıya "6–10. sayfa × ₺80" diye gösterilir. */
export interface PageSegment {
  /** Bu dilimin kapsadığı ilk ek sayfanın numarası (ör. 6). */
  fromPage: number;
  /** Bu dilimin kapsadığı son ek sayfanın numarası (ör. 10). */
  toPage: number;
  pages: number;
  perPage: number;
  total: number;
  /** Dilim bir üst kampanyayla köprüden mi türetildi, yoksa sabit/kademe ücret mi? */
  source: "bridge" | "flat" | "tier";
  /** Köprü diliminde üst kampanyanın adı, kademede kampanya etiketi. */
  note?: string;
}

export interface PageBreakdown {
  extraPages: number;
  total: number;
  segments: PageSegment[];
  /** Dilimlerden en az biri köprüden geldiyse true. */
  hasBridge: boolean;
}

/**
 * Ebat + paket + sayfa sayısı üçlüsünden birim fiyat üreten motor.
 *
 * Tek bir yerde durmasının sebebi: aynı hesap sipariş ekranında (canlı önizleme),
 * sipariş kaydında (sunucu tarafı yeniden doğrulama) ve admin fiyat matrisinde
 * (türetilen sayfa ücretini göstermek için) birebir aynı çalışmak zorunda.
 */
export class PricingEngine {
  private packages: Map<string, PricingPackage>;
  private tiers: Map<string, PagePriceTier[]>;
  private prices: Map<string, number>;
  private names: Map<string, string>;

  constructor(input: {
    packages: PackageType[];
    /** Ya hazır fiyat haritası (`sizeId:packageId` → fiyat) ya da ham satırlar. */
    prices: AlbumSizePrice[] | Map<string, number>;
    tiers?: PackagePagePrice[];
  }) {
    this.packages = new Map(input.packages.map((p) => [p.id, p]));
    this.names = new Map(input.packages.map((p) => [p.id, p.name]));
    this.prices =
      input.prices instanceof Map
        ? input.prices
        : new Map(input.prices.map((p) => [`${p.size_id}:${p.package_type_id}`, p.price]));
    this.tiers = new Map();
    for (const t of input.tiers ?? []) {
      const list = this.tiers.get(t.package_type_id) ?? [];
      list.push(t);
      this.tiers.set(t.package_type_id, list);
    }
  }

  packageName(packageId: string) {
    return this.names.get(packageId) ?? "";
  }

  tiersFor(packageId: string): PagePriceTier[] {
    return [...(this.tiers.get(packageId) ?? [])].sort((a, b) => a.min_pages - b.min_pages);
  }

  basePrice(sizeId: string, packageId: string): number | undefined {
    return this.prices.get(`${sizeId}:${packageId}`);
  }

  /**
   * Köprü kurulabiliyorsa hedef paketi ve o ebattaki türetilmiş sayfa ücretini verir.
   * Köprü yoksa, hedefin o ebatta fiyatı yoksa ya da taban sayfası büyük değilse null.
   */
  bridgeFor(sizeId: string, packageId: string, visited?: Set<string>) {
    const pkg = this.packages.get(packageId);
    if (!pkg?.bridge_package_type_id) return null;
    if (visited?.has(pkg.bridge_package_type_id)) return null;

    const target = this.packages.get(pkg.bridge_package_type_id);
    if (!target) return null;

    const pageGap = target.base_page_count - pkg.base_page_count;
    if (pageGap <= 0) return null;

    const from = this.basePrice(sizeId, packageId);
    const to = this.basePrice(sizeId, target.id);
    if (from === undefined || to === undefined) return null;

    return {
      target,
      targetName: this.packageName(target.id),
      pageGap,
      /** Türetilmiş sayfa başı ücret — negatif fiyat farkında 0'a sabitlenir. */
      perPage: round2(Math.max(0, to - from) / pageGap),
    };
  }

  /** Ek sayfaların dilim dilim dökümü. Zincirde ilerlerken paketleri takip eder. */
  breakdown(sizeId: string, packageId: string, pageCount: number): PageBreakdown {
    const segments: PageSegment[] = [];
    const visited = new Set<string>();

    let currentId = packageId;
    let cursor = this.packages.get(packageId)?.base_page_count ?? 0;

    while (cursor < pageCount) {
      const pkg = this.packages.get(currentId);
      if (!pkg) break;
      visited.add(currentId);

      const bridge = this.bridgeFor(sizeId, currentId, visited);

      if (bridge && cursor < bridge.target.base_page_count) {
        const to = Math.min(pageCount, bridge.target.base_page_count);
        const pages = to - cursor;
        segments.push({
          fromPage: cursor + 1,
          toPage: to,
          pages,
          perPage: bridge.perPage,
          total: round2(pages * bridge.perPage),
          source: "bridge",
          note: bridge.targetName,
        });
        cursor = to;
        // Köprünün tavanını aştıysak hesap üst kampanyanın kurallarıyla devam eder.
        if (cursor >= bridge.target.base_page_count) currentId = bridge.target.id;
        continue;
      }

      // Köprü yok (ya da tavanı geçildi): paketin sabit ücreti / sayfa kampanyaları.
      const tiers = this.tiersFor(currentId);
      const perPage = resolveExtraPagePrice(pkg, tiers, pageCount);
      const pages = pageCount - cursor;
      segments.push({
        fromPage: cursor + 1,
        toPage: pageCount,
        pages,
        perPage,
        total: round2(pages * perPage),
        source: perPage === pkg.extra_page_price ? "flat" : "tier",
        note: currentId === packageId ? undefined : this.packageName(currentId),
      });
      cursor = pageCount;
    }

    return {
      extraPages: segments.reduce((s, seg) => s + seg.pages, 0),
      total: round2(segments.reduce((s, seg) => s + seg.total, 0)),
      segments,
      hasBridge: segments.some((s) => s.source === "bridge"),
    };
  }

  /** Ek sayfa maliyeti dahil birim albüm fiyatı. Fiyat tanımlı değilse undefined. */
  unitPrice(sizeId: string, packageId: string, pageCount: number): number | undefined {
    const base = this.basePrice(sizeId, packageId);
    if (base === undefined) return undefined;
    const pkg = this.packages.get(packageId);
    if (!pkg) return undefined;
    if (pageCount <= pkg.base_page_count) return base;
    return round2(base + this.breakdown(sizeId, packageId, pageCount).total);
  }
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
