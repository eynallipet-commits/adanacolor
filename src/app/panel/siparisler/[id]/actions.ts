"use server";

import { revalidatePath } from "next/cache";
import { requirePhotographer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canRequestPhotoChange } from "@/lib/storage";

export interface FormState {
  error?: string;
}

export async function requestPhotoChangeAction(
  orderId: string,
  orderItemId: string,
  note: string
): Promise<FormState> {
  const { profile } = await requirePhotographer();
  const supabase = await createClient();

  if (!note.trim()) return { error: "Lütfen ne değiştirmek istediğinizi kısaca açıklayın." };

  const { data: order } = await supabase
    .from("orders")
    .select("id,status,company_id")
    .eq("id", orderId)
    .single();

  if (!order || order.company_id !== profile.company_id) return { error: "Sipariş bulunamadı." };
  if (!canRequestPhotoChange(order.status)) {
    return { error: "Bu sipariş için artık fotoğraf değişikliği talep edilemez." };
  }

  const { error } = await supabase.from("photo_change_requests").insert({
    order_id: orderId,
    order_item_id: orderItemId,
    company_id: profile.company_id,
    note: note.trim(),
    created_by: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/panel/siparisler/${orderId}`);
  return {};
}
