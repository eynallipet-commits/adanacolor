"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import {
  addAlbumColorAction,
  deleteAlbumColorAction,
  updateAlbumColorAction,
  type FormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorSwatch } from "@/components/color-swatch";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, SITE_ASSETS_BUCKET, formatBytes } from "@/lib/storage";
import type { AlbumColor } from "@/lib/database.types";

const initial: FormState = {};

async function uploadSwatch(file: File): Promise<{ url?: string; error?: string }> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { error: `Dosya çok büyük (en fazla ${formatBytes(MAX_IMAGE_SIZE_BYTES)}).` };
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Desteklenmeyen dosya türü. JPG, PNG veya WEBP yükleyin." };
  }
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `album-colors/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(SITE_ASSETS_BUCKET).upload(path, file);
  if (error) return { error: error.message };
  return { url: supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl };
}

function SwatchUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
        {uploading ? "Yükleniyor..." : "Kumaş görseli"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError(null);
            setUploading(true);
            const res = await uploadSwatch(file);
            setUploading(false);
            if (res.error) setError(res.error);
            else if (res.url) onUploaded(res.url);
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ColorTile({ color }: { color: AlbumColor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(color.code);
  const [name, setName] = useState(color.name ?? "");
  const [hex, setHex] = useState(color.hex ?? "#cccccc");
  const [imageUrl, setImageUrl] = useState(color.image_url);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isEditing) {
    return (
      <li className="col-span-2 space-y-2 rounded-md border border-neutral-300 p-2.5 sm:col-span-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`c-code-${color.id}`}>Kod</Label>
            <Input id={`c-code-${color.id}`} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`c-name-${color.id}`}>Ad (ops.)</Label>
            <Input id={`c-name-${color.id}`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor={`c-hex-${color.id}`}>Renk</Label>
            <input
              id={`c-hex-${color.id}`}
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-neutral-300"
            />
          </div>
          <div className="flex-1">
            <SwatchUpload onUploaded={setImageUrl} />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="mt-1 text-[11px] text-neutral-500 hover:underline"
              >
                Görseli kaldır (düz renk kullan)
              </button>
            )}
          </div>
          <ColorSwatch color={{ code, name, hex, image_url: imageUrl }} className="h-14 w-14" quality={95} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await updateAlbumColorAction(color.id, {
                  code,
                  name: name.trim() || null,
                  hex,
                  imageUrl,
                });
                if (res.error) setError(res.error);
                else setIsEditing(false);
              })
            }
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
            Vazgeç
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            className="ml-auto"
            onClick={() => startTransition(() => deleteAlbumColorAction(color.id))}
          >
            Sil
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex w-full flex-col items-center gap-1 rounded-md p-1.5 hover:bg-neutral-100"
        title="Düzenlemek için tıklayın"
      >
        <ColorSwatch color={color} className="h-20 w-full" sizes="320px" quality={95} />
        <span className="truncate text-[11px] font-medium text-neutral-600">{color.code}</span>
      </button>
    </li>
  );
}

export function ColorPalette({ colors }: { colors: AlbumColor[] }) {
  const [state, formAction, isPending] = useActionState(addAlbumColorAction, initial);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newHex, setNewHex] = useState("#cccccc");

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {colors.map((c) => (
            <ColorTile key={c.id} color={c} />
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-2 rounded-md border border-neutral-200 p-3">
        <input type="hidden" name="image_url" value={newImageUrl ?? ""} />
        <input type="hidden" name="hex" value={newHex} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="new-color-code">Renk Kodu</Label>
            <Input id="new-color-code" name="code" placeholder="Örn: 500" required />
          </div>
          <div>
            <Label htmlFor="new-color-name">Ad (opsiyonel)</Label>
            <Input id="new-color-name" name="name" placeholder="Örn: Krem" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label htmlFor="new-color-hex">Renk</Label>
            <input
              id="new-color-hex"
              type="color"
              value={newHex}
              onChange={(e) => setNewHex(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-neutral-300"
            />
          </div>
          <div className="flex-1">
            <SwatchUpload onUploaded={setNewImageUrl} />
          </div>
          <ColorSwatch color={{ code: "", name: null, hex: newHex, image_url: newImageUrl }} className="h-14 w-14" quality={95} />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Renk Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
