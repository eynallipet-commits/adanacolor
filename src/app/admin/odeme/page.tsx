import { headers } from "next/headers";
import { Landmark, CreditCard } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import { COMPANY } from "@/lib/company";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BankTransferForm } from "./bank-transfer-form";
import { PaytrSettingsForm } from "./paytr-settings-form";
import type { PaymentProviderSettings } from "@/lib/database.types";

export default async function OdemePage() {
  await requireAdmin();
  const supabase = await createClient();

  const [appSettings, providerRes, h] = await Promise.all([
    getAppSettings(),
    supabase.from("payment_provider_settings").select("*").eq("id", true).single<PaymentProviderSettings>(),
    headers(),
  ]);

  const host = h.get("host") ?? new URL(COMPANY.siteUrl).host;
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const notifyUrl = `${proto}://${host}/api/paytr/webhook`;

  const providerSettings: PaymentProviderSettings =
    providerRes.data ?? {
      id: true,
      paytr_enabled: false,
      paytr_test_mode: true,
      paytr_merchant_id: null,
      paytr_merchant_key: null,
      paytr_merchant_salt: null,
      updated_at: new Date().toISOString(),
    };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ödeme</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand-600" />
            Banka Havale / EFT Bilgileri
          </CardTitle>
          <CardDescription>
            Havale/EFT ile ödeme seçen fotoğrafçılara sipariş sayfasında gösterilecek hesap bilgileri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BankTransferForm settings={appSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-600" />
            PayTR Sanal POS Entegrasyonu
          </CardTitle>
          <CardDescription>
            PayTR üyeliğiniz onaylandığında mağaza panelinizden alacağınız bilgileri buraya girin.
            Yukarıdaki &quot;Bildirim URL&quot;yi PayTR mağaza panelinizdeki bildirim URL alanına
            eklemeniz gerekiyor. Test modunu kapattığınızda sistem gerçek kartlardan tahsilat
            yapmaya başlar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaytrSettingsForm settings={providerSettings} notifyUrl={notifyUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
