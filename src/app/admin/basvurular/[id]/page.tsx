import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, FileText, MapPin, ShieldCheck, FileCheck2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MembershipApplication } from "@/lib/database.types";
import { MEMBERSHIP_DOCUMENTS_BUCKET } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { ApplicationActions } from "../application-actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function BasvuruDetayPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("membership_applications")
    .select("*")
    .eq("id", id)
    .single<MembershipApplication>();

  if (!application) notFound();

  let taxCertUrl: string | null = null;
  if (application.tax_certificate_path) {
    const { data: signed } = await supabase.storage
      .from(MEMBERSHIP_DOCUMENTS_BUCKET)
      .createSignedUrl(application.tax_certificate_path, 3600);
    taxCertUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/basvurular"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Üyelik Başvuruları
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{application.company_name}</h1>
          <Badge className={STATUS_COLORS[application.status]}>{STATUS_LABELS[application.status]}</Badge>
        </div>
        <p className="text-sm text-neutral-400">{formatDate(application.created_at)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Firma Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-neutral-700">
                <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
                {application.contact_name}
              </div>
              <div className="flex items-center gap-2.5 text-neutral-700">
                <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                {application.email}
              </div>
              <div className="flex items-center gap-2.5 text-neutral-700">
                <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                {application.phone}
              </div>
              {application.tax_no && (
                <div className="flex items-center gap-2.5 text-neutral-700">
                  <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                  Vergi No: {application.tax_no}
                </div>
              )}
              {application.address && (
                <div className="flex items-center gap-2.5 text-neutral-700">
                  <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                  {application.address}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-neutral-700">
                <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-400" />
                KVKK Onayı: {application.kvkk_consent ? "Alındı" : "Alınmadı"}
              </div>
              {application.message && (
                <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-neutral-600">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Mesaj</p>
                  &quot;{application.message}&quot;
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vergi Levhası</CardTitle>
            </CardHeader>
            <CardContent>
              {taxCertUrl ? (
                <a
                  href={taxCertUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <FileCheck2 className="h-4 w-4" />
                  Vergi Levhasını Görüntüle
                </a>
              ) : (
                <p className="text-sm text-neutral-500">Bu başvuruya vergi levhası eklenmemiş.</p>
              )}
              <p className="mt-2 text-xs text-neutral-400">
                Bu belge yalnızca yönetici hesaplarına özel imzalı bir bağlantı ile görüntülenir; dışarıdan
                erişilemez.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>İşlem</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationActions applicationId={application.id} email={application.email} status={application.status} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
