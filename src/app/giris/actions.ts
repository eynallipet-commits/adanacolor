"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gereklidir." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: "Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin." };
  }

  if (next && next.startsWith("/")) {
    redirect(next);
  }
  redirect(profile.role === "admin" ? "/admin" : "/panel");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
