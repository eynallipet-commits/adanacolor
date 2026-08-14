export const ORDER_PHOTOS_BUCKET = "order-photos";
export const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export function isEditableOrderStatus(status: string) {
  return status !== "delivered" && status !== "cancelled";
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
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
