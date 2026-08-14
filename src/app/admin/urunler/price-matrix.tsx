"use client";

import { useState, useTransition } from "react";
import { updatePriceAction } from "./actions";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
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
      className="w-24 rounded border border-neutral-200 px-2 py-1 text-right text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
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
    <Table>
      <THead>
        <TR>
          <TH>Ebat</TH>
          {packages.map((pkg) => (
            <TH key={pkg.id} className="text-right">
              {pkg.name}
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {sizes.map((size) => (
          <TR key={size.id}>
            <TD className="font-medium">{size.code}</TD>
            {packages.map((pkg) => (
              <TD key={pkg.id} className="text-right">
                <PriceCell
                  sizeId={size.id}
                  packageId={pkg.id}
                  initialPrice={priceMap.get(`${size.id}:${pkg.id}`) ?? null}
                />
              </TD>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
