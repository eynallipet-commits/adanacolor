"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

export async function updatePriceAction(sizeId: string, packageTypeId: string, price: number) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("album_size_prices")
    .upsert({ size_id: sizeId, package_type_id: packageTypeId, price }, { onConflict: "size_id,package_type_id" });
  revalidatePath("/admin/urunler");
}

async function replaceModelSizes(modelId: string, sizeIds: string[]) {
  const supabase = await createClient();
  await supabase.from("album_model_sizes").delete().eq("model_id", modelId);
  if (sizeIds.length > 0) {
    await supabase.from("album_model_sizes").insert(sizeIds.map((size_id) => ({ model_id: modelId, size_id })));
  }
}

async function replaceModelColors(modelId: string, colorIds: string[]) {
  const supabase = await createClient();
  await supabase.from("album_model_colors").delete().eq("model_id", modelId);
  if (colorIds.length > 0) {
    await supabase.from("album_model_colors").insert(colorIds.map((color_id) => ({ model_id: modelId, color_id })));
  }
}

export async function addGlobalAlbumModelAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Model adı gerekli." };
  const { data, error } = await supabase
    .from("album_models")
    .insert({
      name,
      image_url: String(formData.get("image_url") || "").trim() || null,
      company_id: null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Model oluşturulamadı." };

  const sizeIds = formData.getAll("size_ids").map(String).filter(Boolean);
  const colorIds = formData.getAll("color_ids").map(String).filter(Boolean);
  await replaceModelSizes(data.id, sizeIds);
  await replaceModelColors(data.id, colorIds);

  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function addGlobalExtraProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "print");
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  if (!name || price <= 0) return { error: "Ürün adı ve fiyat gerekli." };
  const { error } = await supabase
    .from("extra_products")
    .insert({ name, price, category, image_url: imageUrl, company_id: null });
  if (error) return { error: error.message };
  revalidatePath("/admin/urunler");
  return {};
}

export async function toggleGlobalAlbumModelAction(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("album_models").update({ active }).eq("id", id);
  revalidatePath("/admin/urunler");
}

export async function toggleGlobalExtraProductAction(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("extra_products").update({ active }).eq("id", id);
  revalidatePath("/admin/urunler");
}

export async function updateGlobalAlbumModelAction(
  id: string,
  input: { name: string; imageUrl: string | null; sizeIds: string[]; colorIds: string[] }
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = input.name.trim();
  if (!name) return { error: "Model adı gerekli." };
  const { error } = await supabase
    .from("album_models")
    .update({ name, image_url: input.imageUrl })
    .eq("id", id);
  if (error) return { error: error.message };

  await replaceModelSizes(id, input.sizeIds);
  await replaceModelColors(id, input.colorIds);

  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

/** Geçmiş siparişlerde kullanılan kayıtlar silinemez (FK 23503) — bunun yerine pasifleştirme önerilir. */
const IN_USE_MESSAGE =
  "Bu kayıt geçmiş siparişlerde kullanıldığı için silinemez. Bunun yerine 'Pasifleştir' diyebilirsiniz.";

export async function deleteGlobalAlbumModelAction(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("album_models").delete().eq("id", id);
  if (error) return { error: error.code === "23503" ? IN_USE_MESSAGE : error.message };
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function deleteGlobalExtraProductAction(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("extra_products").delete().eq("id", id);
  if (error) return { error: error.code === "23503" ? IN_USE_MESSAGE : error.message };
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function addAlbumSizeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const code = String(formData.get("code") || "").trim();
  if (!code) return { error: "Ebat kodu gerekli (örn: 30x60)." };
  const sortOrder = Number(formData.get("sort_order") || 0);
  const { error } = await supabase
    .from("album_sizes")
    .insert({ code, sort_order: Number.isFinite(sortOrder) ? sortOrder : 0 });
  if (error) {
    return { error: error.code === "23505" ? "Bu ebat kodu zaten kayıtlı." : error.message };
  }
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function updateAlbumSizeAction(id: string, code: string, sortOrder: number): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const trimmed = code.trim();
  if (!trimmed) return { error: "Ebat kodu gerekli." };
  const { error } = await supabase
    .from("album_sizes")
    .update({ code: trimmed, sort_order: sortOrder })
    .eq("id", id);
  if (error) {
    return { error: error.code === "23505" ? "Bu ebat kodu zaten kayıtlı." : error.message };
  }
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function deleteAlbumSizeAction(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  // album_size_prices ve album_model_sizes cascade ile temizlenir; sipariş varsa FK engeller.
  const { error } = await supabase.from("album_sizes").delete().eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Bu ebat geçmiş siparişlerde kullanıldığı için silinemez."
          : error.message,
    };
  }
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function addAlbumColorAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const code = String(formData.get("code") || "").trim();
  if (!code) return { error: "Renk kodu gerekli." };
  const { error } = await supabase.from("album_colors").insert({
    code,
    name: String(formData.get("name") || "").trim() || null,
    hex: String(formData.get("hex") || "").trim() || null,
    image_url: String(formData.get("image_url") || "").trim() || null,
  });
  if (error) {
    return { error: error.code === "23505" ? "Bu renk kodu zaten kayıtlı." : error.message };
  }
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function updateAlbumColorAction(
  id: string,
  input: { code: string; name: string | null; hex: string | null; imageUrl: string | null }
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const code = input.code.trim();
  if (!code) return { error: "Renk kodu gerekli." };
  const { error } = await supabase
    .from("album_colors")
    .update({ code, name: input.name, hex: input.hex, image_url: input.imageUrl })
    .eq("id", id);
  if (error) {
    return { error: error.code === "23505" ? "Bu renk kodu zaten kayıtlı." : error.message };
  }
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function deleteAlbumColorAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("album_colors").delete().eq("id", id);
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
}

export async function updateGlobalExtraProductAction(
  id: string,
  input: { name: string; price: number; category: string; imageUrl: string | null }
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = input.name.trim();
  if (!name || input.price <= 0) return { error: "Ürün adı ve fiyat gerekli." };
  const { error } = await supabase
    .from("extra_products")
    .update({ name, price: input.price, category: input.category, image_url: input.imageUrl })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/urunler");
  revalidatePath("/panel/siparis-olustur");
  return {};
}

export async function updateDeliverySettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const minDays = Number(formData.get("estimated_min_days"));
  const maxDays = Number(formData.get("estimated_max_days"));

  if (!Number.isInteger(minDays) || !Number.isInteger(maxDays) || minDays < 0 || maxDays < minDays) {
    return { error: "Geçerli bir gün aralığı girin (min ≤ max)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ estimated_min_days: minDays, estimated_max_days: maxDays, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) return { error: error.message };
  revalidatePath("/admin/urunler");
  return {};
}
