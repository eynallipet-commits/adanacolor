"use client";

import { useActionState } from "react";
import { updateInvoiceSettingsAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/lib/settings";

const initial: FormState = {};

export function InvoiceSettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(updateInvoiceSettingsAction, initial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="invoice_seller_tax_office">Vergi Dairesi</Label>
        <Input
          id="invoice_seller_tax_office"
          name="invoice_seller_tax_office"
          defaultValue={settings.invoice_seller_tax_office ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="invoice_seller_tax_no">Vergi No</Label>
        <Input
          id="invoice_seller_tax_no"
          name="invoice_seller_tax_no"
          defaultValue={settings.invoice_seller_tax_no ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="invoice_seller_iban">IBAN</Label>
        <Input id="invoice_seller_iban" name="invoice_seller_iban" defaultValue={settings.invoice_seller_iban ?? ""} />
      </div>
      <div>
        <Label htmlFor="invoice_kdv_rate">KDV Oranı (%)</Label>
        <Input
          id="invoice_kdv_rate"
          name="invoice_kdv_rate"
          type="number"
          min={0}
          max={100}
          step="0.01"
          defaultValue={settings.invoice_kdv_rate}
        />
      </div>
      <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
    </form>
  );
}
