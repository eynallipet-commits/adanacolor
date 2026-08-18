export const ORDER_PHOTOS_BUCKET = "order-photos";
export const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

/** Arşivler tek dosyada onlarca fotoğraf taşıdığı için tek fotoğraftan yüksek bir sınır. */
export const MAX_ARCHIVE_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB

/**
 * Albüm kapağı, iç sayfalardan ayrı yüklenir ve bu alt klasörde durur.
 * `list()` özyinelemeli olmadığı için mevcut (öneksiz) sayfa fotoğrafları etkilenmez —
 * bu alt klasör listede yalnızca `id: null` bir sözde kayıt olarak görünür ve elenir.
 */
export const COVER_SUBFOLDER = "kapak";

/** Bir sipariş kaleminin depolama klasörü. */
export function itemFolder(companyId: string, itemId: string) {
  return `${companyId}/${itemId}`;
}
export function coverFolder(companyId: string, itemId: string) {
  return `${itemFolder(companyId, itemId)}/${COVER_SUBFOLDER}`;
}

export const MEMBERSHIP_DOCUMENTS_BUCKET = "membership-documents";
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const SITE_ASSETS_BUCKET = "site-assets";
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isEditableOrderStatus(status: string) {
  return status !== "delivered" && status !== "cancelled";
}

/** Ödeme onaylanmadan önce (taslak/ödeme bekleniyor/inceleniyor) fotoğraflar serbestçe yönetilebilir. */
export function canManagePhotosDirectly(status: string) {
  return status === "draft" || status === "pending_payment" || status === "payment_review";
}

/** "Fotoğraf değişikliği talep et" butonu yalnızca ödeme sonrası, üretime alınana kadar aktif. */
export function canRequestPhotoChange(status: string) {
  return status === "paid";
}

/**
 * Bir sipariş kalemi için yüklenmesi gereken fotoğraf adedi.
 * Albümde her sayfa en az bir fotoğraf gerektirir; ekstra ürünlerde (canvas/baskı/kutu)
 * her adet ayrı bir fotoğraf gerektirir.
 */
export function getRequiredPhotoCount(item: {
  item_type: "album" | "extra";
  page_count: number | null;
  quantity: number;
}) {
  return item.item_type === "album" ? (item.page_count ?? 0) : item.quantity;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
