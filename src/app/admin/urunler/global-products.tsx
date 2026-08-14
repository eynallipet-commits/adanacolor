"use client";

import { useActionState, useTransition } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import {
  addGlobalAlbumModelAction,
  addGlobalExtraProductAction,
  toggleGlobalAlbumModelAction,
  toggleGlobalExtraProductAction,
  type FormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EXTRA_CATEGORY_LABELS } from "@/lib/order-status";
import { formatTL } from "@/lib/utils";
import type { AlbumModel, ExtraProduct } from "@/lib/database.types";

const initial: FormState = {};

export function GlobalAlbumModels({ models }: { models: AlbumModel[] }) {
  const [state, formAction, isPending] = useActionState(addGlobalAlbumModelAction, initial);
  const [, startTransition] = useTransition();

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
                onClick={() => startTransition(() => toggleGlobalAlbumModelAction(m.id, !m.active))}
              >
                {m.active ? "Pasifleştir" : "Aktifleştir"}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="global-model-name">Yeni Model Adı</Label>
          <Input id="global-model-name" name="name" placeholder="Örn: Safir" required />
        </div>
        <div className="flex-1">
          <Label htmlFor="global-model-image">Görsel URL (opsiyonel)</Label>
          <Input id="global-model-image" name="image_url" placeholder="/albums/ornek.jpg" />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}

export function GlobalExtraProducts({ extras }: { extras: ExtraProduct[] }) {
  const [state, formAction, isPending] = useActionState(addGlobalExtraProductAction, initial);
  const [, startTransition] = useTransition();

  const grouped = extras.reduce<Record<string, ExtraProduct[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="mb-1 text-xs font-semibold uppercase text-neutral-400">
            {EXTRA_CATEGORY_LABELS[category] ?? category}
          </p>
          <ul className="divide-y divide-neutral-100">
            {items.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {e.name} — {formatTL(e.price)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startTransition(() => toggleGlobalExtraProductAction(e.id, !e.active))}
                >
                  {e.active ? "Pasifleştir" : "Aktifleştir"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <form action={formAction} className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <Label htmlFor="global-extra-name">Ürün Adı</Label>
          <Input id="global-extra-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="global-extra-cat">Kategori</Label>
          <Select id="global-extra-cat" name="category" defaultValue="print">
            <option value="canvas">Canvas</option>
            <option value="print">Foto Büyütme</option>
            <option value="box">Kutu</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="global-extra-price">Fiyat</Label>
          <Input id="global-extra-price" name="price" type="number" min={0} step="0.01" required />
        </div>
        <Button type="submit" size="sm" className="col-span-4" disabled={isPending}>
          Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
