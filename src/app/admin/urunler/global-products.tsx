"use client";

import { useActionState, useState, useTransition } from "react";
import Image from "next/image";
import { ImageOff, Loader2, UploadCloud } from "lucide-react";
import {
  addGlobalAlbumModelAction,
  addGlobalExtraProductAction,
  deleteGlobalAlbumModelAction,
  deleteGlobalExtraProductAction,
  toggleGlobalAlbumModelAction,
  toggleGlobalExtraProductAction,
  updateGlobalAlbumModelAction,
  updateGlobalExtraProductAction,
  type FormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EXTRA_CATEGORY_LABELS } from "@/lib/order-status";
import { formatTL, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ColorSwatch } from "@/components/color-swatch";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, SITE_ASSETS_BUCKET, formatBytes } from "@/lib/storage";
import type { AlbumColor, AlbumModel, AlbumSize, ExtraCategory, ExtraProduct } from "@/lib/database.types";

const initial: FormState = {};

function extractStoragePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;
  const marker = `/${SITE_ASSETS_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

async function uploadImage(file: File, folder: string): Promise<{ url?: string; error?: string }> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: `Dosya çok büyük (en fazla ${formatBytes(MAX_IMAGE_SIZE_BYTES)}).` };
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Desteklenmeyen dosya türü. JPG, PNG veya WEBP yükleyin." };
  }
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).upload(path, file);
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

async function removeStoredImage(publicUrl: string | null) {
  const path = extractStoragePath(publicUrl);
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(SITE_ASSETS_BUCKET).remove([path]);
}

function ImageThumb({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded bg-neutral-100", className)}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-neutral-300">
          <ImageOff className="h-3.5 w-3.5" />
        </span>
      )}
    </span>
  );
}

function ImageUploadField({
  label,
  currentUrl,
  folder,
  onChange,
}: {
  label: string;
  currentUrl: string | null;
  folder: string;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const res = await uploadImage(file, folder);
    setUploading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChange(res.url ?? null);
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2.5">
        <ImageThumb src={currentUrl} alt="" className="h-12 w-16" />
        <label className="flex flex-1 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2 text-xs text-neutral-600 hover:bg-neutral-100">
          {uploading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5 shrink-0" />}
          {uploading ? "Yükleniyor..." : "Görsel seç"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SizePicker({
  sizes,
  selected,
  onToggle,
  idPrefix,
}: {
  sizes: AlbumSize[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  idPrefix: string;
}) {
  return (
    <div>
      <Label>Basılabilen Ebatlar</Label>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((s) => {
          const on = selected.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                on
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
              )}
              aria-pressed={on}
            >
              {s.code}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-neutral-400">
        Fotoğrafçı yalnızca seçtiğiniz ebatlarda sipariş verebilir. Hiçbiri seçilmezse tüm ebatlar açık kalır.
      </p>
      {/* Sunucu action'ı için (yeni model formunda kullanılır) */}
      {[...selected].map((id) => (
        <input key={`${idPrefix}-${id}`} type="hidden" name="size_ids" value={id} />
      ))}
    </div>
  );
}

function ColorPicker({
  colors,
  selected,
  onToggle,
  idPrefix,
}: {
  colors: AlbumColor[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  idPrefix: string;
}) {
  return (
    <div>
      <Label>Sunulan Renkler</Label>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c) => {
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md border p-1 transition-colors",
                on ? "border-brand-600 bg-brand-50" : "border-transparent opacity-40 hover:opacity-70"
              )}
              aria-pressed={on}
              title={c.name ? `${c.code} · ${c.name}` : c.code}
            >
              <ColorSwatch color={c} className="h-7 w-9" />
              <span className="text-[10px] font-medium text-neutral-600">{c.code}</span>
            </button>
          );
        })}
      </div>
      {colors.length === 0 && (
        <p className="mt-1 text-[11px] text-neutral-400">Önce &quot;Kumaş Renk Paleti&quot; bölümünden renk ekleyin.</p>
      )}
      {[...selected].map((id) => (
        <input key={`${idPrefix}-${id}`} type="hidden" name="color_ids" value={id} />
      ))}
    </div>
  );
}

function AlbumModelRow({
  model,
  sizes,
  colors,
  initialSizeIds,
  initialColorIds,
}: {
  model: AlbumModel;
  sizes: AlbumSize[];
  colors: AlbumColor[];
  initialSizeIds: string[];
  initialColorIds: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(model.name);
  const [imageUrl, setImageUrl] = useState(model.image_url);
  const [sizeIds, setSizeIds] = useState(() => new Set(initialSizeIds));
  const [colorIds, setColorIds] = useState(() => new Set(initialColorIds));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sizeMap = new Map(sizes.map((s) => [s.id, s]));
  const supportedSizeCodes = initialSizeIds
    .map((id) => sizeMap.get(id)?.code)
    .filter((c): c is string => !!c);

  function toggle(setFn: typeof setSizeIds, id: string) {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      if (imageUrl !== model.image_url) await removeStoredImage(model.image_url);
      const res = await updateGlobalAlbumModelAction(model.id, {
        name,
        imageUrl,
        sizeIds: [...sizeIds],
        colorIds: [...colorIds],
      });
      if (res.error) setError(res.error);
      else setIsEditing(false);
    });
  }

  function handleCancel() {
    setName(model.name);
    setImageUrl(model.image_url);
    setSizeIds(new Set(initialSizeIds));
    setColorIds(new Set(initialColorIds));
    setError(null);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="space-y-3 rounded-md border border-neutral-300 p-3">
        <div>
          <Label htmlFor={`model-name-${model.id}`}>Model Adı</Label>
          <Input id={`model-name-${model.id}`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <ImageUploadField label="Görsel" currentUrl={imageUrl} folder="album-models" onChange={setImageUrl} />
        <SizePicker
          sizes={sizes}
          selected={sizeIds}
          onToggle={(id) => toggle(setSizeIds, id)}
          idPrefix={`edit-size-${model.id}`}
        />
        <ColorPicker
          colors={colors}
          selected={colorIds}
          onToggle={(id) => toggle(setColorIds, id)}
          idPrefix={`edit-color-${model.id}`}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button size="sm" variant="ghost" disabled={isPending} onClick={handleCancel}>
            Vazgeç
          </Button>
          <span className="ml-auto">
            <ConfirmDelete onConfirm={() => deleteGlobalAlbumModelAction(model.id)} label="Modeli Sil" />
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-2 py-2 text-sm">
      <span className="flex min-w-0 items-start gap-2.5">
        <ImageThumb src={model.image_url} alt={model.name} className="mt-0.5 h-9 w-12" />
        <span className="min-w-0">
          <span className={cn("block truncate", model.active ? "" : "text-neutral-400 line-through")}>
            {model.name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-neutral-400">
            {supportedSizeCodes.length > 0 ? supportedSizeCodes.join(", ") : "Tüm ebatlar"}
            {" · "}
            {initialColorIds.length} renk
          </span>
        </span>
      </span>
      <span className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startTransition(() => toggleGlobalAlbumModelAction(model.id, !model.active))}
        >
          {model.active ? "Pasifleştir" : "Aktifleştir"}
        </Button>
      </span>
    </li>
  );
}

export function GlobalAlbumModels({
  models,
  sizes,
  colors,
  modelSizes,
  modelColors,
}: {
  models: AlbumModel[];
  sizes: AlbumSize[];
  colors: AlbumColor[];
  modelSizes: Record<string, string[]>;
  modelColors: Record<string, string[]>;
}) {
  const [state, formAction, isPending] = useActionState(addGlobalAlbumModelAction, initial);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newSizeIds, setNewSizeIds] = useState<Set<string>>(() => new Set(sizes.map((s) => s.id)));
  const [newColorIds, setNewColorIds] = useState<Set<string>>(() => new Set(colors.map((c) => c.id)));

  function toggle(setFn: typeof setNewSizeIds, id: string) {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {models.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {models.map((m) => (
            <AlbumModelRow
              key={m.id}
              model={m}
              sizes={sizes}
              colors={colors}
              initialSizeIds={modelSizes[m.id] ?? []}
              initialColorIds={modelColors[m.id] ?? []}
            />
          ))}
        </ul>
      )}
      <form action={formAction} className="space-y-3 rounded-md border border-neutral-200 p-3">
        <input type="hidden" name="image_url" value={newImageUrl ?? ""} />
        <div>
          <Label htmlFor="global-model-name">Yeni Model Adı</Label>
          <Input id="global-model-name" name="name" placeholder="Örn: Safir" required />
        </div>
        <ImageUploadField label="Görsel (opsiyonel)" currentUrl={newImageUrl} folder="album-models" onChange={setNewImageUrl} />
        <SizePicker
          sizes={sizes}
          selected={newSizeIds}
          onToggle={(id) => toggle(setNewSizeIds, id)}
          idPrefix="new-size"
        />
        <ColorPicker
          colors={colors}
          selected={newColorIds}
          onToggle={(id) => toggle(setNewColorIds, id)}
          idPrefix="new-color"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}

function ExtraProductRow({ extra }: { extra: ExtraProduct }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(extra.name);
  const [price, setPrice] = useState(extra.price.toString());
  const [category, setCategory] = useState<string>(extra.category);
  const [imageUrl, setImageUrl] = useState(extra.image_url);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    const priceNum = Number(price);
    startTransition(async () => {
      if (imageUrl !== extra.image_url) await removeStoredImage(extra.image_url);
      const res = await updateGlobalExtraProductAction(extra.id, { name, price: priceNum, category, imageUrl });
      if (res.error) setError(res.error);
      else setIsEditing(false);
    });
  }

  function handleCancel() {
    setName(extra.name);
    setPrice(extra.price.toString());
    setCategory(extra.category);
    setImageUrl(extra.image_url);
    setError(null);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="space-y-3 rounded-md border border-neutral-200 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`extra-name-${extra.id}`}>Ürün Adı</Label>
            <Input id={`extra-name-${extra.id}`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`extra-price-${extra.id}`}>Fiyat</Label>
            <CurrencyInput
              id={`extra-price-${extra.id}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`extra-cat-${extra.id}`}>Kategori</Label>
          <Select id={`extra-cat-${extra.id}`} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="canvas">Canvas</option>
            <option value="print">Foto Büyütme</option>
            <option value="box">Kutu</option>
          </Select>
        </div>
        <ImageUploadField label="Görsel" currentUrl={imageUrl} folder="extra-products" onChange={setImageUrl} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button size="sm" variant="ghost" disabled={isPending} onClick={handleCancel}>
            Vazgeç
          </Button>
          <span className="ml-auto">
            <ConfirmDelete onConfirm={() => deleteGlobalExtraProductAction(extra.id)} label="Ürünü Sil" />
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2.5">
        <ImageThumb src={extra.image_url} alt={extra.name} className="h-9 w-12" />
        <span className={cn("truncate", extra.active ? "" : "text-neutral-400 line-through")}>
          {extra.name} — {formatTL(extra.price)}
        </span>
      </span>
      <span className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startTransition(() => toggleGlobalExtraProductAction(extra.id, !extra.active))}
        >
          {extra.active ? "Pasifleştir" : "Aktifleştir"}
        </Button>
      </span>
    </li>
  );
}

