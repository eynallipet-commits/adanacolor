import Link from "next/link";
import { TrendingUp, Trophy, PieChart } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import type { Company, Order, OrderStatus } from "@/lib/database.types";
import { formatTL } from "@/lib/utils";

const REVENUE_STATUSES: OrderStatus[] = ["paid", "in_production", "shipped", "delivered"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

export default async function RaporlarPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: orders }, { data: companies }] = await Promise.all([
    supabase.from("orders").select("*").returns<Order[]>(),
    supabase.from("companies").select("*").returns<Company[]>(),
  ]);

  const all = orders ?? [];
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));
  const revenueOrders = all.filter((o) => REVENUE_STATUSES.includes(o.status));

  // Son 6 ay ciro
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const revenueByMonth = new Map(months.map((m) => [m, 0]));
  for (const o of revenueOrders) {
    const key = monthKey(new Date(o.created_at));
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + o.total);
    }
  }
  const maxMonthly = Math.max(1, ...Array.from(revenueByMonth.values()));

  // En çok sipariş veren cariler
  const byCompany = new Map<string, { count: number; revenue: number }>();
  for (const o of revenueOrders) {
    const cur = byCompany.get(o.company_id) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += o.total;
    byCompany.set(o.company_id, cur);
  }
  const topCompanies = Array.from(byCompany.entries())
    .map(([companyId, stats]) => ({ companyId, name: companyMap.get(companyId) ?? "—", ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Durum dağılımı
  const statusCounts = new Map<OrderStatus, number>();
  for (const o of all) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  const totalOrders = all.length || 1;

  const totalRevenue = revenueOrders.reduce((s, o) => s + o.total, 0);
  const thisMonthRevenue = revenueByMonth.get(months[months.length - 1]) ?? 0;
  const avgOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Raporlar</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} tone="brand" label="Toplam Ciro" value={formatTL(totalRevenue)} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} tone="emerald" label="Bu Ay" value={formatTL(thisMonthRevenue)} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} tone="indigo" label="Ort. Sipariş Değeri" value={formatTL(avgOrderValue)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            Son 6 Ay Ciro
          </CardTitle>
          <CardDescription>Ödemesi alınmış (Ödendi ve sonrası) siparişler baz alınmıştır.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {months.map((m) => {
            const value = revenueByMonth.get(m) ?? 0;
            const pct = Math.max(2, Math.round((value / maxMonthly) * 100));
            return (
              <div key={m} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-neutral-500 capitalize">{monthLabel(m)}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right font-medium">{formatTL(value)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-brand-600" />
              En Çok Sipariş Veren Cariler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCompanies.length === 0 ? (
              <p className="text-sm text-neutral-500">Henüz ödemesi alınmış sipariş yok.</p>
            ) : (
              <ol className="space-y-3">
                {topCompanies.map((c, i) => (
                  <li key={c.companyId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                        {i + 1}
                      </span>
                      <Link href={`/admin/cariler/${c.companyId}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      <span className="text-neutral-400">· {c.count} sipariş</span>
                    </div>
                    <span className="font-medium">{formatTL(c.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-brand-600" />
              Durum Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Array.from(statusCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className={`w-32 shrink-0 truncate rounded-full px-2 py-0.5 text-center text-xs font-medium ${ORDER_STATUS_COLORS[status]}`}>
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-neutral-400" style={{ width: `${Math.round((count / totalOrders) * 100)}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-neutral-500">{count}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
