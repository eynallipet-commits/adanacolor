"use client";

import { useActionState, useState } from "react";
import { FileCheck2, Loader2, UploadCloud } from "lucide-react";
import { applyAction, type ApplyState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { TaxNoInput } from "@/components/ui/tax-no-input";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  MEMBERSHIP_DOCUMENTS_BUCKET,
  formatBytes,
} from "@/lib/storage";

const initialState: ApplyState = {};

export function ApplyForm() {
  const [state, formAction, isPending] = useActionState(applyAction, initialState);
  const [renderedAt] = useState(() => Date.now());
  const [applicationId] = useState(() => crypto.randomUUID());
  const [taxCert, setTaxCert] = useState<{ path: string; name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsValid = password.length >= 6 && password === confirmPassword;

  if (state.success) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
        <p className="font-medium text-emerald-800">Başvurunuz alındı.</p>
        <p className="mt-1 text-sm text-emerald-700">
          Ekibimiz başvurunuzu inceledikten sonra size e-posta/telefon ile dönüş yapacaktır. Onaylandığında
          az önce belirlediğiniz e-posta ve şifreyle doğrudan giriş yapabilirsiniz.
        </p>
      </div>
    );
  }

  async function handleTaxCertChange(file: File | null) {
    if (!file) return;
    setUploadError(null);

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setUploadError(`Dosya çok büyük (en fazla ${formatBytes(MAX_DOCUMENT_SIZE_BYTES)}).`);
      return;
    }
    if (file.type && !ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      setUploadError("Desteklenmeyen dosya türü. JPG, PNG, WEBP veya PDF yükleyin.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${applicationId}/vergi-levhasi-${safeName}`;
    const { error } = await supabase.storage
      .from(MEMBERSHIP_DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: true });
    setUploading(false);

    if (error) {
      setUploadError(error.message);
      return;
    }
    setTaxCert({ path, name: file.name, size: file.size });
  }

  const canSubmit = !!taxCert && !uploading && passwordsValid;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="form_rendered_at" value={renderedAt} />
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="tax_certificate_path" value={taxCert?.path ?? ""} />
      {/* Honeypot: gerçek kullanıcılar görmez/doldurmaz, botlar genelde doldurur. */}
      <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Web Sitesi</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="company_name">Firma Adı *</Label>
          <Input id="company_name" name="company_name" required />
        </div>
        <div>
          <Label htmlFor="contact_name">Yetkili Adı Soyadı *</Label>
          <Input id="contact_name" name="contact_name" required />
        </div>
        <div>
          <Label htmlFor="email">E-posta *</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <PhoneInput id="phone" name="phone" required />
        </div>
        <div>
          <Label htmlFor="tax_no">Vergi No</Label>
          <TaxNoInput id="tax_no" name="tax_no" />
        </div>
        <div>
          <Label htmlFor="address">Adres</Label>
          <Input id="address" name="address" />
        </div>
        <div>
          <Label htmlFor="password">Şifre *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirm_password">Şifre (Tekrar) *</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>
      {password && password.length < 6 && (
        <p className="text-xs text-amber-600">Şifre en az 6 karakter olmalı.</p>
      )}
      {confirmPassword && password !== confirmPassword && (
        <p className="text-xs text-amber-600">Şifreler eşleşmiyor.</p>
      )}
      <div>
        <Label htmlFor="message">Mesaj</Label>
        <Textarea id="message" name="message" placeholder="Eklemek istediğiniz bilgiler..." />
      </div>

      <div>
        <Label htmlFor="tax_certificate">Vergi Levhası *</Label>
        <div className="mt-1.5">
          {taxCert ? (
            <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-emerald-800">
                <FileCheck2 className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {taxCert.name} · {formatBytes(taxCert.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setTaxCert(null)}
                className="shrink-0 text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
              >
                Değiştir
              </button>
            </div>
          ) : (
            <label
              htmlFor="tax_certificate"
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-3 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4 shrink-0" />
              )}
              {uploading ? "Yükleniyor..." : "Vergi levhanızı yüklemek için tıklayın"}
              <input
                id="tax_certificate"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={uploading}
                className="hidden"
                onChange={(e) => handleTaxCertChange(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
          <p className="mt-1 text-[11px] text-neutral-400">
            JPG, PNG, WEBP veya PDF · en fazla {formatBytes(MAX_DOCUMENT_SIZE_BYTES)}. Bu belgeye yalnızca
            yönetici ekibimiz erişebilir.
          </p>
          {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-neutral-600">
        <input type="checkbox" name="kvkk_consent" required className="mt-0.5" />
        <span>
          Kişisel verilerimin, başvurumun değerlendirilmesi ve tarafımla iletişime geçilmesi amacıyla
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenmesini kabul ediyorum. *
        </span>
      </label>

      {state.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending || !canSubmit}>
        {isPending ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </Button>
    </form>
  );
}
