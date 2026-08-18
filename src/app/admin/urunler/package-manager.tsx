"use client";

import { useActionState, useState, useTransition } from "react";
import { Link2, Megaphone } from "lucide-react";
import { addPackageTypeAction, deletePackageTypeAction, updatePackageTypeAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { PagePriceTiers } from "./page-price-tiers";
import type { PackagePagePrice, PackageType } from "@/lib/database.types";

const initial: FormState = {};

/**
 * "Ek sayfa köprüsü" seçici.
 *
 * Köprü kurulduğunda bu kampanyanın ek sayfa ücreti sabit olmaktan çıkar: her ebat için
 * iki kampanyanın o ebattaki fiyat farkı, aradaki sayfa farkına bölünerek hesaplanır.
 * Böylece müşteri sayfa ekleyerek üst kampanyanın fiyatına tam olarak ulaşır.
 */
function BridgePicker({
  pkg,
  packages,
  value,
  onChange,
  basePageCount,
}: {
  pkg: PackageType;
  packages: PackageType[];
  value: string;
  onChange: (v: string) => void;
  basePageCount: number;
}) {
  // Yalnızca taban sayfası daha büyük olan kampanyalar hedef olabilir.
  const candidates = packages.filter(
    (p) => p.id !== pkg.id && p.base_page_count > (Number.isFinite(basePageCount) ? basePageCount : pkg.base_page_count)
  );
  const target = packages.find((p) => p.id === value) ?? null;
  const gap = target ? target.base_page_count - basePageCount : 0;

  return (
    <div className="rounded-md border border-dashed border-emerald-300 bg-emerald-50/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-800">
        <Link2 className="h-3.5 w-3.5 text-emerald-700" />
        Ek Sayfa Köprüsü (üst kampanya)
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600">
        Bu kampanyayı bir üst kademeye bağlarsanız ek sayfa ücreti <strong>her ebat için ayrı</strong>{" "}
        hesaplanır: iki kampanyanın o ebattaki fiyat farkı, aradaki sayfa farkına bölünür. Müşteri
        sayfa ekleyerek üst kampanyanın fiyatına tam olarak ulaşır. Üst kampanyanın taban sayfası
        aşıldığında fiyatlama <strong>üst kampanyanın</strong> kendi ek sayfa ücretiyle devam eder.
      </p>

      {candidates.length === 0 ? (
        <p className="mt-2 text-[11px] text-neutral-500">
          Taban sayfa sayısı bundan büyük başka bir kampanya yok — önce üst kademeyi oluşturun.
        </p>
      ) : (
        <>
          <Select
            className="mt-2 h-9"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Üst kampanya"
          >
            <option value="">Köprü yok — sabit ek sayfa ücreti kullanılsın</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (taban {c.base_page_count} sayfa)
              </option>
            ))}
          </Select>
          {target && gap > 0 && (
            <p className="mt-1.5 text-[11px] text-emerald-800">
              {basePageCount + 1}. – {target.base_page_count}. sayfalar köprüden fiyatlanır: her ebat
              için (<strong>{target.name}</strong> fiyatı − bu kampanyanın fiyatı) ÷ {gap}.{" "}
              {target.base_page_count + 1}. sayfadan itibaren &quot;{target.name}&quot; kampanyasının ek
              sayfa ücreti geçerlidir.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PackageRow({
  pkg,
  tiers,
  packages,
}: {
  pkg: PackageType;
  tiers: PackagePagePrice[];
  packages: PackageType[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(pkg.name);
  const [basePageCount, setBasePageCount] = useState(pkg.base_page_count.toString());
  const [extraPagePrice, setExtraPagePrice] = useState(pkg.extra_page_price.toFixed(2));
  const [sortOrder, setSortOrder] = useState(pkg.sort_order);
  const [bridgeId, setBridgeId] = useState(pkg.bridge_package_type_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bridgeTarget = packages.find((p) => p.id === pkg.bridge_package_type_id) ?? null;

  function handleCancel() {
    setName(pkg.name);
    setBasePageCount(pkg.base_page_count.toString());
    setExtraPagePrice(pkg.extra_page_price.toFixed(2));
    setSortOrder(pkg.sort_order);
    setBridgeId(pkg.bridge_package_type_id ?? "");
    setError(null);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="space-y-2.5 rounded-md border border-neutral-300 p-3">
        <div>
          <Label htmlFor={`pkg-name-${pkg.id}`}>Paket / Kampanya Adı</Label>
          <Input id={`pkg-name-${pkg.id}`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`pkg-base-${pkg.id}`}>Taban Sayfa Sayısı</Label>
            <Input
              id={`pkg-base-${pkg.id}`}
              type="number"
              min={0}
              value={basePageCount}
              onChange={(e) => setBasePageCount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`pkg-extra-${pkg.id}`}>Ek Sayfa Ücreti</Label>
            <CurrencyInput
              id={`pkg-extra-${pkg.id}`}
              value={extraPagePrice}
              onChange={(e) => setExtraPagePrice(e.target.value)}
            />
          </div>
        </div>
        <BridgePicker
          pkg={pkg}
          packages={packages}
          value={bridgeId}
          onChange={setBridgeId}
          basePageCount={Number(basePageCount)}
        />
        <div className="w-28">
          <Label htmlFor={`pkg-sort-${pkg.id}`}>Sıra</Label>
          <Input
            id={`pkg-sort-${pkg.id}`}
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await updatePackageTypeAction(pkg.id, {
                  name,
                  basePageCount: Number(basePageCount),
                  extraPagePrice: Number(extraPagePrice),
                  sortOrder,
                  bridgePackageTypeId: bridgeId || null,
                });
                if (res.error) setError(res.error);
                else setIsEditing(false);
              })
            }
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button size="sm" variant="ghost" disabled={isPending} onClick={handleCancel}>
            Vazgeç
          </Button>
          <span className="ml-auto">
            <ConfirmDelete onConfirm={() => deletePackageTypeAction(pkg.id)} label="Sil" />
          </span>
        </div>
        <PagePriceTiers pkg={pkg} tiers={tiers} bridgeTarget={bridgeTarget} />
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        title="Düzenlemek veya silmek için tıklayın"
        className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-neutral-800">{pkg.name}</span>
          <span className="block text-xs text-neutral-500">
            Taban {pkg.base_page_count} sayfa · ek sayfa ₺{pkg.extra_page_price.toFixed(2)}
            {tiers.length > 0 && (
              <span className="ml-1 text-brand-700">· {tiers.length} sayfa kampanyası</span>
            )}
            {bridgeTarget && (
              <span className="ml-1 text-emerald-700">
                · ek sayfalar &quot;{bridgeTarget.name}&quot; ile köprülü
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

export function PackageManager({
  packages,
  pageTiers,
}: {
  packages: PackageType[];
  pageTiers: PackagePagePrice[];
}) {
  const [state, formAction, isPending] = useActionState(addPackageTypeAction, initial);
  const tiersByPackage = new Map<string, PackagePagePrice[]>();
  for (const t of pageTiers) {
    const list = tiersByPackage.get(t.package_type_id) ?? [];
    list.push(t);
    tiersByPackage.set(t.package_type_id, list);
  }

  return (
    <div className="space-y-3 border-t border-neutral-200 pt-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
          <Megaphone className="h-3.5 w-3.5 text-brand-600" />
          Paketleri / Kampanyaları Yönet
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Her paket, taban sayfa sayısını aştığında sayfa başına eklenecek ek ücreti tanımlar (ör.
          &quot;Eco Paket&quot; taban 5 sayfa, sayfa başı ek ₺200). Bir pakete tıklayarak
          düzenleyebilir veya silebilirsiniz; silinen paket fiyat matrisinden de kalkar. Geçmiş
          siparişlerde kullanılan paketler silinemez.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {packages.map((pkg) => (
          <PackageRow key={pkg.id} pkg={pkg} tiers={tiersByPackage.get(pkg.id) ?? []} packages={packages} />
        ))}
      </ul>

      <form action={formAction} className="space-y-2.5 rounded-md border border-neutral-200 p-3">
        <div>
          <Label htmlFor="new-pkg-name">Yeni Paket / Kampanya Adı</Label>
          <Input id="new-pkg-name" name="name" placeholder="Örn: Yaz Kampanyası" required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="new-pkg-base">Taban Sayfa Sayısı</Label>
            <Input id="new-pkg-base" name="base_page_count" type="number" min={0} defaultValue={5} required />
          </div>
          <div>
            <Label htmlFor="new-pkg-extra">Ek Sayfa Ücreti</Label>
            <CurrencyInput id="new-pkg-extra" name="extra_page_price" defaultValue="0.00" required />
          </div>
        </div>
        <div>
          <Label htmlFor="new-pkg-bridge">Ek Sayfa Köprüsü (opsiyonel)</Label>
          <Select id="new-pkg-bridge" name="bridge_package_type_id" defaultValue="">
            <option value="">Köprü yok — sabit ek sayfa ücreti</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (taban {p.base_page_count} sayfa)
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[11px] text-neutral-500">
            Seçerseniz ek sayfa ücreti sabit tutar yerine, iki kampanyanın her ebattaki fiyat
            farkından türetilir. Hedefin taban sayfa sayısı bu paketten büyük olmalıdır.
          </p>
        </div>
        <div className="w-28">
          <Label htmlFor="new-pkg-sort">Sıra</Label>
          <Input id="new-pkg-sort" name="sort_order" type="number" defaultValue={(packages.length + 1) * 10} />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          Paket Ekle
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
