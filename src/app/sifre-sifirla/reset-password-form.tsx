"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError("Şifre güncellenemedi, bağlantının süresi dolmuş olabilir.");
      return;
    }
    setDone(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    let destination = "/giris";
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      destination = profile?.role === "admin" ? "/admin" : "/panel";
    }
    setTimeout(() => router.push(destination), 1500);
  }

  if (done) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
        <p className="font-medium text-emerald-800">Şifreniz güncellendi.</p>
        <p className="mt-1 text-sm text-emerald-700">Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Bağlantı doğrulanıyor... Eğer bu ekran değişmiyorsa bağlantının süresi dolmuş olabilir, lütfen
        şifremi unuttum adımını tekrar deneyin.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password">Yeni Şifre</Label>
        <PasswordInput
          id="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="confirm">Yeni Şifre (Tekrar)</Label>
        <PasswordInput
          id="confirm"
          required
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
