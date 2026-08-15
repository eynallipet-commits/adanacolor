"use client";

import { useActionState } from "react";
import { updateBankTransferSettingsAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/lib/settings";

const initial: FormState = {};

export function BankTransferForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(updateBankTransferSettingsAction, initial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="bank_transfer_bank_name">Banka Adı</Label>
        <Input
          id="bank_transfer_bank_name"
          name="bank_transfer_bank_name"
          placeholder="Örn: Ziraat Bankası"
          defaultValue={settings.bank_transfer_bank_name ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="bank_transfer_account_name">Alıcı Adı</Label>
        <Input
          id="bank_transfer_account_name"
          name="bank_transfer_account_name"
          placeholder="Hesap sahibi / firma unvanı"
          defaultValue={settings.bank_transfer_account_name ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="bank_transfer_iban">IBAN</Label>
        <Input
          id="bank_transfer_iban"
          name="bank_transfer_iban"
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          defaultValue={settings.bank_transfer_iban ?? ""}
        />
      </div>
      <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <p className="text-xs text-neutral-500 sm:col-span-2">
        Havale/EFT ile ödeme yapan fotoğrafçılar bu bilgileri sipariş sayfasında görür.
      </p>
    </form>
  );
}
