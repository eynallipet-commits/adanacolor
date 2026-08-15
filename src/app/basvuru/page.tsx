import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthSplit } from "@/components/layout/auth-split";
import { Logo } from "@/components/layout/logo";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: "Üyelik Başvurusu",
  description: "Fotoğrafçılar için atölye ortaklığı başvurusu — hesabınızı oluşturun, ekibimiz kısa sürede değerlendirsin.",
};

export default function BasvuruPage() {
  return (
    <AuthSplit>
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center lg:hidden">
          <Link href="/" className="font-display flex items-center justify-center gap-2 text-xl font-bold tracking-tight">
            <Logo height={28} />
          </Link>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Üyelik Başvurusu</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Atölyemizle çalışmaya başlamak için hesabınızı oluşturun, ekibimiz kısa sürede değerlendirsin.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Firma Bilgileri</CardTitle>
            <CardDescription>Alanları eksiksiz doldurun, size en kısa sürede dönüş yapalım.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplyForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-neutral-500">
          Zaten üye misiniz?{" "}
          <Link href="/giris" className="font-medium text-brand-700 underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
