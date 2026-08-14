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

export async function addGlobalAlbumModelAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Model adı gerekli." };
  const { error } = await supabase.from("album_models").insert({
    name,
    image_url: String(formData.get("image_url") || "").trim() || null,
    company_id: null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/urunler");
  return {};
}

export async function addGlobalExtraProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "print");
  if (!name || price <= 0) return { error: "Ürün adı ve fiyat gerekli." };
  const { error } = await supabase.from("extra_products").insert({ name, price, category, company_id: null });
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
