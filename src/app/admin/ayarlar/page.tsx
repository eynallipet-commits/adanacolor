import { Search, LineChart, UserCog } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SeoSettingsForm } from "./seo-settings-form";
import { AnalyticsSettingsForm } from "./analytics-settings-form";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AyarlarPage() {
  const { authUser } = await requireAdmin();
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-brand-600" />
            Analitik ve Reklam Kodları
          </CardTitle>
          <CardDescription>
            Google Analytics, Google Tag Manager, Meta (Facebook) Pixel ve Google Search Console
            doğrulama kodlarını buradan girin — kaydettiğinizde tüm sitede otomatik olarak devreye
            girer, kod eklemeniz gerekmez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsSettingsForm settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-brand-600" />
            Arama Motoru (SEO) Görünümü
          </CardTitle>
          <CardDescription>
            Ana sayfanın Google arama sonuçlarında görünecek başlık ve açıklaması. Boş bırakılırsa
            varsayılan metinler kullanılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeoSettingsForm settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-brand-600" />
            Hesabım
          </CardTitle>
          <CardDescription>Kendi yönetici hesabınızın e-posta ve şifresini değiştirin.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSettingsForm currentEmail={authUser.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
