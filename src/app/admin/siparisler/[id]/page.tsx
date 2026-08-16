import { notFound } from "next/navigation";
import Link from "next/link";
import { Settings2, Images, ShoppingBag, History, Wallet, Landmark, Truck, Printer } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OrderPhotos } from "@/components/order-photos";
import { ColorSwatch } from "@/components/color-swatch";
import { OrderStatusStepper } from "@/components/order-status-stepper";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { cn, formatDate, formatTL } from "@/lib/utils";
import type { Company } from "@/lib/database.types";
import { getRequiredPhotoCount } from "@/lib/storage";
import { OrderActions } from "./order-actions";
import { ResolvePhotoRequest } from "./resolve-photo-request";
import { DeleteOrderPhotosButton } from "@/app/admin/depolama/delete-order-photos-button";

export default async function AdminSiparisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const detail = await getOrderDetail(id);
  if (!detail) notFound();

  const { order, items, history, payments, photoChangeRequests } = detail;
  const pendingRequestByItem = new Map(
    photoChangeRequests.filter((r) => r.status === "pending").map((r) => [r.order_item_id, r])
  );
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", order.company_id)
    .single<Company>();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.order_no}</h1>
          <p className="text-neutral-500">
            <Link href={`/admin/cariler/${order.company_id}`} className="hover:underline">
              {company?.name}
            </Link>{" "}
            · {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          <Link
            href={`/siparis-belgesi/${order.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Printer className="h-3.5 w-3.5" />
            Belge
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-brand-600" />
            İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderActions orderId={order.id} status={order.status} />
          {order.shipping_carrier && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-neutral-600">
              <Truck className="h-4 w-4 text-neutral-400" />
              Kargo: {order.shipping_carrier} — Takip No: {order.tracking_number}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-4 w-4 text-brand-600" />
              Fotoğraflar
            </CardTitle>
            <CardDescription>Fotoğrafçının yüklediği dosyalar — üretim için buradan indirin.</CardDescription>
          </div>
          <DeleteOrderPhotosButton orderId={order.id} />
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item) => {
            const pendingRequest = pendingRequestByItem.get(item.id) ?? null;
            return (
              <div key={item.id} className="border-t border-neutral-100 pt-4 first:border-0 first:pt-0">
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                  <span>
                    {item.item_type === "album" ? item.sizeLabel : item.extraLabel}
                    {item.item_type === "album" && item.packageLabel ? ` · ${item.packageLabel}` : ""}
                    {item.modelLabel ? ` · ${item.modelLabel}` : ""}
                  </span>
                  {item.colorLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                      {item.color && <ColorSwatch color={item.color} className="h-4 w-5" />}
                      Renk: {item.colorLabel}
                    </span>
                  )}
                </div>
                {pendingRequest && (
                  <div className="mb-2">
                    <ResolvePhotoRequest orderId={order.id} request={pendingRequest} />
                  </div>
                )}
                <OrderPhotos
                  companyId={order.company_id}
                  itemId={item.id}
                  requiredCount={getRequiredPhotoCount(item)}
                  canManage={false}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-brand-600" />
            Ürünler
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Ürün</TH>
                <TH>Detay</TH>
                <TH className="text-right">Adet</TH>
                <TH className="text-right">Birim</TH>
                <TH className="text-right">Tutar</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium">
                    {item.item_type === "album" ? item.sizeLabel : item.extraLabel}
                  </TD>
                  <TD className="text-neutral-500">
                    {item.item_type === "album" ? (
                      <>
                        {item.packageLabel} · {item.page_count} sayfa
                        {item.modelLabel ? ` · ${item.modelLabel}` : ""}
                        {item.cover_names_text ? ` · "${item.cover_names_text}"` : ""}
                        {item.cover_date_text ? ` (${item.cover_date_text})` : ""}
                        {item.colorLabel && (
                          <span className="mt-1 flex items-center gap-1.5 font-medium text-neutral-800">
                            {item.color && <ColorSwatch color={item.color} className="h-5 w-6" />}
                            Renk: {item.colorLabel}
                          </span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD className="text-right">{item.quantity}</TD>
                  <TD className="text-right">{formatTL(item.unit_price)}</TD>
                  <TD className="text-right font-medium">{formatTL(item.line_total)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="space-y-1 border-t border-neutral-200 p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Ara Toplam</span>
              <span>{formatTL(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">İskonto (%{order.discount_rate})</span>
              <span>-{formatTL(order.discount_amount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Toplam</span>
              <span>{formatTL(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-brand-600" />
              Durum Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusStepper status={order.status} paymentMethod={order.payment_method} history={history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-600" />
              Ödeme
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-neutral-500">Ödeme kaydı yok.</p>
            ) : (
              <ul className="space-y-3">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                      {p.method === "credit_card" ? (
                        <Wallet className="h-4 w-4" />
                      ) : (
                        <Landmark className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {p.method === "credit_card" ? "Kredi Kartı" : "Havale/EFT"}
                        </span>
                        <span>{formatTL(p.amount)}</span>
                      </div>
                      <Badge
                        className={cn(
                          "mt-1",
                          p.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        )}
                      >
                        {p.status === "confirmed" ? "Onaylandı" : p.status === "pending" ? "Bekliyor" : "Başarısız"}
                      </Badge>
                      {p.mock_reference && <p className="mt-1 text-xs text-neutral-400">{p.mock_reference}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
