import Link from "next/link";
import { CreditCard, Landmark, Factory, Truck, PlusCircle, PackageOpen, ArrowRight } from "lucide-react";
import { requirePhotographer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/database.types";
import { cn, formatTL } from "@/lib/utils";

const highlightStatuses: { status: OrderStatus; icon: React.ReactNode; tone: "amber" | "indigo" | "purple" }[] = [
  { status: "pending_payment", icon: <CreditCard className="h-5 w-5" />, tone: "amber" },
  { status: "payment_review", icon: <Landmark className="h-5 w-5" />, tone: "amber" },
  { status: "in_production", icon: <Factory className="h-5 w-5" />, tone: "purple" },
  { status: "shipped", icon: <Truck className="h-5 w-5" />, tone: "indigo" },
];

export default async function PanelDashboard() {
  const { profile, company } = await requirePhotographer();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  const all = orders ?? [];
  const active = all.filter((o) => !["delivered", "cancelled", "draft"].includes(o.status));
  const counts = all.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Merhaba, {profile.full_name || "Fotoğrafçı"}
          </h1>
          <p className="text-neutral-500">
            {company?.name} · İskonto oranınız:{" "}
            <span className="font-medium text-brand-700">%{company?.discount_rate}</span>
          </p>
        </div>
        <Link href="/panel/siparis-olustur" className={cn(buttonVariants(), "gap-2")}>
          <PlusCircle className="h-4 w-4" />
          Yeni Sipariş
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {highlightStatuses.map((s) => (
          <StatCard
            key={s.status}
            icon={s.icon}
            tone={s.tone}
            label={ORDER_STATUS_LABELS[s.status]}
            value={counts[s.status] ?? 0}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <PackageOpen className="h-6 w-6" />
              </span>
              <p className="text-sm text-neutral-500">Henüz aktif siparişiniz yok.</p>
              <Link href="/panel/siparis-olustur" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
                İlk siparişini oluştur
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {active.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/panel/siparisler/${o.id}`} className="font-medium hover:underline">
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
