"use client";

import { useState, useTransition } from "react";
import { approveApplicationAction, rejectApplicationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ApplicationActions({
  applicationId,
  email,
  status,
}: {
  applicationId: string;
  email: string;
  status: string;
}) {
  const [discountRate, setDiscountRate] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [showApprove, setShowApprove] = useState(false);

  if (result) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <p className="font-medium text-emerald-800">Üyelik oluşturuldu.</p>
        <p className="mt-1 text-emerald-700">
          E-posta: <span className="font-mono">{result.email}</span>
          <br />
          Geçici şifre: <span className="font-mono">{result.tempPassword}</span>
        </p>
        <p className="mt-1 text-xs text-emerald-700">Bu bilgiyi fotoğrafçıya iletin, bir daha gösterilmeyecek.</p>
      </div>
    );
  }

  if (showApprove) {
    return (
      <div className="space-y-2 rounded-md border border-neutral-200 p-3">
        <Label htmlFor={`rate-${applicationId}`}>İskonto Oranı (%)</Label>
        <Input
          id={`rate-${applicationId}`}
          type="number"
          min={0}
          max={100}
          value={discountRate}
          onChange={(e) => setDiscountRate(Number(e.target.value))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await approveApplicationAction(applicationId, discountRate);
                if (res.error) setError(res.error);
                else if (res.tempPassword && res.email) setResult({ tempPassword: res.tempPassword, email: res.email });
              })
            }
          >
            {isPending ? "Oluşturuluyor..." : "Onayla ve Hesap Oluştur"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowApprove(false)}>
            Vazgeç
          </Button>
        </div>
      </div>
    );
  }

  if (status !== "pending") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => setShowApprove(true)}>
        Onayla
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => startTransition(() => rejectApplicationAction(applicationId))}
      >
        Reddet
      </Button>
      <span className="sr-only">{email}</span>
    </div>
  );
}
