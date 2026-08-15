"use client";

import { useRouter } from "next/navigation";
import { deleteCompanyAction } from "../actions";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

export function DeleteCompanyButton({ companyId }: { companyId: string }) {
  const router = useRouter();

  return (
    <ConfirmDelete
      label="Cariyi Sil"
      onConfirm={async () => {
        const res = await deleteCompanyAction(companyId);
        if (!res.error) router.push("/admin/cariler");
        return res;
      }}
    />
  );
}
