"use client";

import { useState, useTransition } from "react";
import { updateCompanyAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { TaxNoInput } from "@/components/ui/tax-no-input";
import type { Company } from "@/lib/database.types";

export function CompanyEditForm({ company }: { company: Company }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      action={(formData) =>
        startTransition(async () => {
          setSaved(false);
          const res = await updateCompanyAction(company.id, formData);
          if (res.error) setError(res.error);
          else {
            setError(null);
            setSaved(true);
          }
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Firma Adı</Label>
          <Input id="name" name="name" defaultValue={company.name} required />
        </div>
        <div>
          <Label htmlFor="discount_rate">İskonto Oranı (%)</Label>
          <Input id="discount_rate" name="discount_rate" type="number" min={0} max={100} defaultValue={company.discount_rate} />
        </div>
        <div>
          <Label htmlFor="contact_name">Yetkili Adı Soyadı</Label>
          <Input id="contact_name" name="contact_name" defaultValue={company.contact_name ?? ""} />
        </div>
        <div>
          <Label htmlFor="tax_no">Vergi No</Label>
          <TaxNoInput id="tax_no" name="tax_no" defaultValue={company.tax_no ?? ""} />
        </div>
        <div>
          <Label htmlFor="tax_office">Vergi Dairesi</Label>
          <Input id="tax_office" name="tax_office" defaultValue={company.tax_office ?? ""} />
        </div>
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <PhoneInput id="phone" name="phone" defaultValue={company.phone ?? ""} />
        </div>
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" defaultValue={company.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="address">Adres</Label>
          <Input id="address" name="address" defaultValue={company.address ?? ""} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Kaydedildi.</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
