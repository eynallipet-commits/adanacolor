"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ApplyState {
  error?: string;
  success?: boolean;
}

export async function applyAction(_prevState: ApplyState, formData: FormData): Promise<ApplyState> {
  // Honeypot: botlar genelde her alanı doldurur, insanlar bu gizli alanı hiç görmez.
  const honeypot = String(formData.get("website") || "").trim();
  // Zaman tuzağı: form açılışından çok kısa süre sonra gönderim bot işareti sayılır.
  const renderedAt = Number(formData.get("form_rendered_at") || 0);
  const elapsedMs = Date.now() - renderedAt;

  if (honeypot || !renderedAt || elapsedMs < 2000) {
    // Botu bilgilendirmeden başarılıymış gibi davran.
    return { success: true };
  }

  const company_name = String(formData.get("company_name") || "").trim();
  const contact_name = String(formData.get("contact_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const tax_no = String(formData.get("tax_no") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const message = String(formData.get("message") || "").trim() || null;
  const kvkkConsent = formData.get("kvkk_consent") === "on";
  const applicationId = String(formData.get("application_id") || "").trim();
  const taxCertificatePath = String(formData.get("tax_certificate_path") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!company_name || !contact_name || !email || !phone) {
    return { error: "Firma adı, yetkili adı, e-posta ve telefon zorunludur." };
  }
  if (phone.length !== 10 && phone.length !== 11) {
    return { error: "Telefon numarası geçersiz." };
  }
  if (tax_no && tax_no.length !== 10 && tax_no.length !== 11) {
    return { error: "Vergi No / TC Kimlik No 10 veya 11 haneli olmalı." };
  }
  if (!kvkkConsent) {
    return { error: "Devam etmek için KVKK Aydınlatma Metni'ni onaylamanız gerekiyor." };
  }
  if (!applicationId || !taxCertificatePath) {
    return { error: "Devam etmek için vergi levhanızı yüklemeniz gerekiyor." };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }
  if (password !== confirmPassword) {
    return { error: "Şifreler eşleşmiyor." };
  }

  const supabase = await createClient();

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("membership_applications")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", dayAgo);

  if (count && count > 0) {
    return { error: "Bu e-posta ile son 24 saat içinde zaten bir başvuru aldık. Ekibimiz inceliyor." };
  }

  const adminClient = createAdminClient();

  // Kullanıcı şifresini başvuru anında belirliyor; hesap admin onayına kadar "pending" kalır,
  // onaylandığında bu şifreyle doğrudan giriş yapabilsin diye auth kullanıcısı şimdiden oluşturulur.
  const { data: userRes, error: userError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userRes.user) {
    const message = userError?.message?.includes("already been registered")
      ? "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin veya farklı bir e-posta kullanın."
      : "Hesap oluşturulamadı, lütfen tekrar deneyin.";
    return { error: message };
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userRes.user.id,
    role: "photographer",
    full_name: contact_name,
    phone,
    company_id: null,
    status: "pending",
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userRes.user.id);
    return { error: "Hesap oluşturulamadı, lütfen tekrar deneyin." };
  }

  const { error } = await adminClient.from("membership_applications").insert({
    id: applicationId,
    company_name,
    contact_name,
    email,
    phone,
    tax_no,
    address,
    message,
    kvkk_consent: true,
    kvkk_consent_at: new Date().toISOString(),
    tax_certificate_path: taxCertificatePath,
    user_id: userRes.user.id,
  });

  if (error) {
    await adminClient.auth.admin.deleteUser(userRes.user.id);
    return { error: "Başvurunuz gönderilemedi, lütfen tekrar deneyin." };
  }

  return { success: true };
}
