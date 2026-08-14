import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, PercentCircle, Truck } from "lucide-react";

const points = [
  { icon: ShieldCheck, text: "Güvenli, peşin ödeme altyapısı" },
  { icon: PercentCircle, text: "Cariye özel iskonto oranları" },
  { icon: Truck, text: "Üretim ve kargo takibi tek panelde" },
];

export function AuthSplit({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-neutral-900 p-10 text-white lg:flex">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.07]" />
        <div className="relative">
          <Link href="/" className="font-display text-2xl font-bold">
            Adana <span className="text-brand-400">Color</span>
          </Link>
          <p className="mt-3 max-w-sm text-neutral-300">
            Fotoğrafçılar için B2B albüm, canvas ve baskı sipariş platformu.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-[4/3] w-full -rotate-1 overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl">
            <Image src="/albums/loft.jpg" alt="Örnek albüm" fill className="object-cover" />
          </div>
        </div>

        <ul className="relative space-y-3">
          {points.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm text-neutral-200">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                <p.icon className="h-4 w-4 text-brand-300" />
              </span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-16 lg:w-1/2">{children}</div>
    </main>
  );
}
