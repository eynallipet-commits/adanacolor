"use client";

import { useActionState, useState } from "react";
import { updatePaytrSettingsAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import type { PaymentProviderSettings } from "@/lib/database.types";

const initial: FormState = {};

export function PaytrSettingsForm({
  settings,
  notifyUrl,
}: {
  settings: PaymentProviderSettings;
  notifyUrl: string;
}) {
  const [state, formAction, isPending] = useActionState(updatePaytrSettingsAction, initial);
  const [enabled, setEnabled] = useState(settings.paytr_enabled);
  const [testMode, setTestMode] = useState(settings.paytr_test_mode);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="notify-url">Bildirim URL (PayTR mağaza panelinize girin)</Label>
        <Input id="notify-url" readOnly value={notifyUrl} className="bg-neutral-50 font-mono text-xs" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="paytr_merchant_id">Mağaza No (merchant_id)</Label>
          <Input id="paytr_merchant_id" name="paytr_merchant_id" defaultValue={settings.paytr_merchant_id ?? ""} />
        </div>
        <div>
          <Label htmlFor="paytr_merchant_key">Mağaza Anahtarı (merchant_key)</Label>
          <PasswordInput
            id="paytr_merchant_key"
            name="paytr_merchant_key"
            autoComplete="off"
            defaultValue={settings.paytr_merchant_key ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="paytr_merchant_salt">Mağaza Gizli Anahtarı (merchant_salt)</Label>
          <PasswordInput
            id="paytr_merchant_salt"
            name="paytr_merchant_salt"
            autoComplete="off"
            defaultValue={settings.paytr_merchant_salt ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="paytr_test_mode"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
          />
          Test Modu (gerçek para çekilmez)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <input
            type="checkbox"
            name="paytr_enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          PayTR ile Ödeme Al (aktif)
        </label>
      </div>

      {enabled && !testMode && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Test modu kapalı — kaydettiğinizde sistem gerçek kartlardan gerçek tahsilat yapmaya
          başlar.
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
