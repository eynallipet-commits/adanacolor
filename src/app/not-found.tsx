import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Compass className="h-8 w-8" />
      </span>
      <p className="font-display mt-6 text-6xl font-bold text-neutral-900">404</p>
      <h1 className="mt-2 text-xl font-semibold text-neutral-900">Sayfa bulunamadı</h1>
      <p className="mt-2 max-w-sm text-neutral-500">
        Aradığınız sayfa kaldırılmış, taşınmış ya da hiç var olmamış olabilir.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-8")}>
        Anasayfaya Dön
      </Link>
    </main>
  );
}
