import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthSplit } from "@/components/layout/auth-split";
import { ResetPasswordForm } from "./reset-password-form";

export default function SifreSifirlaPage() {
  return (
    <AuthSplit>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center lg:hidden">
          <Link href="/" className="font-display text-xl font-bold tracking-tight">
            Adana <span className="text-brand-600">Color</span>
          </Link>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Şifre Sıfırlama</h1>
          <p className="mt-1 text-sm text-neutral-500">Hesabınız için yeni bir şifre belirleyin.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Yeni Şifre</CardTitle>
            <CardDescription>Güvenli bir şifre seçin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </AuthSplit>
  );
}
