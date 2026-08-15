import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { ShieldCheck } from "lucide-react";
import { requirePhotographer } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders";
import { getPaytrSettings, getPaytrToken, toMerchantOid, type PaytrBasketItem } from "@/lib/payments/paytr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PaytrIframe } from "./paytr-iframe";

export default async function OdemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, authUser, company } = await requirePhotographer();
  const detail = await getOrderDetail(id);

  if (!detail || detail.order.company_id !== profile.company_id) notFound();

  const { order, items } = detail;
  if (order.payment_method !== "credit_card" || order.status !== "pending_payment") {
    redirect(`/panel/siparisler/${order.id}`);
  }

  const paytrSettings = await getPaytrSettings();
  if (!paytrSettings) {
    // PayTR yapılandırılmamış/kapalı — normalde bu sayfaya hiç yönlendirilmemeli.
    redirect(`/panel/siparisler/${order.id}`);
  }

  const h = await headers();
  const host = h.get("host") ?? "adanacoloralbum.com";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const userIp = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "85.111.20.20";

  const basket: PaytrBasketItem[] = items.map((item) => ({
    name: (item.item_type === "album" ? item.sizeLabel : item.extraLabel) || "Ürün",
    price: item.unit_price,
    quantity: item.quantity,
  }));

  const result = await getPaytrToken({
    settings: paytrSettings,
    merchantOid: toMerchantOid(order.id),
    email: authUser.email ?? "siparis@adanacoloralbum.com",
    amountTl: order.total,
    userIp,
    basket,
    userName: profile.full_name || company?.name || "Fotoğrafçı",
    userAddress: company?.address || "-",
    userPhone: company?.phone || "-",
    okUrl: `${baseUrl}/panel/siparisler/${order.id}`,
    failUrl: `${baseUrl}/panel/siparisler/${order.id}`,
    notifyUrl: `${baseUrl}/api/paytr/webhook`,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ödeme — {order.order_no}</h1>
        <p className="text-neutral-500">Kart bilgileriniz doğrudan PayTR&apos;nin güvenli sayfasında alınır.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            Güvenli Ödeme
          </CardTitle>
          <CardDescription>
            {paytrSettings.testMode
              ? "Test modu aktif — gerçek para çekilmez."
              : "Kart bilgileriniz atölyemizin sunucularına hiç ulaşmaz, doğrudan PayTR tarafından işlenir."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <PaytrIframe token={result.token} />
          ) : (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Ödeme sayfası başlatılamadı: {result.reason} Lütfen sayfayı yenileyip tekrar deneyin, sorun
              devam ederse atölyemizle iletişime geçin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
