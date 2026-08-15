"use client";

import { useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { resolvePhotoChangeRequestAction } from "../actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { PhotoChangeRequest } from "@/lib/database.types";

export function ResolvePhotoRequest({ orderId, request }: { orderId: string; request: PhotoChangeRequest }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <span className="flex items-start gap-1.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Fotoğraf değişikliği talebi ({formatDate(request.created_at)}): {request.note}
        </span>
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => resolvePhotoChangeRequestAction(request.id, orderId))}
      >
        {isPending ? "Kapatılıyor..." : "Talebi Kapat"}
      </Button>
    </div>
  );
}
