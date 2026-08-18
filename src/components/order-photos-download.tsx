"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_PHOTOS_BUCKET, coverFolder, itemFolder } from "@/lib/storage";
import { buildZip, safeSegment } from "@/lib/archive";

export interface DownloadableItem {
  id: string;
  itemType: "album" | "extra";
  /** Çok kalemli siparişlerde dosya adına eklenecek kısa etiket (ör. "30x50-Safir"). */
  label: string;
}

/**
 * Bir siparişin TÜM fotoğraflarını tek ZIP olarak indirir.
 *
 * Arşivin içinde sipariş numarasıyla adlandırılmış tek bir klasör bulunur; dosyalar da
 * bu klasörün içinde düz durur (alt klasör yok), böylece baskıya hazırlarken tek
 * pencerede hepsi görünür. Tek kalemli siparişlerde dosya adları olduğu gibi kalır;
 * birden çok kalem varsa her dosyanın başına kalem sırası eklenir ki karışmasın.
 */
export function OrderPhotosDownload({
  companyId,
  orderNo,
  items,
}: {
  companyId: string;
  orderNo: string;
  items: DownloadableItem[];
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function listFolder(folder: string) {
    const { data } = await supabase.storage
      .from(ORDER_PHOTOS_BUCKET)
      .list(folder, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    return (data ?? []).filter((f) => f.id !== null).map((f) => `${folder}/${f.name}`);
  }

  async function handleDownload() {
    setBusy(true);
    setStatus("Dosyalar listeleniyor...");
    try {
      const root = safeSegment(orderNo);
      const multi = items.length > 1;

      // 1) Tüm kalemlerin dosya yollarını topla.
      const planned: { path: string; zipName: string }[] = [];
      for (const [index, item] of items.entries()) {
        const prefix = multi ? `${String(index + 1).padStart(2, "0")}-${safeSegment(item.label)}-` : "";
        if (item.itemType === "album") {
          for (const path of await listFolder(coverFolder(companyId, item.id))) {
            const name = path.split("/").pop()!.replace(/^[0-9a-f-]{36}-/i, "");
            planned.push({ path, zipName: `${prefix}kapak-${name}` });
          }
        }
        for (const path of await listFolder(itemFolder(companyId, item.id))) {
          const name = path.split("/").pop()!.replace(/^[0-9a-f-]{36}-/i, "");
          planned.push({ path, zipName: `${prefix}${name}` });
        }
      }

      if (planned.length === 0) {
        setStatus("Bu siparişte indirilecek fotoğraf yok.");
        return;
      }

      // 2) İndir. Aynı ada sahip dosyalar birbirini ezmesin diye sayaç eklenir.
      const used = new Set<string>();
      const entries: { path: string; blob: Blob }[] = [];
      for (const [i, plan] of planned.entries()) {
        setStatus(`İndiriliyor: ${i + 1} / ${planned.length}`);
        const { data } = await supabase.storage.from(ORDER_PHOTOS_BUCKET).download(plan.path);
        if (!data) continue;
        let name = plan.zipName;
        if (used.has(name)) {
          const dot = name.lastIndexOf(".");
          const stem = dot > 0 ? name.slice(0, dot) : name;
          const ext = dot > 0 ? name.slice(dot) : "";
          let n = 2;
          while (used.has(`${stem}-${n}${ext}`)) n++;
          name = `${stem}-${n}${ext}`;
        }
        used.add(name);
        entries.push({ path: `${root}/${name}`, blob: data });
      }

      setStatus("ZIP hazırlanıyor...");
      const zip = await buildZip(entries);
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${root}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(`${entries.length} dosya indirildi.`);
    } catch {
      setStatus("ZIP oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {busy ? "Hazırlanıyor..." : `Tüm Fotoğrafları İndir (${orderNo}.zip)`}
      </button>
      {status && <span className="text-xs text-neutral-500">{status}</span>}
    </div>
  );
}
