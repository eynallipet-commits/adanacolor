"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

export async function updateSeoSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({
      seo_meta_title: String(formData.get("seo_meta_title") || "").trim() || null,
      seo_meta_description: String(formData.get("seo_meta_description") || "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { error: error.message };
  revalidatePath("/admin/ayarlar");
  revalidatePath("/");
  return {};
}
