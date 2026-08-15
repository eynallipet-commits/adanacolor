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

  const openingBalance = Number(formData.get("opening_balance") || 0);

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      contact_name: String(formData.get("contact_name") || "").trim() || null,
      tax_no: String(formData.get("tax_no") || "").trim() || null,
      tax_office: String(formData.get("tax_office") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      discount_rate: Number(formData.get("discount_rate") || 0),
      balance_block_enabled: formData.get("balance_block_enabled") === "on",
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Cari oluşturulamadı: " + (error?.message ?? "") };

  if (Number.isFinite(openingBalance) && openingBalance !== 0) {
    await supabase.rpc("adjust_company_balance", {
      p_company_id: data.id,
      p_amount: openingBalance,
      p_note: "Açılış bakiyesi",
    });
  }

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
      contact_name: String(formData.get("contact_name") || "").trim() || null,
      tax_no: String(formData.get("tax_no") || "").trim() || null,
      tax_office: String(formData.get("tax_office") || "").trim() || null,
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

export interface InviteResult {
  error?: string;
}

export async function inviteUserAction(
  companyId: string,
  email: string,
  fullName: string,
  password: string
): Promise<InviteResult> {
  await requireAdmin();
  if (!email) return { error: "E-posta gerekli." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };
  const adminClient = createAdminClient();

  const { data: userRes, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password,
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
  return {};
}

export async function adjustCompanyBalanceAction(companyId: string, amount: number, note: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  if (!Number.isFinite(amount) || amount === 0) return { error: "Geçerli bir tutar girin." };

  const { error } = await supabase.rpc("adjust_company_balance", {
    p_company_id: companyId,
    p_amount: amount,
    p_note: note || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/cariler/${companyId}`);
  revalidatePath("/admin/raporlar");
  return {};
}

export async function toggleBalanceBlockAction(companyId: string, enabled: boolean): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ balance_block_enabled: enabled })
    .eq("id", companyId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/cariler/${companyId}`);
  return {};
}

export async function deleteCompanyAction(companyId: string): Promise<FormState> {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Bağlı kullanıcıları önce not ediyoruz ama SİLMİYORUZ — cari silme siparişler yüzünden
  // başarısız olursa (FK), kullanıcı hesapları dokunulmadan kalmalı.
  const { data: profiles } = await adminClient.from("profiles").select("id").eq("company_id", companyId);

  const { error } = await adminClient.from("companies").delete().eq("id", companyId);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Bu cari geçmiş siparişlerde kullanıldığı için silinemez."
          : error.message,
    };
  }

  // Cari başarıyla silindi — artık company_id'siz kalan kullanıcı hesaplarını da temizle.
  for (const p of profiles ?? []) {
    await adminClient.auth.admin.deleteUser(p.id);
  }
  if (profiles && profiles.length > 0) {
    await adminClient
      .from("profiles")
      .delete()
      .in("id", profiles.map((p) => p.id));
  }

  revalidatePath("/admin/cariler");
  return {};
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
