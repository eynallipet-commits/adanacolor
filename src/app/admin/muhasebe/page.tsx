import { FileSpreadsheet, Landmark, PlugZap } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InvoiceSettingsForm } from "./invoice-settings-form";

export default async function MuhasebePage() {
  await requireAdmin();
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Muhasebe</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand-600" />
            Fatura Ayarları
          </CardTitle>
          <CardDescription>
            Sipariş belgesinde (fatura) gösterilecek satıcı bilgileri ve KDV oranı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceSettingsForm settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-brand-600" />
            Faturaları Dışa Aktar
          </CardTitle>
          <CardDescription>
            Seçilen tarih aralığındaki ödemesi alınmış siparişleri, Logo Starter&apos;a (veya başka bir
            muhasebe programına) içe aktarılabilecek CSV formatında indirin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/admin/muhasebe/export" method="get" className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="export-from">Başlangıç</Label>
              <Input id="export-from" name="from" type="date" />
            </div>
            <div>
              <Label htmlFor="export-to">Bitiş</Label>
              <Input id="export-to" name="to" type="date" />
            </div>
            <Button type="submit" size="default">
              CSV İndir
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-brand-600" />
            Muhasebe Entegrasyonu
          </CardTitle>
          <CardDescription>
            Şu an faturalar CSV olarak dışa aktarılıp Logo Starter&apos;a manuel/toplu içe aktarılıyor.
            Logo&apos;nun size verdiği API bilgileri elinize geçtiğinde, siparişler onaylandıkça
            otomatik olarak Logo&apos;ya aktarılan gerçek zamanlı bir entegrasyona geçebiliriz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm opacity-50">
            <Label htmlFor="logo-api-key">Logo API Anahtarı (yakında)</Label>
            <Input id="logo-api-key" disabled placeholder="Henüz mevcut değil" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