export function GlobalExtraProducts({ extras }: { extras: ExtraProduct[] }) {
  const [state, formAction, isPending] = useActionState(addGlobalExtraProductAction, initial);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);

  const grouped = extras.reduce<Record<string, ExtraProduct[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="mb-1 text-xs font-semibold uppercase text-neutral-400">
            {EXTRA_CATEGORY_LABELS[category as ExtraCategory] ?? category}
          </p>
          <ul className="divide-y divide-neutral-100">
            {items.map((e) => (
              <ExtraProductRow key={e.id} extra={e} />
            ))}
          </ul>
        </div>
      ))}
      <form action={formAction} className="space-y-3 rounded-md border border-neutral-200 p-3">
        <input type="hidden" name="image_url" value={newImageUrl ?? ""} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="global-extra-name">Ürün Adı</Label>
            <Input id="global-extra-name" name="name" required />
          </div>
          <div>
            <Label htmlFor="global-extra-price">Fiyat</Label>
            <CurrencyInput id="global-extra-price" name="price" required />
          </div>
        </div>
        <div>
          <Label htmlFor="global-extra-cat">Kategori</Label>
          <Select id="global-extra-cat" name="category" defaultValue="print">
            <option value="canvas">Canvas</option>
            <option value="print">Foto Büyütme</option>
            <option value="box">Kutu</option>
          </Select>
        </div>
        <ImageUploadField label="Görsel (opsiyonel)" currentUrl={newImageUrl} folder="extra-products" onChange={setNewImageUrl} />
        <Button type="submit" size="sm" disabled={isPending}>
          Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
