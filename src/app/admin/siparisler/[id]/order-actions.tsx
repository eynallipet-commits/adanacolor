"use client";

import { useState, useTransition } from "react";
import {
  cancelOrderAction,
  confirmBankTransferAction,
  markDeliveredAction,
  markShippedAction,
  startProductionAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderStatus } from "@/lib/database.types";

export function OrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "delivered" || status === "cancelled") {
    return null;
  }

  return (
    <div className="space-y-3">
      {status === "payment_review" && (
        <Button disabled={isPending} onClick={() => startTransition(() => confirmBankTransferAction(orderId))}>
          Havale Ödemesini Onayla
        </Button>
      )}

      {status === "paid" && (
        <Button disabled={isPending} onClick={() => startTransition(() => startProductionAction(orderId))}>
          Üretime Başla
        </Button>
      )}

      {status === "in_production" && (
        <div className="space-y-2 rounded-md border border-neutral-200 p-3">
          <Label htmlFor="carrier">Kargo Firması</Label>
          <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Örn: Aras Kargo" />
          <Label htmlFor="tracking">Takip Numarası</Label>
          <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await markShippedAction(orderId, carrier, tracking);
                setError(res.error ?? null);
              })
            }
          >
            Kargoya Ver
          </Button>
        </div>
      )}

      {status === "shipped" && (
        <Button disabled={isPending} onClick={() => startTransition(() => markDeliveredAction(orderId))}>
          Teslim Edildi Olarak İşaretle
        </Button>
      )}

      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (confirm("Bu siparişi iptal etmek istediğinize emin misiniz?")) {
            startTransition(() => cancelOrderAction(orderId));
          }
        }}
      >
        Siparişi İptal Et
      </Button>
    </div>
  );
}
