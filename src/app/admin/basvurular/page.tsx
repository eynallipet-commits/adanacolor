import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { MembershipApplication } from "@/lib/database.types";
import { formatDate } from "@/lib/utils";
import { ApplicationActions } from "./application-actions";

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

export default async function BasvurularPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<MembershipApplication[]>();

  const list = applications ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Üyelik Başvuruları</h1>
      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileCheck2 className="h-6 w-6" />}
            title="Henüz başvuru yok"
            description="Yeni üyelik başvuruları burada listelenecek."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/basvurular/${app.id}`} className="font-semibold hover:underline">
                      {app.company_name}
                    </Link>
                    <Badge className={STATUS_COLORS[app.status]}>{STATUS_LABELS[app.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {app.contact_name} · {app.email} · {app.phone}
                  </p>
                  {app.tax_no && <p className="text-sm text-neutral-500">VN: {app.tax_no}</p>}
                  {app.address && <p className="text-sm text-neutral-500">{app.address}</p>}
                  {app.message && <p className="mt-2 text-sm italic text-neutral-500">&quot;{app.message}&quot;</p>}
                  <p className="mt-2 text-xs text-neutral-400">{formatDate(app.created_at)}</p>
                  <Link
                    href={`/admin/basvurular/${app.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                  >
                    Detayları Gör (vergi levhası dahil)
                  </Link>
                </div>
                <div className="shrink-0 sm:w-64">
                  <ApplicationActions applicationId={app.id} email={app.email} status={app.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
