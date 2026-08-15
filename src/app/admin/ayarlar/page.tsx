import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SeoSettingsForm } from "./seo-settings-form";

export default async function AyarlarPage() {
  await requireAdmin();
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-brand-600" />
            SEO
          </CardTitle>
          <CardDescription>
            Ana sayfanın Google arama sonuçlarında görünecek başlık ve açıklamasını buradan
            değiştirebilirsiniz. Boş bırakılırsa varsayılan metinler kullanılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeoSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
