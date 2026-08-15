"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { requestPhotoChangeAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { PhotoChangeRequest } from "@/lib/database.types";

export function PhotoChangeRequestButton({
  orderId,
  orderItemId,
  pendingRequest,
}: {
  orderId: string;
  orderItemId: string;
  pendingRequest: PhotoChangeRequest | null;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (pendingRequest || done) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Fotoğraf değişikliği talebiniz {pendingRequest ? formatDate(pendingRequest.created_at) : ""} alındı,
        yeni fotoğrafı bu bölümden yükleyebilirsiniz.
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Fotoğraf Değişikliği Talep Et
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 p-3">
      <Textarea
        placeholder="Hangi fotoğrafı neden değiştirmek istediğinizi kısaca yazın..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await requestPhotoChangeAction(orderId, orderItemId, note);
              if (res.error) setError(res.error);
              else setDone(true);
            })
          }
        >
          {isPending ? "Gönderiliyor..." : "Talebi Gönder"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
