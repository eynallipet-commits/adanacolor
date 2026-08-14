import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  PercentCircle,
  Clock,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  ShoppingBag,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const trustPoints = [
  { icon: ShieldCheck, text: "Güvenli, peşin ödeme" },
  { icon: PercentCircle, text: "Cariye özel iskonto" },
  { icon: Truck, text: "Canlı kargo takibi" },
];

const steps = [
  {
    icon: UserPlus,
    title: "Üyelik Başvurusu",
    desc: "Firma bilgilerinizle başvurun, ekibimiz kısa sürede değerlendirsin.",
  },
  {
    icon: CheckCircle2,
    title: "Hesabınız Onaylansın",
    desc: "Onay sonrası size özel iskonto oranınızla panelinize giriş yapın.",
  },
  {
    icon: ShoppingBag,
    title: "Sipariş Verin",
    desc: "Ebat, paket, kapak modeli seçin; kredi kartı veya havale ile ödeyin.",
  },
  {
    icon: PackageCheck,
    title: "Üretim & Kargo Takibi",
    desc: "Siparişinizin üretim ve kargo durumunu anlık olarak panelden izleyin.",
  },
];

const features = [
  {
    title: "Kolay Sipariş",
    desc: "Ebat, paket, sayfa sayısı ve kapak modelini seçip saniyeler içinde sipariş oluşturun.",
    icon: ShoppingBag,
  },
  {
    title: "Anlık Takip",
    desc: "Siparişinizin üretim ve kargo durumunu panelinizden anlık olarak izleyin.",
    icon: Truck,
  },
  {
    title: "Özel İskonto",
    desc: "Firmanıza özel tanımlanan iskonto oranı tüm siparişlerinize otomatik yansır.",
    icon: PercentCircle,
  },
  {
    title: "Güvenli Ödeme",
    desc: "Kredi kartı veya havale ile peşin ödeme, üretime güvenle başlıyoruz.",
    icon: ShieldCheck,
  },
];

const albumModels = [
  { name: "Safir", image: "/albums/safir.jpg" },
  { name: "Punto", image: "/albums/punto.jpg" },
  { name: "Golden", image: "/albums/golden.jpg" },
  { name: "Carbon", image: "/albums/carbon.jpg" },
  { name: "Loft", image: "/albums/loft.jpg" },
];

export default function Home() {
  return (
    <main className="flex-1 bg-white">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-display text-xl font-bold tracking-tight text-neutral-900">
            Adana <span className="text-brand-600">Color</span>
          </span>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/basvuru"
              className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline"
            >
              Üyelik Başvurusu
            </Link>
            <Link href="/giris" className={cn(buttonVariants({ size: "sm" }))}>
              Giriş Yap
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-neutral-50">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              B2B Fotoğrafçı Platformu
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
              Albümleriniz için
              <br />
              <span className="text-brand-600">güvenilir</span> üretim ortağınız
            </h1>
            <p className="mt-5 max-w-xl text-lg text-neutral-600">
              Adana Color atölyesinin toptan albüm, canvas ve baskı ürünlerini online sipariş edin;
              üretim ve kargo sürecini tek panelden, baştan sona şeffaf şekilde takip edin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/basvuru" className={cn(buttonVariants({ size: "lg" }), "group")}>
                Üyelik Başvurusu Yap
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/giris" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
                Panelime Giriş Yap
              </Link>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {trustPoints.map((t) => (
                <div key={t.text} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <t.icon className="h-4.5 w-4.5 text-brand-600" />
                  {t.text}
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xs rotate-2 overflow-hidden rounded-2xl border-4 border-white shadow-2xl ring-1 ring-neutral-900/5 sm:max-w-sm">
              <Image src="/albums/carbon.jpg" alt="Örnek albüm kapağı" fill className="object-cover" priority />
            </div>
            <div className="absolute -left-4 top-8 aspect-[4/5] w-32 -rotate-6 overflow-hidden rounded-xl border-4 border-white shadow-xl ring-1 ring-neutral-900/5 sm:-left-8 sm:w-40">
              <Image src="/albums/safir.jpg" alt="Örnek albüm kapağı" fill className="object-cover" />
            </div>
            <div className="absolute -bottom-6 right-0 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-neutral-900/5 sm:right-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Truck className="h-4 w-4" />
              </span>
              <div className="text-xs">
                <p className="font-semibold text-neutral-900">Kargoda</p>
                <p className="text-neutral-500">AC202600001</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="border-t border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-neutral-900">Nasıl Çalışır?</h2>
            <p className="mt-3 text-neutral-600">Başvurudan kargoya, dört basit adım.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-semibold text-brand-600">Adım {i + 1}</p>
                <h3 className="mt-1 text-base font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALBÜM MODELLERİ */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-neutral-900">Örnek Albüm Modelleri</h2>
            <p className="mt-3 text-neutral-600">
              Panelinizde bu modellerle ve firmanıza özel eklenen tasarımlarla sipariş oluşturabilirsiniz.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {albumModels.map((m) => (
              <div key={m.name} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-sm ring-1 ring-neutral-900/5">
                  <Image
                    src={m.image}
                    alt={`${m.name} albüm modeli`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-center text-sm font-medium text-neutral-700">{m.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section className="border-t border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-neutral-200">
                <CardHeader>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="mt-3">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 bg-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand-300">
            <Clock className="h-4 w-4" /> Başvurular hızlıca değerlendirilir
          </div>
          <h2 className="font-display max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Fotoğraf firmanız için B2B hesabınızı bugün oluşturun
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/basvuru" className={cn(buttonVariants({ size: "lg" }))}>
              Üyelik Başvurusu Yap
            </Link>
            <Link
              href="/giris"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/20 bg-transparent text-white hover:bg-white/10")}
            >
              Panelime Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-neutral-500 sm:flex-row sm:px-6">
          <span className="font-display text-base font-semibold text-neutral-900">
            Adana <span className="text-brand-600">Color</span>
          </span>
          <p>© {new Date().getFullYear()} Adana Color Foto Albüm. Tüm hakları saklıdır.</p>
          <div className="flex gap-4">
            <Link href="/basvuru" className="hover:text-neutral-900">
              Üyelik Başvurusu
            </Link>
            <Link href="/giris" className="hover:text-neutral-900">
              Giriş Yap
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
