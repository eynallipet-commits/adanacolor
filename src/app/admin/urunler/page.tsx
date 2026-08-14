import { Grid3x3, Images, ShoppingBag, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AlbumModel, AlbumSize, AlbumSizePrice, ExtraProduct, PackageType } from "@/lib/database.types";
import { getAppSettings } from "@/lib/settings";
import { PriceMatrix } from "./price-matrix";
import { GlobalAlbumModels, GlobalExtraProducts } from "./global-products";
import { DeliverySettingsForm } from "./delivery-settings-form";

export default async function UrunlerPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [sizesRes, packagesRes, pricesRes, modelsRes, extrasRes, settings] = await Promise.all([
    supabase.from("album_sizes").select("*").order("sort_order").returns<AlbumSize[]>(),
    supabase.from("package_types").select("*").order("sort_order").returns<PackageType[]>(),
    supabase.from("album_size_prices").select("*").returns<AlbumSizePrice[]>(),
    supabase.from("album_models").select("*").is("company_id", null).order("sort_order").returns<AlbumModel[]>(),
    supabase.from("extra_products").select("*").is("company_id", null).order("sort_order").returns<ExtraProduct[]>(),
    getAppSettings(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ürünler & Fiyatlar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand-600" />
            Teslimat Süresi Bilgilendirmesi
          </CardTitle>
          <CardDescription>
            Ödeme onaylandıktan sonra fotoğrafçıya gösterilen tahmini kargo teslim aralığı (gün).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeliverySettingsForm minDays={settings.estimated_min_days} maxDays={settings.estimated_max_days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4 text-brand-600" />
            Ebat / Paket Fiyat Matrisi
          </CardTitle>
          <CardDescription>Hücreye tıklayıp fiyatı değiştirin, alandan çıkınca otomatik kaydedilir.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <PriceMatrix sizes={sizesRes.data ?? []} packages={packagesRes.data ?? []} prices={pricesRes.data ?? []} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-4 w-4 text-brand-600" />
              Genel Kapak Modelleri
            </CardTitle>
            <CardDescription>Tüm fotoğrafçılara açık modeller.</CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalAlbumModels models={modelsRes.data ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              Genel Ekstra Ürünler
            </CardTitle>
            <CardDescription>Canvas, foto büyütme ve kutu kataloğu.</CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalExtraProducts extras={extrasRes.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
