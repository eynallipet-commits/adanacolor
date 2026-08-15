import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AlbumColor } from "@/lib/database.types";

/** Kumaş rengi örneği: yüklenmiş bir doku görseli varsa onu, yoksa düz hex rengi gösterir. */
export function ColorSwatch({
  color,
  className,
  sizes = "96px",
  quality = 90,
}: {
  color: Pick<AlbumColor, "code" | "name" | "hex" | "image_url">;
  className?: string;
  /** Görselin gerçek yerleşim genişliğine göre ayarlayın — küçük bırakılırsa bulanık çıkar. */
  sizes?: string;
  quality?: number;
}) {
  return (
    <span
      className={cn("relative block overflow-hidden rounded border border-neutral-200 bg-neutral-100", className)}
      style={color.image_url ? undefined : { backgroundColor: color.hex ?? "#e5e5e5" }}
      title={color.name ? `${color.code} · ${color.name}` : color.code}
    >
      {color.image_url && (
        <Image src={color.image_url} alt={color.code} fill sizes={sizes} quality={quality} className="object-cover" />
      )}
    </span>
  );
}

export function colorLabel(color: Pick<AlbumColor, "code" | "name">) {
  return color.name ? `${color.code} · ${color.name}` : color.code;
}
