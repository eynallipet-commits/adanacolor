"use client";

import { useState, useTransition } from "react";
import { updatePriceAction } from "./actions";
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
  const [value, setValue] = useState(initialPrice?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
        ₺
      </span>
      <input
        type="number"
        min={0}
        step="1"
        value={value}
        placeholder="—"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const num = Number(value);
          if (!Number.isNaN(num) && value !== "") {
            startTransition(() => updatePriceAction(sizeId, packageId, num));
          }
        }}
        className="w-28 rounded-md border border-neutral-200 bg-white py-1.5 pl-6 pr-2 text-right text-sm transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        style={{ opacity: isPending ? 0.5 : 1 }}
      />
    </div>
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
                  Taban {pkg.base_page_count} sayfa
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
