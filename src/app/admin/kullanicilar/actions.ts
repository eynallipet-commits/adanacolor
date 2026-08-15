"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FormState {
  error?: string;
}

export async function addAdminUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email) return { error: "Ad soyad ve e-posta zorunludur." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };

  const { data: userRes, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError || !userRes.user) {
    const message = userError?.message?.includes("already been registered")
      ? "Bu e-posta ile zaten bir hesap var."
      : userError?.message ?? "Kullanıcı oluşturulamadı.";
    return { error: message };
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userRes.user.id,
    role: "admin",
    full_name: fullName,
    company_id: null,
    status: "active",
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(userRes.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/kullanicilar");
  return {};
}

export async function removeAdminUserAction(userId: string): Promise<FormState> {
  const { profile } = await requireAdmin();
  if (profile.id === userId) return { error: "Kendi hesabınızı silemezsiniz." };
  const adminClient = createAdminClient();

  await adminClient.from("profiles").delete().eq("id", userId);
  await adminClient.auth.admin.deleteUser(userId);

  revalidatePath("/admin/kullanicilar");
  return {};
}
