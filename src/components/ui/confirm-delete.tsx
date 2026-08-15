"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./button";

/**
 * İki adımlı silme: ilk tıklama onay ister, ikinci tıklama siler.
 * Sunucu bir hata döndürürse (örn. kayıt siparişlerde kullanılıyorsa) mesaj gösterilir.
 */
export function ConfirmDelete({
  onConfirm,
  label = "Sil",
  size = "sm",
}: {
  onConfirm: () => Promise<{ error?: string } | void>;
  label?: string;
  size?: "sm" | "default";
}) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (error) {
    return (
      <span className="flex flex-col items-end gap-1">
        <span className="text-right text-[11px] text-red-600">{error}</span>
        <Button size="sm" variant="ghost" onClick={() => { setError(null); setAsking(false); }}>
          Tamam
        </Button>
      </span>
    );
  }

  if (asking) {
    return (
      <span className="flex items-center gap-1">
        <span className="text-[11px] text-neutral-500">Emin misiniz?</span>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await onConfirm();
              if (res && res.error) {
                setError(res.error);
              } else {
                setAsking(false);
              }
            })
          }
        >
          {isPending ? "Siliniyor..." : "Evet, sil"}
        </Button>
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setAsking(false)}>
          Vazgeç
        </Button>
      </span>
    );
  }

  return (
    <Button size={size} variant="ghost" className="gap-1 text-red-600 hover:bg-red-50" onClick={() => setAsking(true)}>
      <Trash2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
