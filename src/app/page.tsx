import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  PercentCircle,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  ShoppingBag,
  PackageCheck,
  Layers,
  Palette,
  Ruler,
  Factory,
  Headset,
  FileCheck2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { InstagramSection } from "@/components/instagram-section";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";
import type { AlbumModel } from "@/lib/database.types";

const steps = [
  {
    icon: UserPlus,
    title: "Üyelik Başvurusu",
    desc: "Firma bilgileriniz ve vergi levhanızla başvurun; ekibimiz kısa sürede değerlendirsin.",
  },
  {
    icon: CheckCircle2,
    title: "Cari Hesabınız Açılsın",
    desc: "Onay sonrası firmanıza özel iskonto oranınızla panelinize giriş yapın.",
  },
  {
    icon: ShoppingBag,
    title: "Siparişinizi Oluşturun",
    desc: "Ebat, paket, kapak modeli ve rengi seçin; fotoğraflarınızı yükleyip ödemeyi tamamlayın.",
  },
  {
    icon: PackageCheck,
    title: "Üretim ve Kargo",
    desc: "Siparişinizin üretim ve kargo durumunu panelinizden adım adım takip edin.",
  },
];

const values = [
  {
    icon: Factory,
    title: "Kendi Atölyemizde Üretim",
    desc: "Albüm, canvas ve baskı üretimi kendi atölyemizde yapılır; kalite kontrolü bize aittir.",
  },
  {
    icon: PercentCircle,
    title: "Cariye Özel Fiyatlandırma",
    desc: "Firmanıza tanımlanan iskonto oranı tüm siparişlerinize otomatik olarak yansır.",
  },
  {
    icon: ShieldCheck,
    title: "Peşin ve Güvenli Ödeme",
    desc: "Kredi kartı veya havale ile ödeme; onay alınmadan üretime başlanmaz, sürpriz maliyet çıkmaz.",
  },
  {
    icon: Truck,
    title: "Şeffaf Kargo Takibi",
    desc: "Kargo firması ve takip numarası panelinize işlenir, siparişinizin nerede olduğunu bilirsiniz.",
  },
  {
    icon: FileCheck2,
    title: "Belgeli Süreç",
    desc: "Her sipariş için yazdırılabilir sipariş belgesi; muhasebenizle uyumlu, kayıt altında çalışma.",
  },
  {
    icon: Headset,
    title: "Doğrudan İletişim",
    desc: "Aracı yok. Üretimi yapan ekiple doğrudan görüşür, özel taleplerinizi net şekilde iletirsiniz.",
  },
];

