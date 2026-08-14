"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export interface ApproveResult {
  error?: string;
  tempPassword?: string;
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

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .insert({
      name: application.company_name,
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

  const tempPassword = generateTempPassword();
  const { data: userRes, error: userError } = await adminClient.auth.admin.createUser({
    email: application.email,
    password: tempPassword,
    email_confirm: true,
  });

  if (userError || !userRes.user) {
    return { error: "Kullanıcı oluşturulamadı: " + (userError?.message ?? "") };
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userRes.user.id,
    role: "photographer",
    full_name: application.contact_name,
    phone: application.phone,
    company_id: company.id,
    status: "active",
  });

  if (profileError) {
    return { error: "Profil oluşturulamadı: " + profileError.message };
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

  return { tempPassword, email: application.email };
}

export async function rejectApplicationAction(applicationId: string) {
  const { profile: admin } = await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("membership_applications")
    .update({ status: "rejected", reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  revalidatePath("/admin/basvurular");
}
