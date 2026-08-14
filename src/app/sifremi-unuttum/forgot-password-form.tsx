"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });

    setPending(false);
    if (resetError) {
      setError("Bir sorun oluştu, lütfen tekrar deneyin.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
        <p className="font-medium text-emerald-800">E-posta gönderildi.</p>
        <p className="mt-1 text-sm text-emerald-700">
          {email} adresine bir şifre sıfırlama bağlantısı gönderdik. Gelen kutunuzu (ve spam klasörünü)
          kontrol edin.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="ornek@firma.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
      </Button>
    </form>
  );
}
