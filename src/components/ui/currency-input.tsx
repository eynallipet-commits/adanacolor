import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * TL tutarı girişi: adet seçen bir spinner gibi görünmesin, virgüllü/kuruşlu
 * değerler (ör. 1000.00) rahatça girilebilsin diye — sanal pos entegrasyonu
 * kuruş hassasiyeti gerektirecek.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function CurrencyInput({ className, ...props }, ref) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
          ₺
        </span>
        <input
          ref={ref}
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          {...props}
          className={cn(
            "currency-input w-full rounded-md border border-neutral-200 bg-white py-1.5 pl-6 pr-2 text-right text-sm transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            className
          )}
        />
      </div>
    );
  }
);
