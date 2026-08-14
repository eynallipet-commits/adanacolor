import Link from "next/link";
import { FileCheck2, Landmark, Factory, Users, PackageOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import type { Order } from "@/lib/database.types";
import { formatTL } from "@/lib/utils";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ count: pendingApplications }, { data: orders }, { count: companyCount }] = await Promise.all([
    supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).returns<Order[]>(),
    supabase.from("companies").select("*", { count: "exact", head: true }),
  ]);

  const all = orders ?? [];
  const needsAttention = all.filter((o) => o.status === "payment_review");
  const inFlight = all.filter((o) => ["paid", "in_production", "shipped"].includes(o.status));

  const stats = [
    {
      label: "Bekleyen Başvuru",
      value: pendingApplications ?? 0,
      href: "/admin/basvurular",
      icon: <FileCheck2 className="h-5 w-5" />,
      tone: "brand" as const,
    },
    {
      label: "Havale Onay Bekleyen",
      value: needsAttention.length,
      href: "/admin/siparisler?status=payment_review",
      icon: <Landmark className="h-5 w-5" />,
      tone: "amber" as const,
    },
    {
      label: "Üretim/Kargo Süreci",
      value: inFlight.length,
      href: "/admin/siparisler",
      icon: <Factory className="h-5 w-5" />,
      tone: "purple" as const,
    },
    {
      label: "Toplam Cari",
      value: companyCount ?? 0,
      href: "/admin/cariler",
      icon: <Users className="h-5 w-5" />,
      tone: "indigo" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Yönetim Paneli</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <StatCard
              icon={s.icon}
              tone={s.tone}
              label={s.label}
              value={s.value}
              className="transition-colors hover:border-neutral-300"
            />
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <PackageOpen className="h-6 w-6" />
              </span>
              <p className="text-sm text-neutral-500">Henüz sipariş yok.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {all.slice(0, 10).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/admin/siparisler/${o.id}`} className="font-medium hover:underline">
                      {o.order_no}
                    </Link>
                    <div className="mt-1">
                      <Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </div>
                  </div>
                  <p className="font-medium">{formatTL(o.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
