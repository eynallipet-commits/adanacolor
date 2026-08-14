"use server";

import { createClient } from "@/lib/supabase/server";

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

  if (!company_name || !contact_name || !email || !phone) {
    return { error: "Firma adı, yetkili adı, e-posta ve telefon zorunludur." };
  }
  if (!kvkkConsent) {
    return { error: "Devam etmek için KVKK Aydınlatma Metni'ni onaylamanız gerekiyor." };
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

  const { error } = await supabase.from("membership_applications").insert({
    company_name,
    contact_name,
    email,
    phone,
    tax_no,
    address,
    message,
    kvkk_consent: true,
    kvkk_consent_at: new Date().toISOString(),
  });

  if (error) {
    return { error: "Başvurunuz gönderilemedi, lütfen tekrar deneyin." };
  }

  return { success: true };
}
