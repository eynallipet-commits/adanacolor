"use client";

import { useActionState, useState } from "react";
import { applyAction, type ApplyState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ApplyState = {};

export function ApplyForm() {
  const [state, formAction, isPending] = useActionState(applyAction, initialState);
  const [renderedAt] = useState(() => Date.now());

  if (state.success) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
        <p className="font-medium text-emerald-800">Başvurunuz alındı.</p>
        <p className="mt-1 text-sm text-emerald-700">
          Ekibimiz başvurunuzu inceledikten sonra size e-posta/telefon ile dönüş yapacaktır.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="form_rendered_at" value={renderedAt} />
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
          <Input id="phone" name="phone" type="tel" required />
        </div>
        <div>
          <Label htmlFor="tax_no">Vergi No</Label>
          <Input id="tax_no" name="tax_no" />
        </div>
        <div>
          <Label htmlFor="address">Adres</Label>
          <Input id="address" name="address" />
        </div>
      </div>
      <div>
        <Label htmlFor="message">Mesaj</Label>
        <Textarea id="message" name="message" placeholder="Eklemek istediğiniz bilgiler..." />
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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Gönderiliyor..." : "Başvuruyu Gönder"}
      </Button>
    </form>
  );
}
