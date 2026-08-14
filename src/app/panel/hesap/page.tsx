import { Building2, PercentCircle } from "lucide-react";
import { requirePhotographer } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function HesabimPage() {
  const { profile, company, authUser } = await requirePhotographer();

  const rows: [string, string][] = [
    ["Vergi No", company?.tax_no ?? "—"],
    ["Adres", company?.address ?? "—"],
    ["Telefon", company?.phone ?? "—"],
    ["Yetkili", profile.full_name ?? "—"],
    ["E-posta", authUser.email ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Hesabım</h1>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Avatar name={company?.name} className="h-14 w-14 text-lg" />
          <div className="flex-1">
            <p className="text-lg font-semibold text-neutral-900">{company?.name}</p>
            <p className="text-sm text-neutral-500">{profile.full_name}</p>
          </div>
          <Badge className="gap-1 bg-brand-50 text-brand-700">
            <PercentCircle className="h-3.5 w-3.5" />
            İskonto %{company?.discount_rate ?? 0}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-600" />
            Firma Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-neutral-100">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between py-2.5 text-sm">
                <dt className="text-neutral-500">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <p className="text-sm text-neutral-500">
        Bilgilerinizde bir değişiklik yapmak isterseniz atölyemizle iletişime geçin.
      </p>
    </div>
  );
}
