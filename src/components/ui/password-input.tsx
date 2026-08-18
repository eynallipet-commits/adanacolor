"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Şifre alanı — sağdaki göz ikonuyla yazılanı görünür kılar.
 * `Input` ile aynı props'ları alır; `type` bilerek dışarı açılmaz.
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
