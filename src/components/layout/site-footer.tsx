import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ExternalLink, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { COMPANY, formatAddress, mapsEmbedUrl, mapsDirectionsUrl } from "@/lib/company";

function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-ink-300">
      <span className="mt-0.5 shrink-0 text-gold-400">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function SiteFooter() {
  const address = formatAddress();

  return (
    <footer className="border-t border-white/10 bg-ink-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Hakkımızda */}
          <div className="md:col-span-4">
            <span className="inline-flex items-center rounded-md bg-white px-3 py-2">
              <Logo height={26} />
            </span>
            <p className="mt-4 text-sm leading-relaxed text-ink-300">
              {COMPANY.legalName}, fotoğrafçılar ve fotoğraf stüdyoları için albüm, canvas ve baskı
              üretimi yapan bir atölyedir. Siparişten üretime, kargodan teslimata kadar tüm süreci
              tek panelden şeffaf şekilde yürütüyoruz.
            </p>
            <a
              href={COMPANY.instagram}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
            >
              <InstagramIcon className="h-4 w-4" />
              @adanacoloralbum
            </a>
          </div>

          {/* Hızlı bağlantılar */}
          <nav className="md:col-span-2">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Kurumsal</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-300">
              <li>
                <Link href="/#hakkimizda" className="transition-colors hover:text-white">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/#urunler" className="transition-colors hover:text-white">
                  Ürünlerimiz
                </Link>
              </li>
              <li>
                <Link href="/#surec" className="transition-colors hover:text-white">
                  Çalışma Sürecimiz
                </Link>
              </li>
              <li>
                <Link href="/#iletisim" className="transition-colors hover:text-white">
                  İletişim
                </Link>
              </li>
              <li>
                <Link href="/basvuru" className="transition-colors hover:text-white">
                  Üyelik Başvurusu
                </Link>
              </li>
              <li>
                <Link href="/giris" className="transition-colors hover:text-white">
                  Bayi Girişi
                </Link>
              </li>
            </ul>
          </nav>

          {/* İletişim */}
          <div className="md:col-span-3" id="iletisim">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">İletişim</h3>
            <ul className="mt-4 space-y-3">
              {address && (
                <ContactRow icon={<MapPin className="h-4 w-4" />}>
                  {address}
                  <a
                    href={mapsDirectionsUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-gold-400 hover:underline"
                  >
                    Yol tarifi al <ExternalLink className="h-3 w-3" />
                  </a>
                </ContactRow>
              )}
              {COMPANY.phone && (
                <ContactRow icon={<Phone className="h-4 w-4" />}>
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="hover:text-white">
                    {COMPANY.phone}
                  </a>
                </ContactRow>
              )}
              {COMPANY.email && (
                <ContactRow icon={<Mail className="h-4 w-4" />}>
                  <a href={`mailto:${COMPANY.email}`} className="break-all hover:text-white">
                    {COMPANY.email}
                  </a>
                </ContactRow>
              )}
              {COMPANY.workingHours.length > 0 && (
                <ContactRow icon={<Clock className="h-4 w-4" />}>
                  {COMPANY.workingHours.map((h) => (
                    <span key={h} className="block">
                      {h}
                    </span>
                  ))}
                </ContactRow>
              )}
            </ul>
          </div>

          {/* Harita */}
          <div className="md:col-span-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">Konum</h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <iframe
                src={mapsEmbedUrl()}
                title={`${COMPANY.legalName} konumu`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-48 w-full border-0 grayscale-[0.25]"
              />
            </div>
          </div>
        </div>

        {/* Alt bant */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {COMPANY.legalName}. Tüm hakları saklıdır.
            {COMPANY.taxOffice && COMPANY.taxNumber && (
              <span className="ml-2">
                {COMPANY.taxOffice} V.D. — {COMPANY.taxNumber}
              </span>
            )}
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
            Kişisel verileriniz KVKK kapsamında korunur.
          </p>
        </div>
      </div>
    </footer>
  );
}
