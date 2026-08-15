"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

export async function updateInvoiceSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const kdvRate = Number(formData.get("invoice_kdv_rate"));
  if (!Number.isFinite(kdvRate) || kdvRate < 0 || kdvRate > 100) {
    return { error: "Geçerli bir KDV oranı girin." };
  }

  const { error } = await supabase
    .from("app_settings")
    .update({
      invoice_seller_tax_office: String(formData.get("invoice_seller_tax_office") || "").trim() || null,
      invoice_seller_tax_no: String(formData.get("invoice_seller_tax_no") || "").trim() || null,
      invoice_seller_iban: String(formData.get("invoice_seller_iban") || "").trim() || null,
      invoice_kdv_rate: kdvRate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };
  revalidatePath("/admin/muhasebe");
  return {};
}
