"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, SITE_ASSETS_BUCKET, formatBytes } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InstagramPost } from "@/lib/database.types";
import { addInstagramPostAction, deleteInstagramPostAction } from "./actions";

export function InstagramManager({ posts }: { posts: (InstagramPost & { publicUrl: string })[] }) {
  const [caption, setCaption] = useState("");
  const [permalink, setPermalink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(file: File | null) {
    if (!file) return;
    setError(null);

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`Dosya çok büyük (en fazla ${formatBytes(MAX_IMAGE_SIZE_BYTES)}).`);
      return;
    }
    if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Desteklenmeyen dosya türü. JPG, PNG veya WEBP yükleyin.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `instagram/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(SITE_ASSETS_BUCKET).upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const res = await addInstagramPostAction({ imagePath: path, caption, permalink });
    setUploading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setCaption("");
    setPermalink("");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="caption">Açıklama (opsiyonel)</Label>
            <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Kısa açıklama" />
          </div>
          <div>
            <Label htmlFor="permalink">Instagram Gönderi Bağlantısı (opsiyonel)</Label>
            <Input
              id="permalink"
              value={permalink}
              onChange={(e) => setPermalink(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
            />
          </div>
        </div>
        <label
          htmlFor="instagram_image"
          className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-3 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          {uploading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <UploadCloud className="h-4 w-4 shrink-0" />}
          {uploading ? "Yükleniyor..." : "Görsel seçip yükleyin (Instagram'da paylaştığınız görseli buraya da ekleyin)"}
          <input
            id="instagram_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz görsel eklenmedi.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <div key={post.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="relative aspect-square">
                <Image src={post.publicUrl} alt={post.caption || ""} fill className="object-cover" />
              </div>
              <div className="p-2.5">
                {post.caption && <p className="truncate text-xs text-neutral-600">{post.caption}</p>}
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isPending}
                  className="mt-2 w-full gap-1.5"
                  onClick={() => startTransition(() => deleteInstagramPostAction(post.id, post.image_path))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Kaldır
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
