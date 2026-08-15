"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import Image from "next/image";
import { CreditCard, Landmark, Check, ImageOff, ShoppingCart, Images, Lock, RotateCcw } from "lucide-react";
import { createOrderAction, type CreateOrderState } from "./actions";
import { calcAlbumUnitPrice, calcOrderTotals } from "@/lib/pricing";
import { formatTL, cn } from "@/lib/utils";
import { EXTRA_CATEGORY_LABELS } from "@/lib/order-status";
import { getRequiredPhotoCount, ORDER_PHOTOS_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { BANK_TRANSFER_INFO } from "@/lib/payments/mock";
import { OrderPhotos } from "@/components/order-photos";
import { ColorSwatch, colorLabel } from "@/components/color-swatch";
import type {
  AlbumColor,
  AlbumModel,
  AlbumSize,
  AlbumSizePrice,
  ExtraProduct,
  PackageType,
} from "@/lib/database.types";

interface AlbumCartItem {
  id: string;
  type: "album";
  sizeId: string;
  packageTypeId: string;
  albumModelId: string | null;
  pageCount: number;
  quantity: number;
  coverNamesText: string;
  coverDateText: string;
  albumColorId: string | null;
  albumColorLabel: string | null;
  unitPrice: number;
  label: string;
}

interface ExtraCartItem {
  id: string;
  type: "extra";
  extraProductId: string;
  quantity: number;
  unitPrice: number;
  label: string;
}

type CartItem = AlbumCartItem | ExtraCartItem;

export interface InitialAlbumCartLine {
  type: "album";
  sizeId: string;
  packageTypeId: string;
  albumModelId: string | null;
  pageCount: number;
  quantity: number;
  coverNamesText: string;
  coverDateText: string;
  albumColorId: string | null;
}
export interface InitialExtraCartLine {
  type: "extra";
  extraProductId: string;
  quantity: number;
}
export type InitialCartLine = InitialAlbumCartLine | InitialExtraCartLine;

const initialState: CreateOrderState = {};

export function OrderBuilder({
  sizes,
  packages,
  prices,
  models,
  extras,
  colors,
  modelSizes,
  modelColors,
  discountRate,
  companyId,
  initialCart = [],
}: {
  sizes: AlbumSize[];
  packages: PackageType[];
  prices: AlbumSizePrice[];
  models: AlbumModel[];
  extras: ExtraProduct[];
  colors: AlbumColor[];
  modelSizes: Record<string, string[]>;
  modelColors: Record<string, string[]>;
  discountRate: number;
  companyId: string;
  initialCart?: InitialCartLine[];
}) {
  const colorMap = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const sizeCodeMap = useMemo(() => new Map(sizes.map((s) => [s.id, s.code])), [sizes]);
  /** Model kartının altında gösterilen desteklenen ebat listesi. */
  const modelSizeCodes = (modelId: string) => {
    const ids = modelSizes[modelId];
    if (!ids || ids.length === 0) return "Tüm ebatlar";
    return ids
      .map((id) => sizeCodeMap.get(id))
      .filter(Boolean)
      .join(", ");
  };
  /** Model seçili değilse ya da ebat tanımı yoksa tüm ebatlar açık kabul edilir. */
  const sizeIdsForModel = (modelId: string) => {
    const ids = modelId ? modelSizes[modelId] : undefined;
    return ids && ids.length > 0 ? ids : null;
  };
  const supabase = useMemo(() => createClient(), []);
  const priceMap = useMemo(() => new Map(prices.map((p) => [`${p.size_id}:${p.package_type_id}`, p.price])), [prices]);

  const [cart, setCart] = useState<CartItem[]>(() =>
    initialCart.flatMap((line): CartItem[] => {
      if (line.type === "album") {
        const pkg = packages.find((p) => p.id === line.packageTypeId);
        const basePrice = priceMap.get(`${line.sizeId}:${line.packageTypeId}`);
        if (!pkg || basePrice === undefined) return [];
        const size = sizes.find((s) => s.id === line.sizeId);
        const model = models.find((m) => m.id === line.albumModelId);
        const color = line.albumColorId ? colors.find((c) => c.id === line.albumColorId) : undefined;
        return [
          {
            id: crypto.randomUUID(),
            type: "album",
            sizeId: line.sizeId,
            packageTypeId: line.packageTypeId,
            albumModelId: line.albumModelId,
            pageCount: line.pageCount,
            quantity: line.quantity,
            coverNamesText: line.coverNamesText,
            coverDateText: line.coverDateText,
            albumColorId: color?.id ?? null,
            albumColorLabel: color ? colorLabel(color) : null,
            unitPrice: calcAlbumUnitPrice(basePrice, pkg, line.pageCount),
            label: `${size?.code ?? ""} · ${pkg.name} · ${line.pageCount} sayfa${model ? " · " + model.name : ""}${
              color ? " · Renk " + colorLabel(color) : ""
            }`,
          },
        ];
      }
      const extra = extras.find((e) => e.id === line.extraProductId);
      if (!extra) return [];
      return [
        {
          id: crypto.randomUUID(),
          type: "extra",
          extraProductId: line.extraProductId,
          quantity: line.quantity,
          unitPrice: extra.price,
          label: `${EXTRA_CATEGORY_LABELS[extra.category] ?? extra.category} · ${extra.name}`,
        },
      ];
    })
  );
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "bank_transfer">("credit_card");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [state, formAction, isPending] = useActionState(createOrderAction, initialState);

  const cardValid =
    paymentMethod !== "credit_card" ||
    (/^\d{4} ?\d{4} ?\d{4} ?\d{4}$/.test(card.number.trim()) &&
      /^\d{2}\/\d{2}$/.test(card.expiry.trim()) &&
      /^\d{3,4}$/.test(card.cvv.trim()) &&
      card.name.trim().length > 1);

  // Albüm ekleme formu state'i
  // Başlangıç ebadı, varsayılan modelin basabildiği ebatlardan seçilmeli —
  // aksi halde <select> ilk seçeneği gösterirken state başka bir ebatta kalır.
  const defaultModelId = models[0]?.id ?? "";
  const [sizeId, setSizeId] = useState(() => {
    const ids = sizeIdsForModel(defaultModelId);
    const usable = ids ? sizes.filter((s) => ids.includes(s.id)) : sizes;
    return usable[0]?.id ?? sizes[0]?.id ?? "";
  });
  const availablePackages = useMemo(
    () => packages.filter((pkg) => priceMap.has(`${sizeId}:${pkg.id}`)),
    [packages, priceMap, sizeId]
  );
  const [packageTypeId, setPackageTypeId] = useState(availablePackages[0]?.id ?? "");
  const selectedPackage = packages.find((p) => p.id === packageTypeId) ?? availablePackages[0];
  const [pageCount, setPageCount] = useState(selectedPackage?.base_page_count ?? 0);
  const [albumModelId, setAlbumModelId] = useState<string>(defaultModelId);
  const [albumColorId, setAlbumColorId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [coverNamesText, setCoverNamesText] = useState("");
  const [coverDateText, setCoverDateText] = useState("");

  // Seçili modelin basılabildiği ebatlar
  const allowedSizes = useMemo(() => {
    const ids = sizeIdsForModel(albumModelId);
    if (!ids) return sizes;
    const set = new Set(ids);
    return sizes.filter((s) => set.has(s.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sizeIdsForModel modelSizes'a bağlı, stabil
  }, [albumModelId, modelSizes, sizes]);

  // Seçili modelin sunduğu renkler
  const availableColors = useMemo(() => {
    const ids = albumModelId ? modelColors[albumModelId] : undefined;
    if (!ids || ids.length === 0) return [];
    const set = new Set(ids);
    return colors.filter((c) => set.has(c.id));
  }, [albumModelId, modelColors, colors]);

  // Ebat değişince paket seçimini geçerli aralığa taşı
  function handleSizeChange(newSizeId: string) {
    setSizeId(newSizeId);
    const firstValid = packages.find((pkg) => priceMap.has(`${newSizeId}:${pkg.id}`));
    if (firstValid) {
      setPackageTypeId(firstValid.id);
      setPageCount(firstValid.base_page_count);
    }
  }

  // Model değişince ebat ve rengi o modelin desteklediklerine sabitle
  function handleModelChange(newModelId: string) {
    setAlbumModelId(newModelId);

    const ids = sizeIdsForModel(newModelId);
    if (ids && !ids.includes(sizeId)) {
      const firstAllowed = sizes.find((s) => ids.includes(s.id));
      if (firstAllowed) handleSizeChange(firstAllowed.id);
    }

    const colorIds = newModelId ? modelColors[newModelId] : undefined;
    if (!colorIds || !colorIds.includes(albumColorId)) setAlbumColorId("");
  }

  function handlePackageChange(newPackageId: string) {
    setPackageTypeId(newPackageId);
    const pkg = packages.find((p) => p.id === newPackageId);
    if (pkg) setPageCount(pkg.base_page_count);
  }

  const currentBasePrice = priceMap.get(`${sizeId}:${packageTypeId}`);
  const currentUnitPrice =
    currentBasePrice !== undefined && selectedPackage
      ? calcAlbumUnitPrice(currentBasePrice, selectedPackage, pageCount)
      : 0;

  const needsColor = availableColors.length > 0;
  const canAddAlbum = !!selectedPackage && currentBasePrice !== undefined && (!needsColor || !!albumColorId);

  function addAlbumLine() {
    if (!selectedPackage || currentBasePrice === undefined) return;
    if (needsColor && !albumColorId) return;
    const size = sizes.find((s) => s.id === sizeId);
    const model = models.find((m) => m.id === albumModelId);
    const color = albumColorId ? colorMap.get(albumColorId) : undefined;
    setCart((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        type: "album",
        sizeId,
        packageTypeId,
        albumModelId: albumModelId || null,
        pageCount,
        quantity,
        coverNamesText,
        coverDateText,
        albumColorId: color?.id ?? null,
        albumColorLabel: color ? colorLabel(color) : null,
        unitPrice: currentUnitPrice,
        label: `${size?.code ?? ""} · ${selectedPackage.name} · ${pageCount} sayfa${model ? " · " + model.name : ""}${
          color ? " · Renk " + colorLabel(color) : ""
        }`,
      },
    ]);
    setCoverNamesText("");
    setCoverDateText("");
    setQuantity(1);
  }

  // Ekstra ürün ekleme formu state'i
  const [extraId, setExtraId] = useState(extras[0]?.id ?? "");
  const [extraQty, setExtraQty] = useState(1);

  function addExtraLine() {
    const extra = extras.find((e) => e.id === extraId);
    if (!extra) return;
    setCart((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        type: "extra",
        extraProductId: extraId,
        quantity: extraQty,
        unitPrice: extra.price,
        label: `${EXTRA_CATEGORY_LABELS[extra.category] ?? extra.category} · ${extra.name}`,
      },
    ]);
    setExtraQty(1);
  }

  function removeLine(id: string) {
    setCart((c) => c.filter((l) => l.id !== id));
    // Sepetten çıkarılan kalemin yüklenmiş fotoğrafları varsa arka planda temizle.
    supabase.storage
      .from(ORDER_PHOTOS_BUCKET)
      .list(`${companyId}/${id}`)
      .then(({ data }) => {
        const paths = (data ?? []).map((f) => `${companyId}/${id}/${f.name}`);
        if (paths.length > 0) {
          supabase.storage.from(ORDER_PHOTOS_BUCKET).remove(paths);
        }
      });
  }

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const { discountAmount, total } = calcOrderTotals(subtotal, discountRate);

  const cartPayload = JSON.stringify(
    cart.map((l) =>
      l.type === "album"
        ? {
            id: l.id,
            type: "album",
            sizeId: l.sizeId,
            packageTypeId: l.packageTypeId,
            albumModelId: l.albumModelId,
            pageCount: l.pageCount,
            quantity: l.quantity,
            coverNamesText: l.coverNamesText,
            coverDateText: l.coverDateText,
            albumColorId: l.albumColorId,
          }
        : { id: l.id, type: "extra", extraProductId: l.extraProductId, quantity: l.quantity }
    )
  );

  return (
    <div className="space-y-4">
      {initialCart.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <RotateCcw className="h-4 w-4 shrink-0" />
          Önceki siparişinizdeki ürünler sepete eklendi. Fotoğrafları tekrar yüklemeniz gerekiyor.
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-4 w-4 text-brand-600" />
              Albüm Ekle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ebat</Label>
                <Select value={sizeId} onChange={(e) => handleSizeChange(e.target.value)}>
                  {allowedSizes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </Select>
                {allowedSizes.length < sizes.length && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Yalnızca seçili modelin basılabildiği ebatlar listelenir.
                  </p>
                )}
              </div>
              <div>
                <Label>Paket</Label>
                <Select value={packageTypeId} onChange={(e) => handlePackageChange(e.target.value)}>
                  {availablePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Sayfa Sayısı</Label>
                <Input
                  type="number"
                  min={selectedPackage?.base_page_count ?? 0}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                />
                {selectedPackage && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Taban {selectedPackage.base_page_count} sayfa, ek sayfa {formatTL(selectedPackage.extra_page_price)}
                  </p>
                )}
              </div>
              <div>
                <Label>Adet</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="col-span-2">
                <Label>Kapak Modeli</Label>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {models.map((m) => {
                    const selected = albumModelId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleModelChange(selected ? "" : m.id)}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border-2 text-left transition-colors",
                          selected ? "border-brand-600" : "border-transparent"
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full bg-neutral-100">
                          {m.image_url ? (
                            <Image
                              src={m.image_url}
                              alt={m.name}
                              fill
                              sizes="120px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-neutral-300">
                              <ImageOff className="h-5 w-5" />
                            </div>
                          )}
                          {selected && (
                            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "px-1.5 py-1 text-center",
                            selected ? "bg-brand-50 text-brand-700" : "bg-white text-neutral-600"
                          )}
                        >
                          <p className="truncate text-xs font-medium">{m.name}</p>
                          <p className="truncate text-[10px] text-neutral-400" title={modelSizeCodes(m.id)}>
                            {modelSizeCodes(m.id)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {models.length === 0 && (
                  <p className="mt-1 text-xs text-neutral-500">Tanımlı kapak modeli yok.</p>
                )}
              </div>

              {needsColor && (
                <div className="col-span-2">
                  <Label>
                    Kapak Rengi <span className="text-red-600">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((c) => {
                      const selected = albumColorId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAlbumColorId(selected ? "" : c.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border-2 p-1 transition-colors",
                            selected ? "border-brand-600 bg-brand-50" : "border-transparent hover:bg-neutral-50"
                          )}
                          title={colorLabel(c)}
                          aria-pressed={selected}
                        >
                          <span className="relative">
                            <ColorSwatch color={c} className="h-10 w-12" />
                            {selected && (
                              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              selected ? "text-brand-700" : "text-neutral-500"
                            )}
                          >
                            {c.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!albumColorId && (
                    <p className="mt-1 text-xs text-amber-700">Sepete eklemek için bir kapak rengi seçin.</p>
                  )}
                </div>
              )}
              <div>
                <Label>Kapak Yazısı (isimler)</Label>
                <Input
                  placeholder="Örn: Ayşe & Mehmet"
                  value={coverNamesText}
                  onChange={(e) => setCoverNamesText(e.target.value)}
                />
              </div>
              <div>
                <Label>Kapak Tarihi</Label>
                <Input
                  placeholder="Örn: 12.06.2026"
                  value={coverDateText}
                  onChange={(e) => setCoverDateText(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
              <span className="text-sm text-neutral-600">Birim fiyat</span>
              <span className="font-semibold">{formatTL(currentUnitPrice)}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={addAlbumLine}
              disabled={!canAddAlbum}
            >
              Sepete Ekle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-brand-600" />
              Ekstra Ürün Ekle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ürün</Label>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {extras.map((e) => {
                  const selected = extraId === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setExtraId(e.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border-2 text-left transition-colors",
                        selected ? "border-brand-600" : "border-transparent"
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full bg-neutral-100">
                        {e.image_url ? (
                          <Image
                            src={e.image_url}
                            alt={e.name}
                            fill
                            sizes="120px"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-300">
                            <ImageOff className="h-5 w-5" />
                          </div>
                        )}
                        {selected && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "px-1.5 py-1 text-center",
                          selected ? "bg-brand-50 text-brand-700" : "bg-white text-neutral-600"
                        )}
                      >
                        <p className="truncate text-xs font-medium">{e.name}</p>
                        <p className="truncate text-[11px]">{formatTL(e.price)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {extras.length === 0 && <p className="mt-1 text-xs text-neutral-500">Tanımlı ekstra ürün yok.</p>}
            </div>
            <div>
              <Label>Adet</Label>
              <Input
                type="number"
                min={1}
                value={extraQty}
                onChange={(e) => setExtraQty(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={addExtraLine}>
              Sepete Ekle
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-brand-600" />
              Sepet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-500">Sepetiniz boş.</p>
            ) : (
              <ul className="space-y-4">
                {cart.map((l) => {
                  const requiredCount = getRequiredPhotoCount(
                    l.type === "album"
                      ? { item_type: "album", page_count: l.pageCount, quantity: l.quantity }
                      : { item_type: "extra", page_count: null, quantity: l.quantity }
                  );
                  return (
                    <li key={l.id} className="rounded-lg border border-neutral-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{l.label}</p>
                          <p className="text-xs text-neutral-500">
                            {l.quantity} × {formatTL(l.unitPrice)} = {formatTL(l.unitPrice * l.quantity)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(l.id)}
                          className="shrink-0 text-xs text-red-600 hover:underline"
                        >
                          Sil
                        </button>
                      </div>
                      <div className="mt-2.5 border-t border-neutral-100 pt-2.5">
                        <OrderPhotos companyId={companyId} itemId={l.id} requiredCount={requiredCount} canManage />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Ara Toplam</span>
                <span>{formatTL(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">İskonto (%{discountRate})</span>
                <span>-{formatTL(discountAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Toplam</span>
                <span>{formatTL(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ödeme Yöntemi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                paymentMethod === "credit_card" ? "border-brand-600 bg-brand-50/50" : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <input
                type="radio"
                name="payment_method_ui"
                checked={paymentMethod === "credit_card"}
                onChange={() => setPaymentMethod("credit_card")}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  paymentMethod === "credit_card" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-500"
                )}
              >
                <CreditCard className="h-4.5 w-4.5" />
              </span>
              <span>
                <span className="block text-sm font-medium">Kredi Kartı (Test Modu)</span>
                <span className="block text-xs text-neutral-500">
                  Gerçek bir tahsilat yapılmaz; sipariş anında &quot;ödendi&quot; olarak işaretlenir.
                </span>
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                paymentMethod === "bank_transfer" ? "border-brand-600 bg-brand-50/50" : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <input
                type="radio"
                name="payment_method_ui"
                checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  paymentMethod === "bank_transfer" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-500"
                )}
              >
                <Landmark className="h-4.5 w-4.5" />
              </span>
              <span>
                <span className="block text-sm font-medium">Havale / EFT</span>
                <span className="block text-xs text-neutral-500">
                  {BANK_TRANSFER_INFO.bankName} — {BANK_TRANSFER_INFO.iban}
                </span>
              </span>
            </label>

            {paymentMethod === "credit_card" && (
              <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Lock className="h-3.5 w-3.5" />
                  Test modu — girilen kart bilgileri saklanmaz.
                </p>
                <div>
                  <Label htmlFor="card-name">Kart Üzerindeki İsim</Label>
                  <Input
                    id="card-name"
                    placeholder="Ad Soyad"
                    value={card.name}
                    onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="card-number">Kart Numarası</Label>
                  <Input
                    id="card-number"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={card.number}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const grouped = digits.replace(/(.{4})/g, "$1 ").trim();
                      setCard((c) => ({ ...c, number: grouped }));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="card-expiry">Son Kullanma (AA/YY)</Label>
                    <Input
                      id="card-expiry"
                      inputMode="numeric"
                      placeholder="AA/YY"
                      maxLength={5}
                      value={card.expiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                        const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                        setCard((c) => ({ ...c, expiry: formatted }));
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-cvv">CVV</Label>
                    <Input
                      id="card-cvv"
                      inputMode="numeric"
                      placeholder="000"
                      maxLength={4}
                      value={card.cvv}
                      onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    />
                  </div>
                </div>
              </div>
            )}

            <form action={formAction}>
              <input type="hidden" name="cart" value={cartPayload} />
              <input type="hidden" name="payment_method" value={paymentMethod} />
              {state.error && (
                <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {state.error}
                </p>
              )}
              {paymentMethod === "credit_card" && !cardValid && (
                <p className="mb-3 text-xs text-neutral-500">Devam etmek için kart bilgilerini eksiksiz girin.</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending || cart.length === 0 || !cardValid}>
                {isPending ? "Gönderiliyor..." : paymentMethod === "credit_card" ? "Ödeme Yap" : "Siparişi Oluştur"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
