"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FormState {
  error?: string;
}

export async function createCompanyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Firma adı zorunludur." };

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      tax_no: String(formData.get("tax_no") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      discount_rate: Number(formData.get("discount_rate") || 0),
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Cari oluşturulamadı: " + (error?.message ?? "") };

  revalidatePath("/admin/cariler");
  redirect(`/admin/cariler/${data.id}`);
}

export async function updateCompanyAction(companyId: string, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({
      name: String(formData.get("name") || "").trim(),
      tax_no: String(formData.get("tax_no") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      discount_rate: Number(formData.get("discount_rate") || 0),
    })
    .eq("id", companyId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/cariler/${companyId}`);
  revalidatePath("/admin/cariler");
  return {};
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export interface InviteResult {
  error?: string;
  tempPassword?: string;
}

export async function inviteUserAction(companyId: string, email: string, fullName: string): Promise<InviteResult> {
  await requireAdmin();
  if (!email) return { error: "E-posta gerekli." };
  const adminClient = createAdminClient();

  const tempPassword = generateTempPassword();
  const { data: userRes, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (userError || !userRes.user) return { error: userError?.message ?? "Kullanıcı oluşturulamadı." };

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userRes.user.id,
    role: "photographer",
    full_name: fullName || null,
    company_id: companyId,
    status: "active",
  });
  if (profileError) return { error: profileError.message };

  revalidatePath(`/admin/cariler/${companyId}`);
  return { tempPassword };
}

export async function addCompanyAlbumModelAction(companyId: string, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Model adı gerekli." };

  const { error } = await supabase.from("album_models").insert({
    name,
    image_url: String(formData.get("image_url") || "").trim() || null,
    company_id: companyId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/cariler/${companyId}`);
  return {};
}

export async function addCompanyExtraProductAction(companyId: string, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);
  const category = String(formData.get("category") || "print");
  if (!name || price <= 0) return { error: "Ürün adı ve fiyat gerekli." };

  const { error } = await supabase.from("extra_products").insert({
    name,
    price,
    category,
    company_id: companyId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/cariler/${companyId}`);
  return {};
}

export async function toggleAlbumModelActiveAction(id: string, companyId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("album_models").update({ active }).eq("id", id);
  revalidatePath(`/admin/cariler/${companyId}`);
  revalidatePath("/admin/urunler");
}

export async function toggleExtraProductActiveAction(id: string, companyId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("extra_products").update({ active }).eq("id", id);
  revalidatePath(`/admin/cariler/${companyId}`);
  revalidatePath("/admin/urunler");
}
