"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Model, renk kartelası veya ekstra ürün görselini büyük ve net gösteren ortak önizleme. */
export function ImagePreviewModal({
  imageUrl,
  alt,
  title,
  subtitle,
  actionLabel,
  onAction,
  onClose,
}: {
  imageUrl: string;
  alt: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} önizleme`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[3/2] w-full bg-neutral-50">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            quality={95}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-neutral-900">{title}</p>
            {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
          </div>
          {actionLabel && onAction && (
            <Button type="button" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
