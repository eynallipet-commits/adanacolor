import { Grid3x3, Images, Palette, ShoppingBag, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type {
  AlbumColor,
  AlbumModel,
  AlbumModelColor,
  AlbumModelSize,
  AlbumSize,
  AlbumSizePrice,
  ExtraProduct,
  PackageType,
} from "@/lib/database.types";
import { getAppSettings } from "@/lib/settings";
import { PriceMatrix } from "./price-matrix";
import { GlobalAlbumModels, GlobalExtraProducts } from "./global-products";
import { ColorPalette } from "./color-palette";
import { SizeManager } from "./size-manager";
import { DeliverySettingsForm } from "./delivery-settings-form";

function groupBy(rows: { model_id: string }[], key: "size_id" | "color_id") {
  return rows.reduce<Record<string, string[]>>((acc, row) => {
    (acc[row.model_id] ??= []).push((row as unknown as Record<string, string>)[key]);
    return acc;
  }, {});
}

export default async function UrunlerPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [sizesRes, packagesRes, pricesRes, modelsRes, extrasRes, colorsRes, modelSizesRes, modelColorsRes, settings] =
    await Promise.all([
      supabase.from("album_sizes").select("*").order("sort_order").returns<AlbumSize[]>(),
      supabase.from("package_types").select("*").order("sort_order").returns<PackageType[]>(),
      supabase.from("album_size_prices").select("*").returns<AlbumSizePrice[]>(),
      supabase.from("album_models").select("*").is("company_id", null).order("sort_order").returns<AlbumModel[]>(),
      supabase.from("extra_products").select("*").is("company_id", null).order("sort_order").returns<ExtraProduct[]>(),
      supabase.from("album_colors").select("*").order("sort_order").returns<AlbumColor[]>(),
      supabase.from("album_model_sizes").select("*").returns<AlbumModelSize[]>(),
      supabase.from("album_model_colors").select("*").returns<AlbumModelColor[]>(),
      getAppSettings(),
    ]);

  const modelSizes = groupBy(modelSizesRes.data ?? [], "size_id");
  const modelColors = groupBy(modelColorsRes.data ?? [], "color_id");

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
        <CardContent className="space-y-4">
          <PriceMatrix sizes={sizesRes.data ?? []} packages={packagesRes.data ?? []} prices={pricesRes.data ?? []} />
          <SizeManager sizes={sizesRes.data ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-600" />
            Kumaş Renk Paleti
          </CardTitle>
          <CardDescription>
            Katalogdaki ortak renk kodları. Renge tıklayarak kodunu, tonunu veya kumaş görselini düzenleyin; her
            modelde hangilerinin sunulduğunu aşağıdan seçersiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ColorPalette colors={colorsRes.data ?? []} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-4 w-4 text-brand-600" />
              Genel Kapak Modelleri
            </CardTitle>
            <CardDescription>Tüm fotoğrafçılara açık modeller, basılabilen ebatlar ve renkler.</CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalAlbumModels
              models={modelsRes.data ?? []}
              sizes={sizesRes.data ?? []}
              colors={colorsRes.data ?? []}
              modelSizes={modelSizes}
              modelColors={modelColors}
            />
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
