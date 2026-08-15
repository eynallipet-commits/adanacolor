import { notFound } from "next/navigation";
import Link from "next/link";
import { Images, ShoppingBag, History, Wallet, Truck, Landmark, PackageCheck, Printer, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requirePhotographer } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/order-status";
import { cn, formatDate, formatTL } from "@/lib/utils";
import { getRequiredPhotoCount, canManagePhotosDirectly, canRequestPhotoChange } from "@/lib/storage";
import { getAppSettings, formatEstimatedDeliveryRange } from "@/lib/settings";
import { OrderPhotos } from "@/components/order-photos";
import { OrderStatusStepper } from "@/components/order-status-stepper";
import { PhotoChangeRequestButton } from "./photo-change-request";

const PAID_STATUSES = ["paid", "in_production", "shipped", "delivered"];

export default async function SiparisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requirePhotographer();
  const detail = await getOrderDetail(id);

  if (!detail || detail.order.company_id !== profile.company_id) {
    notFound();
  }

  const { order, items, history, payments, photoChangeRequests } = detail;
  const pendingRequestByItem = new Map(
    photoChangeRequests.filter((r) => r.status === "pending").map((r) => [r.order_item_id, r])
  );
  const appSettings = await getAppSettings();
  const showDeliveryEstimate = PAID_STATUSES.includes(order.status);
  const estimateRange = showDeliveryEstimate
    ? formatEstimatedDeliveryRange(
        payments.find((p) => p.status === "confirmed")?.confirmed_at ?? order.created_at,
        appSettings
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.order_no}</h1>
          <p className="text-neutral-500">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ORDER_STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          <Link href={`/siparis-belgesi/${order.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Printer className="h-3.5 w-3.5" />
            Belge
          </Link>
          <Link
            href={`/panel/siparis-olustur?tekrar=${order.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tekrar Sipariş Ver
          </Link>
        </div>
      </div>

      {estimateRange && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-emerald-800">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <PackageCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-medium">Ödemeniz alındı, siparişiniz alınmıştır.</p>
              <p className="mt-0.5">Tahmini kargo teslim tarihi: {estimateRange} arası.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {order.status === "payment_review" && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5 text-sm text-amber-800">
            <p className="font-medium">Havale ödemenizi bekliyoruz.</p>
            <p className="mt-1">
              {appSettings.bank_transfer_bank_name || "Banka bilgisi girilmemiş"} —{" "}
              {appSettings.bank_transfer_account_name || "—"}
              <br />
              IBAN: {appSettings.bank_transfer_iban || "IBAN girilmemiş"}
              <br />
              Açıklama: {order.order_no}
            </p>
          </CardContent>
        </Card>
      )}

      {order.status === "pending_payment" && order.payment_method === "credit_card" && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-amber-800">
            <p className="font-medium">Ödemeniz henüz tamamlanmadı.</p>
            <Link href={`/panel/siparisler/${order.id}/ode`} className={cn(buttonVariants({ size: "sm" }))}>
              Ödeme Sayfasına Dön
            </Link>
          </CardContent>
        </Card>
      )}

      {order.status === "shipped" && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-indigo-800">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Truck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-medium">Siparişiniz kargoya verildi.</p>
              <p className="mt-0.5">
                {order.shipping_carrier} — Takip No: {order.tracking_number}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(order.shipping_carrier || order.tracking_number) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-600" />
              Kargo Takip
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-neutral-500">Kargo Firması</p>
              <p className="font-medium">{order.shipping_carrier || "—"}</p>
            </div>
            <div>
              <p className="text-neutral-500">Takip Numarası</p>
              <p className="font-medium">{order.tracking_number || "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-4 w-4 text-brand-600" />
            Fotoğraflar
          </CardTitle>
          <CardDescription>
            Aldığınız ürüne göre gereken fotoğraf adedi kalem başına belirtilmiştir, ona göre yükleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item) => {
            const pendingRequest = pendingRequestByItem.get(item.id) ?? null;
            const canManage = canManagePhotosDirectly(order.status) || !!pendingRequest;
            return (
              <div key={item.id} className="border-t border-neutral-100 pt-4 first:border-0 first:pt-0">
                <p className="mb-2 text-sm font-medium">
                  {item.item_type === "album" ? item.sizeLabel : item.extraLabel}
                  {item.item_type === "album" && item.packageLabel ? ` · ${item.packageLabel}` : ""}
                </p>
                <OrderPhotos
                  companyId={order.company_id}
                  itemId={item.id}
                  requiredCount={getRequiredPhotoCount(item)}
                  canManage={canManage}
                />
                {canRequestPhotoChange(order.status) && (
                  <div className="mt-3">
                    <PhotoChangeRequestButton
                      orderId={order.id}
                      orderItemId={item.id}
                      pendingRequest={pendingRequest}
                    />
                  </div>
                )}
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
                        {item.colorLabel ? ` · Renk ${item.colorLabel}` : ""}
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
