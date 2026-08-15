"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSettingsForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailDone, setEmailDone] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passPending, setPassPending] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passDone, setPassDone] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || email === currentEmail) return;
    setEmailPending(true);
    setEmailError(null);
    setEmailDone(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email });
    setEmailPending(false);
    if (error) {
      setEmailError("E-posta güncellenemedi, lütfen tekrar deneyin.");
      return;
    }
    setEmailDone(true);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setPassError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setPassError("Şifreler eşleşmiyor.");
      return;
    }
    setPassPending(true);
    setPassError(null);
    setPassDone(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPassPending(false);
    if (error) {
      setPassError("Şifre güncellenemedi, lütfen tekrar deneyin.");
      return;
    }
    setPassword("");
    setConfirm("");
    setPassDone(true);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <div>
          <Label htmlFor="account-email">E-posta</Label>
          <Input id="account-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {emailError && <p className="text-sm text-red-600">{emailError}</p>}
        {emailDone && (
          <p className="text-sm text-emerald-700">
            Onay bağlantısı yeni e-posta adresinize gönderildi, onaylayana kadar mevcut e-postanız
            geçerli kalır.
          </p>
        )}
        <Button type="submit" size="sm" disabled={emailPending || email === currentEmail}>
          {emailPending ? "Kaydediliyor..." : "E-postayı Güncelle"}
        </Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-3 border-t border-neutral-200 pt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="account-password">Yeni Şifre</Label>
            <Input
              id="account-password"
              type="password"
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="account-password-confirm">Yeni Şifre (Tekrar)</Label>
            <Input
              id="account-password-confirm"
              type="password"
              minLength={6}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        {passError && <p className="text-sm text-red-600">{passError}</p>}
        {passDone && <p className="text-sm text-emerald-700">Şifreniz güncellendi.</p>}
        <Button type="submit" size="sm" disabled={passPending}>
          {passPending ? "Kaydediliyor..." : "Şifreyi Güncelle"}
        </Button>
      </form>
    </div>
  );
}
