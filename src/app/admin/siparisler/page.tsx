import Link from "next/link";
import { ClipboardList, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { TRLink } from "@/components/ui/table-row-link";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import type { Company, Order, OrderStatus } from "@/lib/database.types";
import { cn, formatDate, formatTL } from "@/lib/utils";

export default async function AdminSiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const { status, q, from, to } = await searchParams;
  const supabase = await createClient();

  let matchingCompanyIds: string[] | null = null;
  if (q) {
    const { data: matchedCompanies } = await supabase.from("companies").select("id").ilike("name", `%${q}%`);
    matchingCompanyIds = (matchedCompanies ?? []).map((c) => c.id);
  }

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status as OrderStatus);
  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);
  if (q) {
    const orFilters = [`order_no.ilike.%${q}%`];
    if (matchingCompanyIds && matchingCompanyIds.length > 0) {
      orFilters.push(`company_id.in.(${matchingCompanyIds.join(",")})`);
    }
    query = query.or(orFilters.join(","));
  }
  const { data: orders } = await query.returns<Order[]>();

  const companyIds = Array.from(new Set((orders ?? []).map((o) => o.company_id)));
  const { data: companies } = await supabase.from("companies").select("*").in("id", companyIds).returns<Company[]>();
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));

  const statuses: OrderStatus[] = [
    "pending_payment",
    "payment_review",
    "paid",
    "in_production",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Siparişler</h1>

      <form className="flex flex-wrap items-end gap-3" action="/admin/siparisler" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1.5 block text-sm font-medium text-neutral-800" htmlFor="q">
            Ara (sipariş no / cari)
          </label>
          <Input id="q" name="q" defaultValue={q ?? ""} placeholder="AC2026... veya firma adı" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800" htmlFor="from">
            Başlangıç
          </label>
          <Input id="from" name="from" type="date" defaultValue={from ?? ""} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800" htmlFor="to">
            Bitiş
          </label>
          <Input id="to" name="to" type="date" defaultValue={to ?? ""} />
        </div>
        <Button type="submit" size="default" className="gap-1.5">
          <Search className="h-4 w-4" />
          Filtrele
        </Button>
        {(q || from || to) && (
          <Link href={status ? `/admin/siparisler?status=${status}` : "/admin/siparisler"} className="text-sm text-neutral-500 hover:underline">
            Temizle
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/siparisler"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !status ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          Tümü
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/siparisler?status=${s}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              status === s ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {!orders || orders.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="Sipariş bulunamadı" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Sipariş No</TH>
                  <TH>Cari</TH>
                  <TH>Tarih</TH>
                  <TH>Durum</TH>
                  <TH className="text-right">Toplam</TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((o) => (
                  <TRLink key={o.id} href={`/admin/siparisler/${o.id}`}>
                    <TD>
                      <Link href={`/admin/siparisler/${o.id}`} className="font-medium hover:underline">
                        {o.order_no}
                      </Link>
                    </TD>
                    <TD>{companyMap.get(o.company_id) ?? "—"}</TD>
                    <TD className="text-neutral-500">{formatDate(o.created_at)}</TD>
                    <TD>
                      <Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </TD>
                    <TD className="text-right font-medium">{formatTL(o.total)}</TD>
                  </TRLink>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
