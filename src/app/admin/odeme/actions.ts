"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

export async function updateBankTransferSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({
      bank_transfer_bank_name: String(formData.get("bank_transfer_bank_name") || "").trim() || null,
      bank_transfer_account_name: String(formData.get("bank_transfer_account_name") || "").trim() || null,
      bank_transfer_iban: String(formData.get("bank_transfer_iban") || "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };
  revalidatePath("/admin/odeme");
  return {};
}

export async function updatePaytrSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const merchantId = String(formData.get("paytr_merchant_id") || "").trim();
  const merchantKey = String(formData.get("paytr_merchant_key") || "").trim();
  const merchantSalt = String(formData.get("paytr_merchant_salt") || "").trim();
  const enabled = formData.get("paytr_enabled") === "on";
  const testMode = formData.get("paytr_test_mode") === "on";

  if (enabled && (!merchantId || !merchantKey || !merchantSalt)) {
    return { error: "PayTR'yi aktif etmek için Mağaza No, Mağaza Anahtarı ve Gizli Anahtar zorunludur." };
  }

  const { error } = await supabase
    .from("payment_provider_settings")
    .update({
      paytr_enabled: enabled,
      paytr_test_mode: testMode,
      paytr_merchant_id: merchantId || null,
      paytr_merchant_key: merchantKey || null,
      paytr_merchant_salt: merchantSalt || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };
  revalidatePath("/admin/odeme");
  return {};
}
