"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function formatTrPhone(digits: string) {
  const d = digits.slice(0, 11); // 0 + 10 hane
  const parts = [d.slice(0, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean);
  return parts.join(" ");
}

/**
 * Türkiye telefon formatı: yazarken otomatik "0XXX XXX XX XX" şekline sokar, 11 haneden
 * (0 + 10 rakam) fazlasını kabul etmez. Uncontrolled form kullanımı için `name` prop'u ile
 * FormData'ya gönderilecek gizli bir input de tutar.
 */
export const PhoneInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PhoneInput({ className, name, defaultValue, onChange, ...props }, ref) {
    const [display, setDisplay] = useState(() => formatTrPhone(String(defaultValue ?? "").replace(/\D/g, "")));

    return (
      <>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="0532 123 45 67"
          {...props}
          value={display}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            const formatted = formatTrPhone(digits);
            setDisplay(formatted);
            onChange?.(e);
          }}
          className={cn(
            "w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            className
          )}
        />
        {name && <input type="hidden" name={name} value={display.replace(/\D/g, "")} />}
      </>
    );
  }
);
