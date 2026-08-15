"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileDrawer({
  header,
  children,
  variant = "light",
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  variant?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg md:hidden",
          variant === "dark" ? "text-white hover:bg-white/10" : "text-neutral-700 hover:bg-neutral-100"
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto p-4 shadow-2xl",
              variant === "dark" ? "bg-neutral-900 text-white" : "bg-white"
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              {header}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  variant === "dark" ? "hover:bg-white/10" : "hover:bg-neutral-100"
                )}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
