"use client";

import { useActionState } from "react";
import { addAdminUserAction, removeAdminUserAction, type FormState } from "./actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import type { Profile } from "@/lib/database.types";

const initial: FormState = {};

export function AdminUserManager({
  rows,
  currentAdminId,
}: {
  rows: { profile: Profile; email: string }[];
  currentAdminId: string;
}) {
  const [state, formAction, isPending] = useActionState(addAdminUserAction, initial);

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {rows.map(({ profile, email }) => (
            <li key={profile.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={profile.full_name} className="h-8 w-8 text-xs" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-neutral-800">
                    {profile.full_name || "—"}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">{email}</span>
                </span>
              </span>
              {profile.id === currentAdminId ? (
                <span className="shrink-0 text-xs text-neutral-400">Siz</span>
              ) : (
                <ConfirmDelete onConfirm={() => removeAdminUserAction(profile.id)} />
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="grid gap-3 rounded-md border border-neutral-200 p-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="admin-full-name">Ad Soyad</Label>
          <Input id="admin-full-name" name="full_name" required />
        </div>
        <div>
          <Label htmlFor="admin-email">E-posta</Label>
          <Input id="admin-email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="admin-password">Şifre</Label>
          <Input id="admin-password" name="password" type="password" minLength={6} required />
        </div>
        <Button type="submit" size="sm" className="sm:col-span-3 sm:w-fit" disabled={isPending}>
          {isPending ? "Oluşturuluyor..." : "Yönetici Ekle"}
        </Button>
        {state.error && <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>}
      </form>
    </div>
  );
}
