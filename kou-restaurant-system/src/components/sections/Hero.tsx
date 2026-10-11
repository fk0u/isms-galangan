import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { HeroVisual } from "./HeroVisual";

const HIGHLIGHTS = ["PWA mobile-first", "Denah meja visual", "Bayar QRIS"] as const;

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden pb-20 pt-12 sm:pt-20 lg:pb-28">
      {/* Latar: gradien hangat statis (tanpa gambar → tanpa biaya LCP) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(60%_50%_at_80%_10%,rgb(242_118_44/0.18),transparent_70%),radial-gradient(40%_40%_at_0%_60%,rgb(255_178_122/0.08),transparent_70%)]"
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-sand-200">
            <span className="size-1.5 rounded-full bg-ember-400" aria-hidden="true" />
            Sistem pemesanan restoran berbasis PWA
          </p>
          {/* H1 tidak dianimasikan masuk supaya LCP tidak tertunda */}
          <h1
            id="hero-heading"
            className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-balance text-sand-50 sm:text-6xl"
          >
            Pelanggan antre di kasir, pesanan <span className="text-ember-400">salah catat</span>? Saatnya mereka pesan dari meja.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-sand-400">
            Pelanggan scan QR di meja, pilih menu dan meja dari denah, lalu bayar pakai QRIS — semua dari HP mereka sendiri.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#demo" size="lg">
              Coba demo <Icon name="arrowRight" className="size-5" />
            </ButtonLink>
            <ButtonLink href={buildWhatsAppUrl()} external variant="secondary" size="lg">
              <Icon name="chat" className="size-5" /> Tanya via WhatsApp
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-sand-400" aria-label="Fitur utama">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-1.5">
                <Icon name="check" className="size-4 text-ember-300" strokeWidth={2.5} />
                {h}
              </li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
