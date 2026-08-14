"use client";

import { useActionState } from "react";
import { updateDeliverySettingsAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: FormState = {};

export function DeliverySettingsForm({ minDays, maxDays }: { minDays: number; maxDays: number }) {
  const [state, formAction, isPending] = useActionState(updateDeliverySettingsAction, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="estimated_min_days">En Az (gün)</Label>
        <Input
          id="estimated_min_days"
          name="estimated_min_days"
          type="number"
          min={0}
          defaultValue={minDays}
          className="w-28"
        />
      </div>
      <div>
        <Label htmlFor="estimated_max_days">En Çok (gün)</Label>
        <Input
          id="estimated_max_days"
          name="estimated_max_days"
          type="number"
          min={0}
          defaultValue={maxDays}
          className="w-28"
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
