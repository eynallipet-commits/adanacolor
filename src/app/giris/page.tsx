import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthSplit } from "@/components/layout/auth-split";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: false },
};

export default function GirisPage() {
  return (
    <AuthSplit>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center lg:hidden">
          <Link href="/" className="font-display flex items-center justify-center gap-2 text-xl font-bold tracking-tight">
            <Logo height={28} />
          </Link>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Giriş Yap</h1>
          <p className="mt-1 text-sm text-neutral-500">Panelinize hoş geldiniz.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Hesap Bilgileri</CardTitle>
            <CardDescription>E-posta ve şifrenizle giriş yapın.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-neutral-500">
          Henüz üye değil misiniz?{" "}
          <Link href="/basvuru" className="font-medium text-brand-700 underline">
            Üyelik başvurusu yapın
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
