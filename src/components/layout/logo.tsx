import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_ASPECT = 890 / 190;

export function Logo({ height = 32, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Adana Color Photography Album"
      width={Math.round(height * LOGO_ASPECT)}
      height={height}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );
}
