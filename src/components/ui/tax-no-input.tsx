"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Vergi No / TC Kimlik No alanı: yalnızca rakam kabul eder, en fazla 11 hane (TC kimlik no
 * uzunluğu — vergi kimlik no 10 hane, şahıs firmaları TC ile 11 hane kullanabiliyor).
 */
export const TaxNoInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TaxNoInput({ className, name, defaultValue, onChange, ...props }, ref) {
    const [value, setValue] = useState(() => String(defaultValue ?? "").replace(/\D/g, "").slice(0, 11));

    return (
      <>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={11}
          placeholder="10 veya 11 haneli"
          {...props}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
            setValue(digits);
            onChange?.(e);
          }}
          className={cn(
            "w-full rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            className
          )}
        />
        {name && <input type="hidden" name={name} value={value} />}
      </>
    );
  }
);
