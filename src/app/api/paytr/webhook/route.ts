import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaytrCallback, fromMerchantOid } from "@/lib/payments/paytr";
import type { PaymentProviderSettings } from "@/lib/database.types";

/**
 * PayTR bildirim (webhook) uç noktası. PayTR mağaza panelinden bu URL girilmelidir:
 * https://<domain>/api/paytr/webhook
 *
 * PayTR'nin beklediği yanıt: yalnızca "OK" düz metni. Başka bir yanıt (hata metni dahil)
 * PayTR'nin bildirimi "başarısız" sayıp tekrar denemesine yol açar — hash uyuşmazlığında
 * kasıtlı olarak "OK" DIŞINDA bir yanıt döndürüyoruz (dokümantasyondaki örnek davranış).
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const merchant_oid = String(form.get("merchant_oid") ?? "");
  const status = String(form.get("status") ?? "");
  const total_amount = String(form.get("total_amount") ?? "");
  const hash = String(form.get("hash") ?? "");

  if (!merchant_oid || !status || !total_amount || !hash) {
    return new NextResponse("PAYTR notification failed: missing fields", { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: settings } = await adminClient
    .from("payment_provider_settings")
    .select("*")
    .eq("id", true)
    .single<PaymentProviderSettings>();

  if (!settings?.paytr_merchant_key || !settings?.paytr_merchant_salt) {
    return new NextResponse("PAYTR notification failed: not configured", { status: 400 });
  }

  const validHash = verifyPaytrCallback(
    { merchant_oid, status, total_amount, hash },
    { merchantKey: settings.paytr_merchant_key, merchantSalt: settings.paytr_merchant_salt }
  );
  if (!validHash) {
    return new NextResponse("PAYTR notification failed: bad hash", { status: 400 });
  }

  const orderId = fromMerchantOid(merchant_oid);
  if (!orderId) {
    return new NextResponse("OK");
  }

  const { data: order } = await adminClient.from("orders").select("id,status").eq("id", orderId).single();

  // Sipariş yoksa ya da zaten işlenmişse yine "OK" dönüyoruz — PayTR aynı bildirimi birden
  // fazla kez gönderebilir, tekrar işlemeye çalışmak yanlış (çift bildirim/gelir kaydı) olur.
  if (order && order.status === "pending_payment") {
    if (status === "success") {
      await adminClient
        .from("payments")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          mock_reference: `PAYTR-${merchant_oid}`,
        })
        .eq("order_id", orderId)
        .eq("method", "credit_card");
      await adminClient.from("orders").update({ status: "paid" }).eq("id", orderId);
    } else {
      await adminClient
        .from("payments")
        .update({ status: "failed" })
        .eq("order_id", orderId)
        .eq("method", "credit_card");
    }
  }

  return new NextResponse("OK");
}
