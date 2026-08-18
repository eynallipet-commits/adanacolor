import JSZip from "jszip";

/**
 * Fotoğrafçıların topluca dosya göndermesi için arşiv desteği.
 *
 * ZIP tarayıcıda açılır: içindeki görseller tek tek yüklenir, böylece önizleme ve
 * "kaç fotoğraf yüklendi" sayacı normal yüklemeyle birebir aynı çalışır.
 * RAR formatı tarayıcıda açılamadığı için olduğu gibi saklanır ve adminin indirdiği
 * pakete arşiv dosyası olarak konur.
 */
export const ARCHIVE_EXTENSIONS = [".zip", ".rar"] as const;

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|heic|heif|tiff?|bmp|pdf)$/i;
/** macOS ve Windows'un arşivlere sıkıştırdığı sistem çöpleri. */
const JUNK_RE = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|\._)/i;

export function isZipFile(file: File) {
  return /\.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed";
}

export function isRarFile(file: File) {
  return /\.rar$/i.test(file.name) || file.type === "application/vnd.rar" || file.type === "application/x-rar-compressed";
}

export function isArchiveFile(file: File) {
  return isZipFile(file) || isRarFile(file);
}

/** ZIP içindeki görselleri (klasör yapısını düzleyerek) File nesnelerine çevirir. */
export async function extractImagesFromZip(file: File): Promise<{ files: File[]; skipped: string[] }> {
  // File yerine ArrayBuffer veriyoruz: JSZip'in Blob desteği ortama göre değişiyor,
  // ArrayBuffer her yerde (tarayıcı ve Node testleri) aynı şekilde çalışıyor.
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const files: File[] = [];
  const skipped: string[] = [];

  const entries = Object.values(zip.files).filter((e) => !e.dir && !JUNK_RE.test(e.name));
  for (const entry of entries) {
    if (!IMAGE_EXT_RE.test(entry.name)) {
      skipped.push(entry.name);
      continue;
    }
    const blob = await entry.async("blob");
    // Arşiv içindeki klasör yolu düzleştirilir; aynı adlı dosyalar çakışmasın diye
    // yükleme sırasında zaten benzersiz bir önek ekleniyor.
    const baseName = entry.name.split("/").pop() || entry.name;
    // JSZip, blob.type'ı neredeyse hiç doldurmaz (ZIP formatı MIME türü saklamaz);
    // boş bırakırsak dosya "application/octet-stream" olarak yüklenir ve admin panelinde
    // görsel değil belge gibi görünür, baskı yazılımı da tanımayabilir.
    const type = guessMimeType(baseName) || blob.type || "application/octet-stream";
    files.push(new File([blob], baseName, { type }));
  }
  return { files, skipped };
}

export interface ZipEntry {
  /** ZIP içindeki tam yol (klasörler dahil), ör. "AC202600011/1-30x50/kapak/on.jpg". */
  path: string;
  blob: Blob;
}

/** Verilen dosyaları tek bir ZIP'e paketler (görseller zaten sıkışık olduğu için saklama modunda). */
export async function buildZip(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const e of entries) {
    // Blob yerine ArrayBuffer: JSZip'in Blob desteği ortama bağlı (bkz. extractImagesFromZip).
    zip.file(e.path, await e.blob.arrayBuffer());
  }
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

/** Klasör/dosya adı olarak güvenli hale getirir (ZIP yolları ve Storage anahtarları için). */
export function safeSegment(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_");
  if (!cleaned) return "dosya";
  if (cleaned.length <= 80) return cleaned;

  // Uzun dosya adlarını 80 karaktere keserken uzantıyı (.jpg, .png, ...) korumak gerekir —
  // aksi halde örn. bir JPG, uzantısız kalıp admin panelinde/baskı sürecinde "belge" olarak
  // görünür ve baskıya gidemez.
  const dot = cleaned.lastIndexOf(".");
  const ext = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : "";
  const stem = ext ? cleaned.slice(0, dot) : cleaned;
  const maxStem = Math.max(1, 80 - ext.length);
  return stem.slice(0, maxStem) + ext;
}

/** Uzantıdan MIME türü tahmin eder — JSZip'in `blob.type` alanı çoğu zaman boş döner. */
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
  pdf: "application/pdf",
};

function guessMimeType(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (ext && EXT_MIME[ext]) || null;
}
