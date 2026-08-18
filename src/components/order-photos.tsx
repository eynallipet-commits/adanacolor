"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileArchive, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_ARCHIVE_SIZE_BYTES,
  MAX_PHOTO_SIZE_BYTES,
  ORDER_PHOTOS_BUCKET,
  coverFolder,
  itemFolder,
  formatBytes,
} from "@/lib/storage";
import { buildZip, extractImagesFromZip, isArchiveFile, isZipFile, safeSegment } from "@/lib/archive";
import { cn, formatDate } from "@/lib/utils";

export interface StoredFile {
  name: string;
  path: string;
  size: number;
  createdAt: string;
  url: string | null;
  downloadUrl: string | null;
  isImage: boolean;
  isArchive: boolean;
}

/** Storage listesini görüntülenebilir kayıtlara çevirir (imzalı URL'lerle birlikte). */
async function describeFolder(
  supabase: ReturnType<typeof createClient>,
  folder: string
): Promise<{ files: StoredFile[]; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(ORDER_PHOTOS_BUCKET)
    .list(folder, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) return { files: [], error: error.message };

  // `id: null` olanlar gerçek dosya değil, alt klasör sözde kaydıdır (ör. "kapak").
  const entries = (data ?? []).filter((f) => f.id !== null);
  const files = await Promise.all(
    entries.map(async (f) => {
      const path = `${folder}/${f.name}`;
      const displayName = f.name.replace(/^[0-9a-f-]{36}-/i, "");
      const isImage = /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(displayName);
      const isArchive = /\.(zip|rar)$/i.test(displayName);
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
        isArchive,
      };
    })
  );
  return { files, error: null };
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function OrderPhotos({
  companyId,
  itemId,
  itemType = "album",
  requiredCount,
  canManage,
  zipBaseName,
}: {
  companyId: string;
  itemId: string;
  /** Kapak yükleme alanı yalnızca albümlerde gösterilir. */
  itemType?: "album" | "extra";
  requiredCount: number;
  canManage: boolean;
  /** "Tümünü indir" ZIP dosyasının adı — verilmezse kalem kimliği kullanılır. */
  zipBaseName?: string;
}) {
  const supabase = createClient();
  const pagesFolder = itemFolder(companyId, itemId);
  const coversFolder = coverFolder(companyId, itemId);
  const isAlbum = itemType === "album";

  const [pageFiles, setPageFiles] = useState<StoredFile[]>([]);
  const [coverFiles, setCoverFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pagesInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const [pages, covers] = await Promise.all([
      describeFolder(supabase, pagesFolder),
      isAlbum ? describeFolder(supabase, coversFolder) : Promise.resolve({ files: [], error: null }),
    ]);
    if (pages.error) setError(pages.error);
    setPageFiles(pages.files);
    setCoverFiles(covers.files);
    setLoading(false);
  }, [pagesFolder, coversFolder, isAlbum, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not derived state
    loadFiles();
  }, [loadFiles]);

  /**
   * Ortak yükleme akışı. ZIP'ler tarayıcıda açılıp içindeki görseller tek tek yüklenir;
   * RAR açılamadığı için arşiv olarak saklanır.
   */
  async function uploadInto(folder: string, fileList: FileList | null, label: string) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const errors: string[] = [];
    const incoming = Array.from(fileList);

    // 1) Arşivleri ayıkla: ZIP'i aç, RAR'ı olduğu gibi bırak.
    const queue: File[] = [];
    for (const file of incoming) {
      if (isZipFile(file)) {
        if (file.size > MAX_ARCHIVE_SIZE_BYTES) {
          errors.push(`${file.name}: arşiv ${formatBytes(MAX_ARCHIVE_SIZE_BYTES)} sınırını aşıyor.`);
          continue;
        }
        try {
          setUploadProgress({ label: `${file.name} açılıyor`, done: 0, total: 1 });
          const { files: extracted, skipped } = await extractImagesFromZip(file);
          if (extracted.length === 0) {
            errors.push(`${file.name}: arşivin içinde yüklenebilir görsel bulunamadı.`);
          }
          if (skipped.length > 0) {
            errors.push(`${file.name}: ${skipped.length} dosya görsel olmadığı için atlandı.`);
          }
          queue.push(...extracted);
        } catch {
          errors.push(`${file.name}: arşiv açılamadı, bozuk veya şifreli olabilir.`);
        }
        continue;
      }
      queue.push(file);
    }

    // 2) Boyut/tür doğrulaması. RAR arşivleri tür kontrolünden muaf, arşiv sınırına tabi.
    const valid: File[] = [];
    for (const file of queue) {
      const archive = isArchiveFile(file);
      const limit = archive ? MAX_ARCHIVE_SIZE_BYTES : MAX_PHOTO_SIZE_BYTES;
      if (file.size > limit) {
        errors.push(`${file.name}: ${formatBytes(limit)} sınırını aşıyor.`);
        continue;
      }
      if (!archive && file.type && !ALLOWED_PHOTO_TYPES.includes(file.type)) {
        errors.push(`${file.name}: desteklenmeyen dosya türü.`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      setUploadProgress({ label, done: 0, total: valid.length });
      for (const file of valid) {
        const path = `${folder}/${crypto.randomUUID()}-${safeSegment(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(ORDER_PHOTOS_BUCKET).upload(path, file);
        if (uploadError) errors.push(`${file.name}: ${uploadError.message}`);
        setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
      await loadFiles();
    }

    setUploadProgress(null);
    if (errors.length > 0) setError(errors.join(" "));
    if (pagesInputRef.current) pagesInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  async function handleDelete(path: string) {
    await supabase.storage.from(ORDER_PHOTOS_BUCKET).remove([path]);
    await loadFiles();
  }

  /** Kalemin tüm dosyalarını tek ZIP'te indirir — kapaklar `kapak/` alt klasöründe. */
  async function handleDownloadZip() {
    setZipping(true);
    setError(null);
    try {
      const entries = await Promise.all(
        [
          ...coverFiles.map((f) => ({ f, prefix: "kapak/" })),
          ...pageFiles.map((f) => ({ f, prefix: "" })),
        ].map(async ({ f, prefix }) => {
          const { data } = await supabase.storage.from(ORDER_PHOTOS_BUCKET).download(f.path);
          return data ? { path: `${prefix}${f.name}`, blob: data } : null;
        })
      );
      const usable = entries.filter((e): e is { path: string; blob: Blob } => e !== null);
      if (usable.length === 0) {
        setError("İndirilecek dosya bulunamadı.");
        return;
      }
      const base = safeSegment(zipBaseName || itemId);
      // Kök klasör ZIP açıldığında tek bir klasör olarak çıksın diye yol başına eklenir.
      triggerBlobDownload(
        await buildZip(usable.map((e) => ({ path: `${base}/${e.path}`, blob: e.blob }))),
        `${base}.zip`
      );
    } catch {
      setError("ZIP oluşturulamadı. Dosya sayısı çok fazlaysa tek tek indirmeyi deneyin.");
    } finally {
      setZipping(false);
    }
  }

  const totalFiles = pageFiles.length + coverFiles.length;
  const uploadedPages = pageFiles.filter((f) => !f.isArchive).length;
  const archiveCount = pageFiles.filter((f) => f.isArchive).length;
  const complete = requiredCount > 0 && (uploadedPages >= requiredCount || archiveCount > 0);
  const remaining = Math.max(0, requiredCount - uploadedPages);

  function renderFileGrid(files: StoredFile[], emptyText: string) {
    if (files.length === 0) return <p className="text-sm text-neutral-500">{emptyText}</p>;
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {files.map((f) => (
          <li key={f.path} className="overflow-hidden rounded-md border border-neutral-200">
            <a href={f.url ?? "#"} target="_blank" rel="noreferrer">
              {f.isImage && f.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt={f.name} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 flex-col items-center justify-center gap-1 bg-neutral-50 text-xs text-neutral-400">
                  {f.isArchive ? <FileArchive className="h-6 w-6 text-neutral-400" /> : null}
                  {f.isArchive ? "Arşiv" : "Dosyayı Aç"}
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {requiredCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                complete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              )}
            >
              {uploadedPages} / {requiredCount} sayfa fotoğrafı
            </span>
            {archiveCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                <FileArchive className="h-3 w-3" />
                {archiveCount} arşiv
              </span>
            )}
            {!complete && canManage && (
              <span className="text-xs text-neutral-500">{remaining} fotoğraf daha gerekiyor</span>
            )}
          </div>
        )}
        {totalFiles > 0 && (
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={zipping}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {zipping ? "ZIP hazırlanıyor..." : `Tümünü ZIP İndir (${totalFiles})`}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Yükleniyor...</p>
      ) : (
        <>
          {isAlbum && (
            <section className="rounded-lg border border-brand-200 bg-brand-50/40 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                <ImagePlus className="h-4 w-4 text-brand-600" />
                Albüm Kapak Fotoğrafı
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Kapağa basılacak fotoğrafı buraya, iç sayfaların fotoğraflarını aşağıdaki alana
                yükleyin. Kapak, sayfa sayısına dahil değildir.
              </p>
              {canManage && (
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  onChange={(e) => uploadInto(coversFolder, e.target.files, "Kapak yükleniyor")}
                  disabled={!!uploadProgress}
                  className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
                />
              )}
              <div className="mt-2.5">{renderFileGrid(coverFiles, "Henüz kapak fotoğrafı yüklenmedi.")}</div>
            </section>
          )}

          <section>
            <p className="text-sm font-medium text-neutral-800">
              {isAlbum ? "İç Sayfa Fotoğrafları" : "Ürün Fotoğrafları"}
            </p>
            {canManage && (
              <>
                <input
                  ref={pagesInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.zip,.rar,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-rar-compressed"
                  onChange={(e) => uploadInto(pagesFolder, e.target.files, "Fotoğraflar yükleniyor")}
                  disabled={!!uploadProgress}
                  className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  JPG, PNG, WEBP, HEIC, PDF · dosya başına en fazla {formatBytes(MAX_PHOTO_SIZE_BYTES)} — ya da
                  hepsini birden <strong>ZIP / RAR</strong> olarak gönderin (en fazla{" "}
                  {formatBytes(MAX_ARCHIVE_SIZE_BYTES)}). ZIP arşivleri otomatik açılır, RAR olduğu
                  gibi bize ulaşır.
                </p>
              </>
            )}
            {uploadProgress && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${Math.round((uploadProgress.done / uploadProgress.total) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {uploadProgress.label}: {uploadProgress.done} / {uploadProgress.total}
                </p>
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-2.5">{renderFileGrid(pageFiles, "Henüz fotoğraf yüklenmedi.")}</div>
          </section>
        </>
      )}
    </div>
  );
}
