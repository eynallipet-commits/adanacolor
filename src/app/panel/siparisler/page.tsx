import Link from "next/link";
import { ClipboardList, PlusCircle } from "lucide-react";
import { requirePhotographer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import type { Order } from "@/lib/database.types";
import { cn, formatDate, formatTL } from "@/lib/utils";

export default async function SiparislerimPage() {
  const { profile } = await requirePhotographer();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Siparişlerim</h1>
      <Card>
        <CardContent className="p-0">
          {!orders || orders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="Henüz siparişiniz yok"
              description="İlk siparişinizi oluşturarak başlayın."
              action={
                <Link href="/panel/siparis-olustur" className={cn(buttonVariants({ size: "sm" }), "mt-1 gap-1.5")}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  Yeni Sipariş Oluştur
                </Link>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Sipariş No</TH>
                  <TH>Tarih</TH>
                  <TH>Durum</TH>
                  <TH>Kargo</TH>
                  <TH className="text-right">Toplam</TH>
                </TR>
              </THead>
              <TBody>
                {orders.map((o) => (
                  <TR key={o.id}>
                    <TD>
                      <Link href={`/panel/siparisler/${o.id}`} className="font-medium hover:underline">
                        {o.order_no}
                      </Link>
                    </TD>
                    <TD className="text-neutral-500">{formatDate(o.created_at)}</TD>
                    <TD>
                      <Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </TD>
                    <TD className="text-neutral-500">{o.tracking_number || "—"}</TD>
                    <TD className="text-right font-medium">{formatTL(o.total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
