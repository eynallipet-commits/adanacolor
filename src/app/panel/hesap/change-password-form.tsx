"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setPending(true);
    setError(null);
    setDone(false);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError("Şifre güncellenemedi, lütfen tekrar deneyin.");
      return;
    }
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password">Yeni Şifre</Label>
        <PasswordInput
          id="new-password"
          required
          minLength={6}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="new-password-confirm">Yeni Şifre (Tekrar)</Label>
        <PasswordInput
          id="new-password-confirm"
          required
          minLength={6}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-emerald-700">Şifreniz güncellendi.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
