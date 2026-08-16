"use client";

import { deleteOrderPhotosAction } from "./actions";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

export function DeleteOrderPhotosButton({ orderId }: { orderId: string }) {
  return <ConfirmDelete label="Fotoğrafları Sil" onConfirm={() => deleteOrderPhotosAction(orderId)} />;
}
