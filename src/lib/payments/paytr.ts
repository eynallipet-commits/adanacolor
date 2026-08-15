import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentProviderSettings } from "@/lib/database.types";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

export interface PaytrSettings {
  enabled: boolean;
  testMode: boolean;
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
}

/**
 * PayTR ayarlarını service-role ile okur — bu tablo yalnızca admin'e açık, fotoğrafçı
 * oturumundan asla okunmamalı (bkz. migration 0017 açıklaması).
 */
export async function getPaytrSettings(): Promise<PaytrSettings | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("payment_provider_settings")
    .select("*")
    .eq("id", true)
    .single<PaymentProviderSettings>();

  if (!data || !data.paytr_enabled || !data.paytr_merchant_id || !data.paytr_merchant_key || !data.paytr_merchant_salt) {
    return null;
  }

  return {
    enabled: true,
    testMode: data.paytr_test_mode,
    merchantId: data.paytr_merchant_id,
    merchantKey: data.paytr_merchant_key,
    merchantSalt: data.paytr_merchant_salt,
  };
}

/** UUID'den ("-" karakterleri olmadan) PayTR'nin kabul ettiği alfanumerik sipariş no üretir. */
export function toMerchantOid(orderId: string): string {
  return orderId.replace(/-/g, "");
}

/** merchant_oid'den orijinal UUID'yi geri kurar (32 hex karakteri 8-4-4-4-12 şeklinde böler). */
export function fromMerchantOid(oid: string): string | null {
  const hex = oid.replace(/[^0-9a-f]/gi, "");
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export interface PaytrBasketItem {
  name: string;
  price: number;
  quantity: number;
}

export interface GetPaytrTokenInput {
  settings: PaytrSettings;
  merchantOid: string;
  email: string;
  amountTl: number;
  userIp: string;
  basket: PaytrBasketItem[];
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl: string;
  failUrl: string;
  notifyUrl: string;
}

export type GetPaytrTokenResult = { success: true; token: string } | { success: false; reason: string };

export async function getPaytrToken(input: GetPaytrTokenInput): Promise<GetPaytrTokenResult> {
  const { settings, merchantOid, email, amountTl, userIp, basket, userName, userAddress, userPhone, okUrl, failUrl, notifyUrl } =
    input;

  const paymentAmount = Math.round(amountTl * 100);
  const userBasket = Buffer.from(
    JSON.stringify(basket.map((b) => [b.name, b.price.toFixed(2), b.quantity]))
  ).toString("base64");
  const noInstallment = 0;
  const maxInstallment = 0;
  const currency = "TL";
  const testMode = settings.testMode ? 1 : 0;

  const hashStr =
    settings.merchantId +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    testMode;

  const paytrToken = crypto
    .createHmac("sha256", settings.merchantKey)
    .update(hashStr + settings.merchantSalt)
    .digest("base64");

  const body = new URLSearchParams({
    merchant_id: settings.merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: String(paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: settings.testMode ? "1" : "0",
    no_installment: String(noInstallment),
    max_installment: String(maxInstallment),
    user_name: userName || "Fotoğrafçı",
    user_address: userAddress || "-",
    user_phone: userPhone || "-",
    merchant_ok_url: okUrl,
    merchant_fail_url: failUrl,
    test_mode: String(testMode),
    currency,
    lang: "tr",
  });
  // PayTR bildirim (webhook) URL'i mağaza panelinden ayarlanır; ayrıca burada da gönderiyoruz.
  body.set("merchant_notify_url", notifyUrl);

  let response: Response;
  try {
    response = await fetch(PAYTR_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    return { success: false, reason: "PayTR sunucusuna ulaşılamadı." };
  }

  let json: { status?: string; token?: string; reason?: string };
  try {
    json = await response.json();
  } catch {
    return { success: false, reason: "PayTR yanıtı okunamadı." };
  }

  if (json.status === "success" && json.token) {
    return { success: true, token: json.token };
  }
  return { success: false, reason: json.reason || "PayTR token alınamadı." };
}

export function verifyPaytrCallback(
  fields: { merchant_oid: string; status: string; total_amount: string; hash: string },
  settings: { merchantKey: string; merchantSalt: string }
): boolean {
  const expected = crypto
    .createHmac("sha256", settings.merchantKey)
    .update(fields.merchant_oid + settings.merchantSalt + fields.status + fields.total_amount)
    .digest("base64");
  return expected === fields.hash;
}