export default async function Home() {
  // Katalog sayıları ve vitrin modelleri: RLS nedeniyle anonim kullanıcı okuyamadığı için
  // yalnızca sunucuda, service-role ile okunuyor (dışarı sadece sayı ve görsel çıkıyor).
  const supabase = createAdminClient();
  const [modelsRes, sizesRes, colorsRes, packagesRes, showcaseRes] = await Promise.all([
    supabase.from("album_models").select("*", { count: "exact", head: true }).is("company_id", null).eq("active", true),
    supabase.from("album_sizes").select("*", { count: "exact", head: true }),
    supabase.from("album_colors").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("package_types").select("*", { count: "exact", head: true }),
    supabase
      .from("album_models")
      .select("*")
      .is("company_id", null)
      .eq("active", true)
      .not("image_url", "is", null)
      .order("sort_order")
      .limit(6)
      .returns<AlbumModel[]>(),
  ]);

  const stats = [
    { icon: Layers, value: modelsRes.count ?? 0, label: "Kapak Modeli" },
    { icon: Palette, value: colorsRes.count ?? 0, label: "Kumaş Rengi" },
    { icon: Ruler, value: sizesRes.count ?? 0, label: "Albüm Ebadı" },
    { icon: ShoppingBag, value: packagesRes.count ?? 0, label: "Paket Seçeneği" },
  ];
  const showcase = showcaseRes.data ?? [];

  return (
    <main className="flex-1 bg-white">
      {/* ÜST BAR */}
      <div className="hidden bg-ink-950 py-2 text-xs text-ink-300 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <span>{COMPANY.tagline}</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
            Kurumsal bayilik sistemi — yalnızca firmalara özel
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo height={34} />
          <nav className="flex items-center gap-1 sm:gap-5">
            <Link href="#hakkimizda" className="hidden text-sm font-medium text-neutral-600 hover:text-ink-900 lg:inline">
              Hakkımızda
            </Link>
            <Link href="#urunler" className="hidden text-sm font-medium text-neutral-600 hover:text-ink-900 lg:inline">
              Ürünler
            </Link>
            <Link href="#surec" className="hidden text-sm font-medium text-neutral-600 hover:text-ink-900 lg:inline">
              Süreç
            </Link>
            <Link href="#iletisim" className="hidden text-sm font-medium text-neutral-600 hover:text-ink-900 lg:inline">
              İletişim
            </Link>
            <Link
              href="/basvuru"
              className="hidden text-sm font-medium text-neutral-600 hover:text-ink-900 sm:inline lg:ml-2"
            >
              Üyelik Başvurusu
            </Link>
            <Link href="/giris" className={cn(buttonVariants({ size: "sm" }))}>
              Bayi Girişi
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.15]" />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-brand-600), transparent 65%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-6">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              <span className="h-px w-8 bg-gold-400" />
              {COMPANY.city} · Albüm Atölyesi
            </p>
            <h1 className="font-display mt-6 text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Fotoğraflarınıza
              <br />
              yakışan <span className="text-gold-400">üretim</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              {COMPANY.legalName} olarak fotoğrafçılar ve stüdyolar için albüm, canvas ve baskı
              üretiyoruz. Siparişten teslimata kadar her adımı tek panelden şeffaf şekilde yönetin.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/basvuru" className={cn(buttonVariants({ size: "lg" }), "group")}>
                Bayilik Başvurusu Yap
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/giris"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/25 bg-transparent text-white hover:bg-white/10"
                )}
              >
                Bayi Girişi
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            {showcase.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  {showcase.slice(0, 2).map((m) => (
                    <div
                      key={m.id}
                      className="relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10 shadow-2xl"
                    >
                      <Image
                        src={m.image_url!}
                        alt={`${m.name} albüm modeli`}
                        fill
                        sizes="(min-width: 1024px) 280px, 45vw"
                        quality={90}
                        className="object-cover"
                        priority
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-8">
                  {showcase.slice(2, 4).map((m) => (
                    <div
                      key={m.id}
                      className="relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10 shadow-2xl"
                    >
                      <Image
                        src={m.image_url!}
                        alt={`${m.name} albüm modeli`}
                        fill
                        sizes="(min-width: 1024px) 280px, 45vw"
                        quality={90}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* İSTATİSTİK ŞERİDİ */}
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-white/10 px-4 sm:px-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-2 py-6 sm:px-6">
                <s.icon className="h-5 w-5 shrink-0 text-gold-400" />
                <div>
                  <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-ink-300">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HAKKIMIZDA */}
      <section id="hakkimizda" className="scroll-mt-20 border-b border-neutral-200 bg-white py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              <span className="h-px w-8 bg-brand-600" />
              Hakkımızda
            </p>
            <h2 className="font-display mt-5 text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
              Fotoğrafçının işini kolaylaştıran bir üretim ortağı
            </h2>
            <div className="mt-6 space-y-4 text-neutral-600">
              <p>
                {COMPANY.city}&apos;da faaliyet gösteren atölyemizde, fotoğrafçılar ve fotoğraf
                stüdyoları için albüm, canvas ve fotoğraf baskısı üretiyoruz. İşimizin merkezinde tek
                bir şey var: fotoğrafçının müşterisine gururla teslim edebileceği bir ürün çıkarmak.
              </p>
              <p>
                Bu platformu, telefonda ve mesajlaşma uygulamalarında kaybolan sipariş trafiğini
                düzene sokmak için kurduk. Artık hangi modelin hangi ebatta ve hangi renkte
                üretilebildiğini görerek sipariş veriyor, ödeme ve üretim durumunu anlık takip
                ediyorsunuz.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Kendi atölyemizde üretim",
                "Cariye özel iskonto",
                "Kayıt altında, belgeli süreç",
                "Anlık üretim ve kargo takibi",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm font-medium text-ink-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {showcase.length > 4 && (
            <div className="relative">
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-xl ring-1 ring-ink-900/10">
                <Image
                  src={showcase[4].image_url!}
                  alt={`${showcase[4].name} albüm modeli`}
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  quality={90}
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-xl sm:block">
                <p className="font-display text-3xl font-bold text-brand-600">{modelsRes.count ?? 0}</p>
                <p className="text-xs text-neutral-500">
                  farklı kapak modeli
                  <br />
                  2026-2027 kataloğunda
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ÜRÜNLER / KATALOG */}
      <section id="urunler" className="scroll-mt-20 border-b border-neutral-200 bg-ink-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Ürünlerimiz</p>
            <h2 className="font-display mt-4 text-3xl font-bold text-ink-900 sm:text-4xl">
              2026-2027 Albüm Kataloğu
            </h2>
            <p className="mt-4 text-neutral-600">
              {modelsRes.count ?? 0} kapak modeli, {sizesRes.count ?? 0} farklı ebat ve{" "}
              {colorsRes.count ?? 0} kumaş rengi. Her modelin hangi ebatlarda ve hangi renklerde
              üretilebildiğini panelinizde görürsünüz.
            </p>
          </div>

          {showcase.length > 0 && (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((m) => (
                <div
                  key={m.id}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-900/5 transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[3/2] w-full overflow-hidden bg-neutral-100">
                    <Image
                      src={m.image_url!}
                      alt={`${m.name} albüm kapak modeli`}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
                      quality={90}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="font-display text-base font-semibold text-ink-900">{m.name}</p>
                    <span className="text-xs text-neutral-400">Kapak Modeli</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <p className="text-sm text-neutral-600">
              Kataloğun tamamını ve fiyat listesini görmek için bayi hesabınıza giriş yapın.
            </p>
            <Link href="/giris" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
              Bayi Girişi
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SÜREÇ */}
      <section id="surec" className="scroll-mt-20 border-b border-neutral-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Çalışma Sürecimiz</p>
            <h2 className="font-display mt-4 text-3xl font-bold text-ink-900 sm:text-4xl">
              Başvurudan teslimata dört adım
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-4xl font-bold text-ink-100">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEDEN BİZ */}
      <section className="border-b border-neutral-200 bg-ink-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Neden Adana Color</p>
            <h2 className="font-display mt-4 text-3xl font-bold text-ink-900 sm:text-4xl">
              Kurumsal çalışan firmalar için
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-neutral-200/80 bg-white p-6 transition-colors hover:border-brand-200"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InstagramSection />

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink-900">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <h2 className="font-display max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Fotoğraf firmanız için bayi hesabınızı bugün açın
          </h2>
          <p className="max-w-xl text-ink-300">
            Başvurunuzu firma bilgileriniz ve vergi levhanızla iletin; onay sonrası size özel iskonto
            oranınızla sipariş vermeye başlayın.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/basvuru" className={cn(buttonVariants({ size: "lg" }))}>
              Bayilik Başvurusu Yap
            </Link>
            <Link
              href="/giris"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/25 bg-transparent text-white hover:bg-white/10"
              )}
            >
              Bayi Girişi
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
