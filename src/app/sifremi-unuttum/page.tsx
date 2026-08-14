import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthSplit } from "@/components/layout/auth-split";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function SifremiUnuttumPage() {
  return (
    <AuthSplit>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center lg:hidden">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            Adana <span className="text-brand-600">Color</span>
          </Link>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Şifremi Unuttum</h1>
          <p className="mt-1 text-sm text-neutral-500">E-posta adresinize sıfırlama bağlantısı gönderelim.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Hesap E-postası</CardTitle>
            <CardDescription>Hesabınızla ilişkili e-posta adresini girin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-neutral-500">
          <Link href="/giris" className="font-medium text-brand-700 underline">
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
