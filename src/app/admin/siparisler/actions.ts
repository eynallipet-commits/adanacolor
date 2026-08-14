"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function confirmBankTransferAction(orderId: string) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("payments")
    .update({ status: "confirmed", confirmed_by: profile.id, confirmed_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("method", "bank_transfer");

  await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
}

export async function startProductionAction(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("orders").update({ status: "in_production" }).eq("id", orderId);
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
}

export interface ShipState {
  error?: string;
}

export async function markShippedAction(orderId: string, carrier: string, trackingNumber: string): Promise<ShipState> {
  await requireAdmin();
  if (!carrier.trim() || !trackingNumber.trim()) {
    return { error: "Kargo firması ve takip numarası gereklidir." };
  }
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({
      status: "shipped",
      shipping_carrier: carrier.trim(),
      tracking_number: trackingNumber.trim(),
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
  return {};
}

export async function markDeliveredAction(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", orderId);
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
}

export async function cancelOrderAction(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  revalidatePath(`/admin/siparisler/${orderId}`);
  revalidatePath("/admin/siparisler");
}
