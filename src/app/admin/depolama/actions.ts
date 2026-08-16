"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORDER_PHOTOS_BUCKET } from "@/lib/storage";

export interface FormState {
  error?: string;
}

export async function deleteOrderPhotosAction(orderId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  // Yolu "{company_id}/{item_id}/..." diye varsaymak yerine gerçek storage.objects kayıtlarını
  // sorguluyoruz — canlı veride bazı eski dosyalar "{order_id}/{item_id}/..." yolunda kalmış
  // olabilir (bkz. migration 0019 açıklaması), varsayım bu dosyaları asla bulamazdı.
  const { data: rows, error: pathsError } = await supabase.rpc("order_photo_paths", { p_order_id: orderId });
  if (pathsError) return { error: pathsError.message };

  const paths = ((rows ?? []) as { path: string }[]).map((r) => r.path);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(ORDER_PHOTOS_BUCKET).remove(paths);
    if (removeError) return { error: removeError.message };
  }

  revalidatePath("/admin/depolama");
  revalidatePath(`/admin/siparisler/${orderId}`);
  return {};
}
