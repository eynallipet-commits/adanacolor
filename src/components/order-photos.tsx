"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE_BYTES, ORDER_PHOTOS_BUCKET, formatBytes } from "@/lib/storage";
import { cn, formatDate } from "@/lib/utils";

interface StoredFile {
  name: string;
  path: string;
  size: number;
  createdAt: string;
  url: string | null;
  downloadUrl: string | null;
  isImage: boolean;
}

async function downloadSequentially(files: { downloadUrl: string | null; name: string }[]) {
  for (const f of files) {
    if (!f.downloadUrl) continue;
    const a = document.createElement("a");
    a.href = f.downloadUrl;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Tarayıcıların ardışık indirmeleri engellememesi için kısa bir bekleme.
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

export function OrderPhotos({
  companyId,
  itemId,
  requiredCount,
  canManage,
}: {
  companyId: string;
  itemId: string;
  requiredCount: number;
  canManage: boolean;
}) {
  const supabase = createClient();
  const folder = `${companyId}/${itemId}`;
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const { data, error: listError } = await supabase.storage
      .from(ORDER_PHOTOS_BUCKET)
      .list(folder, { sortBy: { column: "created_at", order: "desc" } });

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    const entries = (data ?? []).filter((f) => f.id !== null);
    const withUrls = await Promise.all(
      entries.map(async (f) => {
        const path = `${folder}/${f.name}`;
        const isImage = /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name);
        const displayName = f.name.replace(/^[0-9a-f-]{36}-/i, "");
        const [{ data: signed }, { data: signedDownload }] = await Promise.all([
          supabase.storage.from(ORDER_PHOTOS_BUCKET).createSignedUrl(path, 3600),
          supabase.storage.from(ORDER_PHOTOS_BUCKET).createSignedUrl(path, 3600, { download: displayName }),
        ]);
        return {
          name: displayName,
          path,
          size: f.metadata?.size ?? 0,
          createdAt: f.created_at ?? "",
          url: signed?.signedUrl ?? null,
          downloadUrl: signedDownload?.signedUrl ?? null,
          isImage,
        };
      })
    );

    setFiles(withUrls);
    setLoading(false);
  }, [folder, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not derived state
    loadFiles();
  }, [loadFiles]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const allFiles = Array.from(fileList);
    setError(null);

    const oversized = allFiles.filter((f) => f.size > MAX_PHOTO_SIZE_BYTES);
    const wrongType = allFiles.filter(
      (f) => f.type && !ALLOWED_PHOTO_TYPES.includes(f.type) && !oversized.includes(f)
    );
    const validFiles = allFiles.filter((f) => !oversized.includes(f) && !wrongType.includes(f));

    const errors: string[] = [];
    if (oversized.length > 0) {
      errors.push(`${oversized.map((f) => f.name).join(", ")}: 20 MB sınırını aşıyor.`);
    }
    if (wrongType.length > 0) {
      errors.push(`${wrongType.map((f) => f.name).join(", ")}: desteklenmeyen dosya türü.`);
    }

    if (validFiles.length > 0) {
      setUploadProgress({ done: 0, total: validFiles.length });
      for (const file of validFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(ORDER_PHOTOS_BUCKET).upload(path, file);
        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
        }
        setUploadProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
      }
      await loadFiles();
    }

    setUploadProgress(null);
    if (errors.length > 0) setError(errors.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(path: string) {
    await supabase.storage.from(ORDER_PHOTOS_BUCKET).remove([path]);
    await loadFiles();
  }

  async function handleDownloadAll() {
    setDownloadingAll(true);
    await downloadSequentially(files);
    setDownloadingAll(false);
  }

  const uploadedCount = files.length;
  const complete = requiredCount > 0 && uploadedCount >= requiredCount;
  const remaining = Math.max(0, requiredCount - uploadedCount);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {requiredCount > 0 && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                complete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              )}
            >
              {uploadedCount} / {requiredCount} fotoğraf yüklendi
            </span>
            {!complete && canManage && (
              <span className="text-xs text-neutral-500">{remaining} fotoğraf daha gerekiyor</span>
            )}
          </div>
        )}
        {files.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {downloadingAll ? "İndiriliyor..." : `Tümünü İndir (${files.length})`}
          </button>
        )}
      </div>

      {canManage && (
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={!!uploadProgress}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
          />
          <p className="mt-1 text-[11px] text-neutral-400">JPG, PNG, WEBP, HEIC veya PDF · dosya başına en fazla 20 MB</p>
          {uploadProgress && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Yükleniyor: {uploadProgress.done} / {uploadProgress.total}
              </p>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-neutral-500">Henüz dosya yüklenmedi.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f) => (
            <li key={f.path} className="overflow-hidden rounded-md border border-neutral-200">
              <a href={f.url ?? "#"} target="_blank" rel="noreferrer">
                {f.isImage && f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="h-28 w-full object-cover" />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-neutral-50 text-xs text-neutral-400">
                    Dosyayı Aç
                  </div>
                )}
              </a>
              <div className="p-2">
                <p className="truncate text-xs font-medium" title={f.name}>
                  {f.name}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {formatBytes(f.size)} · {f.createdAt ? formatDate(f.createdAt) : ""}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {f.downloadUrl && (
                    <a
                      href={f.downloadUrl}
                      download={f.name}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      İndir
                    </a>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDelete(f.path)}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
