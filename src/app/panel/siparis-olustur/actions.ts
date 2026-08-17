"use server";

import { redirect } from "next/navigation";
import { requirePhotographer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calcAlbumUnitPrice, calcOrderTotals } from "@/lib/pricing";
import { mockCharge } from "@/lib/payments/mock";
import { getPaytrSettings } from "@/lib/payments/paytr";
import type {
  AlbumColor,
  AlbumModelColor,
  AlbumModelSize,
  AlbumSizePrice,
  PackagePagePrice,
  PackageType,
} from "@/lib/database.types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AlbumCartItem {
  id: string;
  type: "album";
  sizeId: string;
  packageTypeId: string;
  albumModelId: string | null;
  pageCount: number;
  quantity: number;
  coverNamesText: string;
  coverDateText: string;
  albumColorId: string | null;
}

interface ExtraCartItem {
  id: string;
  type: "extra";
  extraProductId: string;
  quantity: number;
}

type CartItem = AlbumCartItem | ExtraCartItem;

export interface CreateOrderState {
  error?: string;
}

export async function createOrderAction(
  _prevState: CreateOrderState,
  formData: FormData
): Promise<CreateOrderState> {
  const { profile, company } = await requirePhotographer();
  const paymentMethod = String(formData.get("payment_method") || "");
  const cartRaw = String(formData.get("cart") || "[]");

  if (company?.balance_block_enabled && company.balance > 0) {
    return {
      error: `Açık hesap bakiyeniz ${company.balance.toFixed(2)} TL. Yeni sipariş verebilmek için önce bu bakiyeyi kapatmanız gerekiyor. Lütfen atölyemizle iletişime geçin.`,
    };
  }

  if (paymentMethod !== "credit_card" && paymentMethod !== "bank_transfer") {
    return { error: "Geçerli bir ödeme yöntemi seçin." };
  }

  let cart: CartItem[];
  try {
    cart = JSON.parse(cartRaw);
  } catch {
    return { error: "Sepet okunamadı." };
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return { error: "Sepetiniz boş. Lütfen en az bir ürün ekleyin." };
  }

  const supabase = await createClient();

  // Fiyatları ve ürün kısıtlarını client'tan asla güvenmeden, veritabanından yeniden doğrula.
  const { data: prices } = await supabase.from("album_size_prices").select("*").returns<AlbumSizePrice[]>();
  const { data: packages } = await supabase.from("package_types").select("*").returns<PackageType[]>();
  const { data: pageTiers } = await supabase
    .from("package_page_prices")
    .select("*")
    .returns<PackagePagePrice[]>();
  const { data: extras } = await supabase.from("extra_products").select("*");
  const { data: modelSizes } = await supabase.from("album_model_sizes").select("*").returns<AlbumModelSize[]>();
  const { data: modelColors } = await supabase.from("album_model_colors").select("*").returns<AlbumModelColor[]>();
  const { data: colors } = await supabase.from("album_colors").select("*").returns<AlbumColor[]>();

  const priceMap = new Map((prices ?? []).map((p) => [`${p.size_id}:${p.package_type_id}`, p.price]));
  const packageMap = new Map((packages ?? []).map((p) => [p.id, p]));
  // Kampanya kademeleri de fiyat gibi sunucuda yeniden çözülür; istemciden gelen tutara güvenilmez.
  const tiersByPackage = (pageTiers ?? []).reduce<Map<string, PackagePagePrice[]>>((acc, t) => {
    const list = acc.get(t.package_type_id) ?? [];
    list.push(t);
    acc.set(t.package_type_id, list);
    return acc;
  }, new Map());
  const extraMap = new Map((extras ?? []).map((e) => [e.id, e]));
  const colorMap = new Map((colors ?? []).map((c) => [c.id, c]));

  const allowedSizesByModel = (modelSizes ?? []).reduce<Map<string, Set<string>>>((acc, row) => {
    if (!acc.has(row.model_id)) acc.set(row.model_id, new Set());
    acc.get(row.model_id)!.add(row.size_id);
    return acc;
  }, new Map());
  const allowedColorsByModel = (modelColors ?? []).reduce<Map<string, Set<string>>>((acc, row) => {
    if (!acc.has(row.model_id)) acc.set(row.model_id, new Set());
    acc.get(row.model_id)!.add(row.color_id);
    return acc;
  }, new Map());

  type ResolvedLine = {
    id: string;
    item_type: "album" | "extra";
    album_size_id: string | null;
    package_type_id: string | null;
    album_model_id: string | null;
    extra_product_id: string | null;
    quantity: number;
    page_count: number | null;
    cover_names_text: string | null;
    cover_date_text: string | null;
    album_color_id: string | null;
    album_color_label: string | null;
    unit_price: number;
    line_total: number;
  };

  const lines: ResolvedLine[] = [];

  for (const item of cart) {
    const id = UUID_RE.test(item.id) ? item.id : crypto.randomUUID();
    if (item.type === "album") {
      const pkg = packageMap.get(item.packageTypeId);
      const basePrice = priceMap.get(`${item.sizeId}:${item.packageTypeId}`);
      if (!pkg || basePrice === undefined) {
        return { error: "Seçilen ebat/paket kombinasyonu geçersiz." };
      }

      // Model ↔ ebat ve model ↔ renk kısıtlarını sunucuda doğrula.
      const modelId = item.albumModelId || null;
      let colorId: string | null = null;
      let colorLabelText: string | null = null;

      if (modelId) {
        const allowedSizes = allowedSizesByModel.get(modelId);
        if (allowedSizes && allowedSizes.size > 0 && !allowedSizes.has(item.sizeId)) {
          return { error: "Seçilen kapak modeli bu ebatta basılamıyor. Lütfen sepeti güncelleyin." };
        }

        const allowedColors = allowedColorsByModel.get(modelId);
        if (allowedColors && allowedColors.size > 0) {
          if (!item.albumColorId || !allowedColors.has(item.albumColorId)) {
            return { error: "Seçilen kapak modeli için geçerli bir renk seçmelisiniz." };
          }
          const color = colorMap.get(item.albumColorId);
          colorId = item.albumColorId;
          colorLabelText = color ? (color.name ? `${color.code} · ${color.name}` : color.code) : null;
        }
      }

      const quantity = Math.max(1, Math.floor(item.quantity));
      const pageCount = Math.max(pkg.base_page_count, Math.floor(item.pageCount));
      const unitPrice = calcAlbumUnitPrice(basePrice, pkg, pageCount, tiersByPackage.get(pkg.id) ?? []);
      lines.push({
        id,
        item_type: "album",
        album_size_id: item.sizeId,
        package_type_id: item.packageTypeId,
        album_model_id: modelId,
        extra_product_id: null,
        quantity,
        page_count: pageCount,
        cover_names_text: item.coverNamesText || null,
        cover_date_text: item.coverDateText || null,
        album_color_id: colorId,
        album_color_label: colorLabelText,
        unit_price: unitPrice,
        line_total: Math.round(unitPrice * quantity * 100) / 100,
      });
    } else {
      const extra = extraMap.get(item.extraProductId);
      if (!extra) {
        return { error: "Seçilen ekstra ürün geçersiz." };
      }
      const quantity = Math.max(1, Math.floor(item.quantity));
      lines.push({
        id,
        item_type: "extra",
        album_size_id: null,
        package_type_id: null,
        album_model_id: null,
        extra_product_id: item.extraProductId,
        quantity,
        page_count: null,
        cover_names_text: null,
        cover_date_text: null,
        album_color_id: null,
        album_color_label: null,
        unit_price: extra.price,
        line_total: Math.round(extra.price * quantity * 100) / 100,
      });
    }
  }

  const subtotal = Math.round(lines.reduce((s, l) => s + l.line_total, 0) * 100) / 100;
  const discountRate = company?.discount_rate ?? 0;
  const { discountAmount, total } = calcOrderTotals(subtotal, discountRate);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      company_id: profile.company_id,
      created_by: profile.id,
      status: "pending_payment",
      payment_method: paymentMethod,
      subtotal,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: "Sipariş oluşturulamadı: " + (orderError?.message ?? "bilinmeyen hata") };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(lines.map((l) => ({ ...l, order_id: order.id })));

  if (itemsError) {
    return { error: "Sipariş kalemleri kaydedilemedi: " + itemsError.message };
  }

  if (paymentMethod === "credit_card") {
    const paytrSettings = await getPaytrSettings();

    if (paytrSettings) {
      // Gerçek ödeme: kart bilgisi hiç bize gelmez, PayTR'nin iframe'inde alınır. Sipariş
      // "pending_payment" olarak kalır, /ode sayfası token üretip iframe'i gösterir, sonuç
      // PayTR'nin bildirim (webhook) uç noktasından gelir.
      await supabase.from("payments").insert({
        order_id: order.id,
        method: "credit_card",
        amount: total,
        status: "pending",
      });
      redirect(`/panel/siparisler/${order.id}/ode`);
    }

    // PayTR henüz yapılandırılmamış/kapalıysa mock (anında test) ödemeye düş.
    const charge = await mockCharge({ orderId: order.id, amount: total });
    await supabase.from("payments").insert({
      order_id: order.id,
      method: "credit_card",
      amount: total,
      status: charge.success ? "confirmed" : "failed",
      mock_reference: charge.reference,
      confirmed_at: new Date().toISOString(),
    });
    if (charge.success) {
      await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);
    }
  } else {
    await supabase.from("payments").insert({
      order_id: order.id,
      method: "bank_transfer",
      amount: total,
      status: "pending",
    });
    await supabase.from("orders").update({ status: "payment_review" }).eq("id", order.id);
  }

  redirect(`/panel/siparisler/${order.id}`);
}
