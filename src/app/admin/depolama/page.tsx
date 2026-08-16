import Link from "next/link";
import { HardDrive, Images } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { formatBytes } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/lib/database.types";
import { DeleteOrderPhotosButton } from "./delete-order-photos-button";

interface StorageRow {
  order_id: string;
  order_no: string;
  status: OrderStatus;
  created_at: string;
  total_bytes: number;
  file_count: number;
}

// Supabase ücretsiz plan depolama sınırı — yalnızca bilgilendirme amaçlı, plan yükseltilirse
// bu sayı da güncellenmeli.
const FREE_TIER_LIMIT_BYTES = 1 * 1024 * 1024 * 1024;

export default async function DepolamaPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase.rpc("order_photo_storage_by_order");
  const rows = (data ?? []) as StorageRow[];
  const totalBytes = rows.reduce((s, r) => s + r.total_bytes, 0);
  const totalFiles = rows.reduce((s, r) => s + r.file_count, 0);
  const usagePct = Math.min(100, Math.round((totalBytes / FREE_TIER_LIMIT_BYTES) * 100));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Depolama</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-brand-600" />
            Sipariş Fotoğrafları Kullanımı
          </CardTitle>
          <CardDescription>
            Yalnızca fotoğrafçıların sipariş kalemlerine yüklediği fotoğrafları kapsar (vergi
            levhası, kapak modeli görselleri vb. dahil değildir).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-neutral-900">{formatBytes(totalBytes)}</p>
            <p className="text-sm text-neutral-500">{totalFiles} dosya · {rows.length} sipariş</p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full ${usagePct >= 90 ? "bg-red-500" : usagePct >= 70 ? "bg-amber-500" : "bg-brand-600"}`}
              style={{ width: `${Math.max(2, usagePct)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">
            Supabase ücretsiz plan sınırı olan 1 GB&apos;a göre yaklaşık %{usagePct} kullanım (diğer
            dosyalar — vergi levhaları, ürün görselleri — bu orana dahil değil, gerçek toplam
            kullanım biraz daha yüksek olabilir).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-4 w-4 text-brand-600" />
            Siparişe Göre Fotoğraflar
          </CardTitle>
          <CardDescription>
            Artık ihtiyaç kalmayan (örn. teslim edilmiş, üzerinden uzun süre geçmiş) siparişlerin
            fotoğraflarını buradan silebilirsiniz. Silme işlemi geri alınamaz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={<Images className="h-6 w-6" />} title="Henüz fotoğraf yüklenmemiş" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Sipariş</TH>
                  <TH>Durum</TH>
                  <TH>Tarih</TH>
                  <TH className="text-right">Dosya</TH>
                  <TH className="text-right">Boyut</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((r) => (
                  <TR key={r.order_id}>
                    <TD>
                      <Link href={`/admin/siparisler/${r.order_id}`} className="font-medium hover:underline">
                        {r.order_no}
                      </Link>
                    </TD>
                    <TD>
                      <Badge className={ORDER_STATUS_COLORS[r.status]}>{ORDER_STATUS_LABELS[r.status]}</Badge>
                    </TD>
                    <TD className="text-neutral-500">{formatDate(r.created_at)}</TD>
                    <TD className="text-right">{r.file_count}</TD>
                    <TD className="text-right font-medium">{formatBytes(r.total_bytes)}</TD>
                    <TD className="text-right">
                      <DeleteOrderPhotosButton orderId={r.order_id} />
                    </TD>
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
