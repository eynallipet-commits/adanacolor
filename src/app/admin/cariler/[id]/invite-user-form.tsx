"use client";

import { useState, useTransition } from "react";
import { inviteUserAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteUserForm({ companyId }: { companyId: string }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (tempPassword) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <p className="font-medium text-emerald-800">Kullanıcı oluşturuldu.</p>
        <p className="mt-1 text-emerald-700">
          E-posta: <span className="font-mono">{email}</span>
          <br />
          Geçici şifre: <span className="font-mono">{tempPassword}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="invite-name">Ad Soyad</Label>
        <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="invite-email">E-posta</Label>
        <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await inviteUserAction(companyId, email, fullName);
            if (res.error) setError(res.error);
            else if (res.tempPassword) setTempPassword(res.tempPassword);
          })
        }
      >
        {isPending ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
      </Button>
    </div>
  );
}
