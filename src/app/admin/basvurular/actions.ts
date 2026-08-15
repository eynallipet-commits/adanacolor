"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ApproveResult {
  error?: string;
  email?: string;
}

export async function approveApplicationAction(applicationId: string, discountRate: number): Promise<ApproveResult> {
  const { profile: admin } = await requireAdmin();
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: application } = await supabase
    .from("membership_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (!application || application.status !== "pending") {
    return { error: "Başvuru bulunamadı veya zaten işlenmiş." };
  }
  if (!application.user_id) {
    return { error: "Bu başvurunun bağlı bir kullanıcı hesabı yok, onaylanamıyor." };
  }

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .insert({
      name: application.company_name,
      contact_name: application.contact_name,
      tax_no: application.tax_no,
      address: application.address,
      phone: application.phone,
      email: application.email,
      discount_rate: discountRate,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    return { error: "Cari oluşturulamadı: " + (companyError?.message ?? "") };
  }

  // Kullanıcı hesabı ve şifresi zaten başvuru anında oluşturulmuştu; burada sadece cariye bağlayıp aktifleştiriyoruz.
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ company_id: company.id, status: "active" })
    .eq("id", application.user_id);

  if (profileError) {
    return { error: "Profil güncellenemedi: " + profileError.message };
  }

  await adminClient
    .from("membership_applications")
    .update({
      status: "approved",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      created_company_id: company.id,
    })
    .eq("id", applicationId);

  revalidatePath("/admin/basvurular");
  revalidatePath("/admin/cariler");

  return { email: application.email };
}

export async function rejectApplicationAction(applicationId: string) {
  const { profile: admin } = await requireAdmin();
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: application } = await supabase
    .from("membership_applications")
    .select("user_id")
    .eq("id", applicationId)
    .single();

  await supabase
    .from("membership_applications")
    .update({ status: "rejected", reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  // Reddedilen başvurunun hesabını kaldırıyoruz ki aynı e-posta ile tekrar başvurabilsin.
  if (application?.user_id) {
    await adminClient.auth.admin.deleteUser(application.user_id);
    await adminClient.from("profiles").delete().eq("id", application.user_id);
  }

  revalidatePath("/admin/basvurular");
}
