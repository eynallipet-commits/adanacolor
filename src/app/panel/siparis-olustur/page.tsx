import { requirePhotographer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  AlbumColor,
  AlbumModel,
  AlbumModelColor,
  AlbumModelSize,
  AlbumSize,
  AlbumSizePrice,
  ExtraProduct,
  OrderItem,
  PackageType,
} from "@/lib/database.types";
import { OrderBuilder, type InitialCartLine } from "./order-builder";

function groupBy(rows: { model_id: string }[], key: "size_id" | "color_id") {
  return rows.reduce<Record<string, string[]>>((acc, row) => {
    (acc[row.model_id] ??= []).push((row as unknown as Record<string, string>)[key]);
    return acc;
  }, {});
}

export default async function SiparisOlusturPage({
  searchParams,
}: {
  searchParams: Promise<{ tekrar?: string }>;
}) {
  const { profile, company } = await requirePhotographer();
  const { tekrar } = await searchParams;
  const supabase = await createClient();

  const [sizesRes, packagesRes, pricesRes, modelsRes, extrasRes, colorsRes, modelSizesRes, modelColorsRes] =
    await Promise.all([
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
      supabase.from("album_colors").select("*").eq("active", true).order("sort_order").returns<AlbumColor[]>(),
      supabase.from("album_model_sizes").select("*").returns<AlbumModelSize[]>(),
      supabase.from("album_model_colors").select("*").returns<AlbumModelColor[]>(),
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
              albumColorId: item.album_color_id,
            }
          : { type: "extra", extraProductId: item.extra_product_id!, quantity: item.quantity }
      );
    }
  }

  const balanceBlocked = !!company?.balance_block_enabled && (company?.balance ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yeni Sipariş Oluştur</h1>
        <p className="text-neutral-500">
          {company?.name} · İskonto oranınız: <span className="font-medium">%{company?.discount_rate}</span>
        </p>
      </div>
      {balanceBlocked && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Açık hesap bakiyeniz{" "}
          <span className="font-semibold">{company!.balance.toFixed(2)} TL</span>. Yeni sipariş
          verebilmek için önce bu bakiyeyi kapatmanız gerekiyor, lütfen atölyemizle iletişime geçin.
        </p>
      )}
      <OrderBuilder
        sizes={sizesRes.data ?? []}
        packages={packagesRes.data ?? []}
        prices={pricesRes.data ?? []}
        models={modelsRes.data ?? []}
        extras={extrasRes.data ?? []}
        colors={colorsRes.data ?? []}
        modelSizes={groupBy(modelSizesRes.data ?? [], "size_id")}
        modelColors={groupBy(modelColorsRes.data ?? [], "color_id")}
        discountRate={company?.discount_rate ?? 0}
        companyId={profile.company_id}
        initialCart={initialCart}
      />
    </div>
  );
}
