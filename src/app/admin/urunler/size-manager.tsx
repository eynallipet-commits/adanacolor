"use client";

import { useActionState, useState, useTransition } from "react";
import { Ruler } from "lucide-react";
import { addAlbumSizeAction, deleteAlbumSizeAction, updateAlbumSizeAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import type { AlbumSize } from "@/lib/database.types";

const initial: FormState = {};

function SizeChip({ size }: { size: AlbumSize }) {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(size.code);
  const [sortOrder, setSortOrder] = useState(size.sort_order);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isEditing) {
    return (
      <li className="w-full space-y-2 rounded-md border border-neutral-300 p-2.5 sm:w-auto">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <Label htmlFor={`size-code-${size.id}`}>Ebat</Label>
            <Input id={`size-code-${size.id}`} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="w-20">
            <Label htmlFor={`size-order-${size.id}`}>Sıra</Label>
            <Input
              id={`size-order-${size.id}`}
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await updateAlbumSizeAction(size.id, code, sortOrder);
                if (res.error) setError(res.error);
                else setIsEditing(false);
              })
            }
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              setCode(size.code);
              setSortOrder(size.sort_order);
              setError(null);
              setIsEditing(false);
            }}
          >
            Vazgeç
          </Button>
          <ConfirmDelete onConfirm={() => deleteAlbumSizeAction(size.id)} />
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        title="Düzenlemek veya silmek için tıklayın"
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
      >
        {size.code}
      </button>
    </li>
  );
}

export function SizeManager({ sizes }: { sizes: AlbumSize[] }) {
  const [state, formAction, isPending] = useActionState(addAlbumSizeAction, initial);

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
          <Ruler className="h-3.5 w-3.5 text-brand-600" />
          Ebatları Yönet
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Ebata tıklayarak adını değiştirebilir veya silebilirsiniz. Silinen ebat fiyat matrisinden ve kapak
          modellerinden de kaldırılır; geçmiş siparişlerde kullanılan ebatlar silinemez.
        </p>
      </div>

      <ul className="flex flex-wrap items-start gap-2">
        {sizes.map((s) => (
          <SizeChip key={s.id} size={s} />
        ))}
      </ul>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="w-32">
          <Label htmlFor="new-size-code">Yeni Ebat</Label>
          <Input id="new-size-code" name="code" placeholder="Örn: 30x90" required />
        </div>
        <div className="w-20">
          <Label htmlFor="new-size-order">Sıra</Label>
          <Input id="new-size-order" name="sort_order" type="number" defaultValue={(sizes.length + 1) * 10} />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Ebat Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
