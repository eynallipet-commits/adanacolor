import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthSplit } from "@/components/layout/auth-split";
import { LoginForm } from "./login-form";

export default function GirisPage() {
  return (
    <AuthSplit>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center lg:hidden">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            Adana <span className="text-brand-600">Color</span>
          </Link>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Giriş Yap</h1>
          <p className="mt-1 text-sm text-neutral-500">B2B fotoğrafçı paneline hoş geldiniz.</p>
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
