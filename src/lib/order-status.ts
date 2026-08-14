import type { OrderStatus } from "@/lib/database.types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Taslak",
  pending_payment: "Ödeme Bekleniyor",
  payment_review: "Ödeme İnceleniyor",
  paid: "Ödendi",
  in_production: "Üretimde",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  pending_payment: "bg-amber-100 text-amber-800",
  payment_review: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export const ADMIN_ADVANCEABLE_STATUSES: OrderStatus[] = [
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

export const EXTRA_CATEGORY_LABELS: Record<string, string> = {
  canvas: "Canvas Baskı",
  print: "Foto Büyütme",
  box: "Kutu",
};
