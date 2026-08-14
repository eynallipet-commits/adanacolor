import { requirePhotographer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  AlbumModel,
  AlbumSize,
  AlbumSizePrice,
  ExtraProduct,
  OrderItem,
  PackageType,
} from "@/lib/database.types";
import { OrderBuilder, type InitialCartLine } from "./order-builder";

export default async function SiparisOlusturPage({
  searchParams,
}: {
  searchParams: Promise<{ tekrar?: string }>;
}) {
  const { profile, company } = await requirePhotographer();
  const { tekrar } = await searchParams;
  const supabase = await createClient();

  const [sizesRes, packagesRes, pricesRes, modelsRes, extrasRes] = await Promise.all([
    supabase.from("album_sizes").select("*").order("sort_order").returns<AlbumSize[]>(),
    supabase.from("package_types").select("*").order("sort_order").returns<PackageType[]>(),
    supabase.from("album_size_prices").select("*").returns<AlbumSizePrice[]>(),
    supabase
      .from("album_models")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .returns<AlbumModel[]>(),
    supabase.from("extra_products").select("*").eq("active", true).order("sort_order").returns<ExtraProduct[]>(),
  ]);

  let initialCart: InitialCartLine[] = [];
  if (tekrar) {
    const { data: prevOrder } = await supabase.from("orders").select("id,company_id").eq("id", tekrar).maybeSingle();
    if (prevOrder && prevOrder.company_id === profile.company_id) {
      const { data: prevItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", tekrar)
        .returns<OrderItem[]>();
      initialCart = (prevItems ?? []).map((item) =>
        item.item_type === "album"
          ? {
              type: "album",
              sizeId: item.album_size_id!,
              packageTypeId: item.package_type_id!,
              albumModelId: item.album_model_id,
              pageCount: item.page_count ?? 0,
              quantity: item.quantity,
              coverNamesText: item.cover_names_text ?? "",
              coverDateText: item.cover_date_text ?? "",
            }
          : { type: "extra", extraProductId: item.extra_product_id!, quantity: item.quantity }
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yeni Sipariş Oluştur</h1>
        <p className="text-neutral-500">
          {company?.name} · İskonto oranınız: <span className="font-medium">%{company?.discount_rate}</span>
        </p>
      </div>
      <OrderBuilder
        sizes={sizesRes.data ?? []}
        packages={packagesRes.data ?? []}
        prices={pricesRes.data ?? []}
        models={modelsRes.data ?? []}
        extras={extrasRes.data ?? []}
        discountRate={company?.discount_rate ?? 0}
        companyId={profile.company_id}
        initialCart={initialCart}
      />
    </div>
  );
}
