"use client";

import { useState, useTransition } from "react";
import { updatePriceAction } from "./actions";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";
import type { AlbumSize, AlbumSizePrice, PackageType } from "@/lib/database.types";

function PriceCell({
  sizeId,
  packageId,
  initialPrice,
}: {
  sizeId: string;
  packageId: string;
  initialPrice: number | null;
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
}: {
  sizes: AlbumSize[];
  packages: PackageType[];
  prices: AlbumSizePrice[];
}) {
  const priceMap = new Map(prices.map((p) => [`${p.size_id}:${p.package_type_id}`, p.price]));

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-neutral-50">
            <th className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left font-semibold text-neutral-700">
              Ebat
            </th>
            {packages.map((pkg) => (
              <th
                key={pkg.id}
                className="whitespace-nowrap border-b border-neutral-200 px-3 py-2.5 text-right font-semibold text-neutral-700"
              >
                {pkg.name}
                <span className="block text-[11px] font-normal text-neutral-400">
                  Taban {pkg.base_page_count} sayfa · ek sayfa ₺{pkg.extra_page_price.toFixed(2)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size, i) => (
            <tr key={size.id} className={cn(i % 2 === 1 && "bg-neutral-50/50")}>
              <td className="sticky left-0 z-10 whitespace-nowrap border-r border-neutral-200 bg-inherit px-3 py-2 font-medium text-neutral-900">
                {size.code}
              </td>
              {packages.map((pkg) => (
                <td key={pkg.id} className="px-3 py-2 text-right">
                  <PriceCell
                    sizeId={size.id}
                    packageId={pkg.id}
                    initialPrice={priceMap.get(`${size.id}:${pkg.id}`) ?? null}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
