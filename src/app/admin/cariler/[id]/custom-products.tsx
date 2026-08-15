"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import {
  addCompanyAlbumModelAction,
  addCompanyExtraProductAction,
  toggleAlbumModelActiveAction,
  toggleExtraProductActiveAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EXTRA_CATEGORY_LABELS } from "@/lib/order-status";
import { formatTL } from "@/lib/utils";
import type { AlbumModel, ExtraProduct } from "@/lib/database.types";

export function CustomAlbumModels({ companyId, models }: { companyId: string; models: AlbumModel[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {models.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {models.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span className="flex items-center gap-2.5">
                <span className="relative h-9 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {m.image_url ? (
                    <Image src={m.image_url} alt={m.name} fill className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-neutral-300">
                      <ImageOff className="h-3.5 w-3.5" />
                    </span>
                  )}
                </span>
                <span className={m.active ? "" : "text-neutral-400 line-through"}>{m.name}</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startTransition(() => toggleAlbumModelActiveAction(m.id, companyId, !m.active))}
              >
                {m.active ? "Pasifleştir" : "Aktifleştir"}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        action={(formData) =>
          startTransition(async () => {
            const res = await addCompanyAlbumModelAction(companyId, formData);
            setError(res.error ?? null);
          })
        }
      >
        <div className="flex-1">
          <Label htmlFor={`model-name-${companyId}`}>Yeni Model Adı</Label>
          <Input id={`model-name-${companyId}`} name="name" placeholder="Örn: Vintage" required />
        </div>
        <div className="flex-1">
          <Label htmlFor={`model-image-${companyId}`}>Görsel URL (opsiyonel)</Label>
          <Input id={`model-image-${companyId}`} name="image_url" placeholder="/albums/ornek.jpg" />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Ekle
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function CustomExtraProducts({ companyId, extras }: { companyId: string; extras: ExtraProduct[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {extras.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {extras.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {EXTRA_CATEGORY_LABELS[e.category]} · {e.name} — {formatTL(e.price)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startTransition(() => toggleExtraProductActiveAction(e.id, companyId, !e.active))}
              >
                {e.active ? "Pasifleştir" : "Aktifleştir"}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="grid grid-cols-4 gap-2"
        action={(formData) =>
          startTransition(async () => {
            const res = await addCompanyExtraProductAction(companyId, formData);
            setError(res.error ?? null);
          })
        }
      >
        <div className="col-span-2">
          <Label htmlFor={`extra-name-${companyId}`}>Ürün Adı</Label>
          <Input id={`extra-name-${companyId}`} name="name" required />
        </div>
        <div>
          <Label htmlFor={`extra-cat-${companyId}`}>Kategori</Label>
          <Select id={`extra-cat-${companyId}`} name="category" defaultValue="print">
            <option value="canvas">Canvas</option>
            <option value="print">Foto Büyütme</option>
            <option value="box">Kutu</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={`extra-price-${companyId}`}>Fiyat</Label>
          <CurrencyInput id={`extra-price-${companyId}`} name="price" required />
        </div>
        <Button type="submit" size="sm" className="col-span-4" disabled={isPending}>
          Ekle
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
