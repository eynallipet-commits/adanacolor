"use client";

import { useMemo, useState, useTransition } from "react";
import { updatePriceAction } from "./actions";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PricingEngine } from "@/lib/pricing";
import { cn, formatTL } from "@/lib/utils";
import type { AlbumSize, AlbumSizePrice, PackagePagePrice, PackageType } from "@/lib/database.types";

function PriceCell({
  sizeId,
  packageId,
  initialPrice,
  onCommit,
}: {
  sizeId: string;
  packageId: string;
  initialPrice: number | null;
  onCommit: (price: number) => void;
}) {
  const [value, setValue] = useState(initialPrice !== null ? initialPrice.toFixed(2) : "");
  const [isPending, startTransition] = useTransition();

  return (
    <CurrencyInput
      value={value}
      placeholder="—"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const num = Number(value);
        if (!Number.isNaN(num) && value !== "") {
          const rounded = Math.round(num * 100) / 100;
          setValue(rounded.toFixed(2));
          // Köprülü kampanyaların türetilmiş sayfa ücreti anında güncellensin diye
          // matris fiyatları yukarıda da tutuluyor.
          onCommit(rounded);
          startTransition(() => updatePriceAction(sizeId, packageId, rounded));
        }
      }}
      className="w-32"
      style={{ opacity: isPending ? 0.5 : 1 }}
    />
  );
}

export function PriceMatrix({
  sizes,
  packages,
  prices,
  pageTiers,
}: {
  sizes: AlbumSize[];
  packages: PackageType[];
  prices: AlbumSizePrice[];
  pageTiers: PackagePagePrice[];
}) {
  // Fiyatlar yerelde de tutuluyor: bir hücre değişince köprüden türeyen sayfa
  // ücretleri sayfa yenilenmeden yeniden hesaplansın.
  const [priceMap, setPriceMap] = useState(
    () => new Map(prices.map((p) => [`${p.size_id}:${p.package_type_id}`, p.price]))
  );

  const engine = useMemo(
    () => new PricingEngine({ packages, prices: priceMap, tiers: pageTiers }),
    [packages, priceMap, pageTiers]
  );

  const hasBridge = packages.some((p) => p.bridge_package_type_id);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left font-semibold text-neutral-700">
                Ebat
              </th>
              {packages.map((pkg) => {
                const target = packages.find((p) => p.id === pkg.bridge_package_type_id);
                return (
                  <th
                    key={pkg.id}
                    className="whitespace-nowrap border-b border-neutral-200 px-3 py-2.5 text-right font-semibold text-neutral-700"
                  >
                    {pkg.name}
                    <span className="block text-[11px] font-normal text-neutral-400">
                      Taban {pkg.base_page_count} sayfa ·{" "}
                      {target ? (
                        <span className="text-emerald-700">
                          ek sayfa → {target.name} köprüsü
                        </span>
                      ) : (
                        <>ek sayfa ₺{pkg.extra_page_price.toFixed(2)}</>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size, i) => (
              <tr key={size.id} className={cn(i % 2 === 1 && "bg-neutral-50/50")}>
                <td className="sticky left-0 z-10 whitespace-nowrap border-r border-neutral-200 bg-inherit px-3 py-2 font-medium text-neutral-900">
                  {size.code}
                </td>
                {packages.map((pkg) => {
                  const bridge = engine.bridgeFor(size.id, pkg.id);
                  return (
                    <td key={pkg.id} className="px-3 py-2 text-right align-top">
                      <PriceCell
                        sizeId={size.id}
                        packageId={pkg.id}
                        initialPrice={priceMap.get(`${size.id}:${pkg.id}`) ?? null}
                        onCommit={(price) =>
                          setPriceMap((m) => new Map(m).set(`${size.id}:${pkg.id}`, price))
                        }
                      />
                      {bridge && (
                        <span
                          className="mt-1 block text-[11px] text-emerald-700"
                          title={`${pkg.base_page_count + 1}. – ${bridge.target.base_page_count}. sayfa aralığında sayfa başı ücret`}
                        >
                          {pkg.base_page_count + 1}–{bridge.target.base_page_count}. sayfa:{" "}
                          {formatTL(bridge.perPage)}/sayfa
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasBridge && (
        <p className="text-[11px] leading-relaxed text-neutral-500">
          <span className="font-medium text-emerald-700">Yeşil satırlar</span> köprüden türetilir:
          iki kampanyanın o ebattaki fiyat farkı, aradaki sayfa farkına bölünür. Hücredeki fiyatı
          değiştirdiğinizde sayfa ücreti anında yeniden hesaplanır. Köprüyü aşağıdaki
          &quot;Paketleri / Kampanyaları Yönet&quot; bölümünden kurar veya kaldırırsınız.
        </p>
      )}
    </div>
  );
}
