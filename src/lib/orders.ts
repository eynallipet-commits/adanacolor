import { createClient } from "@/lib/supabase/server";
import type {
  AlbumModel,
  AlbumSize,
  ExtraProduct,
  Order,
  OrderItem,
  OrderStatusHistory,
  PackageType,
  Payment,
} from "@/lib/database.types";

export interface EnrichedOrderItem extends OrderItem {
  sizeLabel: string | null;
  packageLabel: string | null;
  modelLabel: string | null;
  extraLabel: string | null;
}

export async function getOrderDetail(orderId: string) {
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single<Order>();
  if (!order) return null;

  const [itemsRes, historyRes, paymentsRes, sizesRes, packagesRes, modelsRes, extrasRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", orderId).returns<OrderItem[]>(),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .returns<OrderStatusHistory[]>(),
    supabase.from("payments").select("*").eq("order_id", orderId).returns<Payment[]>(),
    supabase.from("album_sizes").select("*").returns<AlbumSize[]>(),
    supabase.from("package_types").select("*").returns<PackageType[]>(),
    supabase.from("album_models").select("*").returns<AlbumModel[]>(),
    supabase.from("extra_products").select("*").returns<ExtraProduct[]>(),
  ]);

  const sizeMap = new Map((sizesRes.data ?? []).map((s) => [s.id, s]));
  const packageMap = new Map((packagesRes.data ?? []).map((p) => [p.id, p]));
  const modelMap = new Map((modelsRes.data ?? []).map((m) => [m.id, m]));
  const extraMap = new Map((extrasRes.data ?? []).map((e) => [e.id, e]));

  const items: EnrichedOrderItem[] = (itemsRes.data ?? []).map((item) => ({
    ...item,
    sizeLabel: item.album_size_id ? (sizeMap.get(item.album_size_id)?.code ?? null) : null,
    packageLabel: item.package_type_id ? (packageMap.get(item.package_type_id)?.name ?? null) : null,
    modelLabel: item.album_model_id ? (modelMap.get(item.album_model_id)?.name ?? null) : null,
    extraLabel: item.extra_product_id ? (extraMap.get(item.extra_product_id)?.name ?? null) : null,
  }));

  return {
    order,
    items,
    history: historyRes.data ?? [],
    payments: paymentsRes.data ?? [],
  };
}
