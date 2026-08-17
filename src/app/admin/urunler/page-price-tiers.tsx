"use client";

import { useState, useTransition } from "react";
import { Tag } from "lucide-react";
import { addPagePriceTierAction, deletePagePriceTierAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { formatTL } from "@/lib/utils";
import type { PackagePagePrice, PackageType } from "@/lib/database.types";

/** Bir paketin sayfa sayısına özel kampanya fiyatlarını yönetir. */
export function PagePriceTiers({
  pkg,
  tiers,
}: {
  pkg: PackageType;
  tiers: PackagePagePrice[];
}) {
  const [minPages, setMinPages] = useState("");
  const [maxPages, setMaxPages] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = [...tiers].sort((a, b) => a.min_pages - b.min_pages);

  function handleAdd() {
    const min = Number(minPages);
    const max = maxPages.trim() === "" ? null : Number(maxPages);
    startTransition(async () => {
      const res = await addPagePriceTierAction(pkg.id, min, max, Number(price));
      if (res.error) {
        setError(res.error);
      } else {
        setError(null);
        setMinPages("");
        setMaxPages("");
        setPrice("");
      }
    });
  }

  return (
    <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-800">
        <Tag className="h-3.5 w-3.5 text-brand-600" />
        Sayfa Sayısına Özel Kampanya Fiyatları
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
        Çok sayfa yaptıran müşteriye sayfa başı daha uygun fiyat verebilirsiniz. Siparişin
        <strong> toplam sayfa sayısı</strong> hangi aralığa düşerse, o aralığın ücreti{" "}
        <strong>tüm ek sayfalara</strong> uygulanır. Hiçbir aralık uymazsa paketin varsayılan ek
        sayfa ücreti ({formatTL(pkg.extra_page_price)}) geçerli olur.
      </p>

      {sorted.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {sorted.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
            >
              <span className="text-neutral-700">
                <span className="font-medium">
                  {t.max_pages === null
                    ? `${t.min_pages}+ sayfa`
                    : t.min_pages === t.max_pages
                      ? `${t.min_pages} sayfa`
                      : `${t.min_pages}–${t.max_pages} sayfa`}
                </span>{" "}
                → sayfa başı{" "}
                <span className="font-medium text-brand-700">{formatTL(t.extra_page_price)}</span>
              </span>
              <ConfirmDelete onConfirm={() => deletePagePriceTierAction(t.id)} label="Sil" />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <Label htmlFor={`tier-min-${pkg.id}`} className="text-[11px]">
            Başlangıç sayfa
          </Label>
          <Input
            id={`tier-min-${pkg.id}`}
            type="number"
            min={1}
            placeholder="10"
            value={minPages}
            onChange={(e) => setMinPages(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`tier-max-${pkg.id}`} className="text-[11px]">
            Bitiş (boş = üzeri)
          </Label>
          <Input
            id={`tier-max-${pkg.id}`}
            type="number"
            min={1}
            placeholder="sınırsız"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`tier-price-${pkg.id}`} className="text-[11px]">
            Sayfa başı ücret
          </Label>
          <CurrencyInput
            id={`tier-price-${pkg.id}`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="150.00"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={isPending || !minPages || !price}
            onClick={handleAdd}
          >
            {isPending ? "Ekleniyor..." : "Kampanya Ekle"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
