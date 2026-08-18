"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn, formatTL } from "@/lib/utils";

export interface PageCountOption {
  pages: number;
  /** Bu sayfa sayısındaki birim albüm fiyatı. */
  unitPrice: number;
  /** Taban sayfanın üzerine binen toplam ek ücret (0 = ek ücret yok). */
  extraTotal: number;
}

/**
 * Sayfa sayısı seçici.
 *
 * Serbest sayı girişi yerine açılır liste: fotoğrafçı her sayfa seçeneğinin ek ücretini ve
 * o sayfadaki toplam albüm fiyatını yan yana görüp karar verir. Kampanya köprüsü sayesinde
 * ek ücret ebada göre değiştiği için bu liste her ebatta farklı çıkar.
 */
export function PageCountPicker({
  value,
  options,
  onChange,
  disabled,
}: {
  value: number;
  options: PageCountOption[];
  onChange: (pages: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Dışarı tıklayınca ve Esc ile kapansın.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Açılırken seçili satır görünür olsun.
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: "center" });
  }, [open]);

  const current = options.find((o) => o.pages === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-left text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-neutral-400"
        )}
      >
        <span className="min-w-0 truncate">
          <span className="font-medium">{value} sayfa</span>
          {current && current.extraTotal > 0 && (
            <span className="ml-1.5 text-xs text-emerald-700">+{formatTL(current.extraTotal)}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-1 w-full min-w-[19rem] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] font-medium text-neutral-500">
            <span>Sayfa</span>
            <span>Ek ücret · Albüm fiyatı</span>
          </div>
          <ul ref={listRef} role="listbox" className="max-h-72 overflow-y-auto">
            {options.map((o) => {
              const selected = o.pages === value;
              return (
                <li key={o.pages}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-selected={selected}
                    onClick={() => {
                      onChange(o.pages);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                      selected ? "bg-brand-50 text-brand-800" : "hover:bg-neutral-50"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {selected ? (
                        <Check className="h-3.5 w-3.5 text-brand-600" />
                      ) : (
                        <span className="h-3.5 w-3.5" />
                      )}
                      <span className={cn("whitespace-nowrap tabular-nums", selected && "font-semibold")}>
                        {o.pages} sayfa
                      </span>
                    </span>
                    <span className="flex items-baseline gap-2 text-right">
                      <span
                        className={cn(
                          "whitespace-nowrap text-xs tabular-nums",
                          o.extraTotal > 0 ? "text-emerald-700" : "text-neutral-400"
                        )}
                      >
                        {o.extraTotal > 0 ? `+${formatTL(o.extraTotal)}` : "ek ücret yok"}
                      </span>
                      <span className="w-24 whitespace-nowrap text-sm font-medium tabular-nums text-neutral-900">
                        {formatTL(o.unitPrice)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
