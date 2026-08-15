"use client";

import { useActionState, useState } from "react";
import { createCompanyAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: FormState = {};

export function NewCompanyForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCompanyAction, initialState);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        + Yeni Cari Ekle
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni Cari</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Firma Adı *</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="discount_rate">İskonto Oranı (%)</Label>
              <Input id="discount_rate" name="discount_rate" type="number" min={0} max={100} defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="tax_no">Vergi No</Label>
              <Input id="tax_no" name="tax_no" />
            </div>
            <div>
              <Label htmlFor="tax_office">Vergi Dairesi</Label>
              <Input id="tax_office" name="tax_office" />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Input id="address" name="address" />
            </div>
            <div>
              <Label htmlFor="opening_balance">Açılış Bakiyesi (TL, varsa)</Label>
              <Input id="opening_balance" name="opening_balance" type="number" step="0.01" defaultValue={0} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" name="balance_block_enabled" />
            Bakiye sıfır olmadan yeni sipariş verilemesin
          </label>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
