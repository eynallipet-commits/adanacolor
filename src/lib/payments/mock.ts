/**
 * Mock ödeme sağlayıcısı. Gerçek bir sanal pos entegrasyonu (iyzico/PayTR) eklenene kadar
 * kredi kartı ödemelerini simüle eder. Arayüz gerçek sağlayıcılarla aynı şekli taklit eder,
 * ileride bu dosya değiştirilerek gerçek entegrasyona geçilebilir.
 */
export interface MockChargeInput {
  orderId: string;
  amount: number;
}

export interface MockChargeResult {
  success: boolean;
  reference: string;
}

export async function mockCharge({ orderId }: MockChargeInput): Promise<MockChargeResult> {
  // Gerçek entegrasyonda burada sağlayıcının API'sine istek atılır.
  const reference = `MOCK-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`;
  return { success: true, reference };
}

export const BANK_TRANSFER_INFO = {
  bankName: "Ziraat Bankası",
  accountName: "Adana Color Foto Albüm San. Tic. Ltd. Şti.",
  iban: "TR00 0000 0000 0000 0000 0000 00",
  note: "Açıklamaya sipariş numaranızı yazınız.",
};
