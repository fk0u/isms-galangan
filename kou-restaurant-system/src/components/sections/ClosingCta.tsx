import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function ClosingCta() {
  return (
    <section id="kontak" aria-labelledby="kontak-heading" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-ember-400/20 bg-gradient-to-br from-ember-950 via-ink-900 to-ink-950 px-6 py-14 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-ember-500/25 blur-[100px]"
          />
          <h2 id="kontak-heading" className="relative font-display text-3xl font-extrabold leading-tight text-balance text-sand-50 sm:text-5xl">
            Siap berhenti nyatet pesanan manual?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-pretty text-sand-200">
            Ceritakan kafe atau restoranmu. Kita bahas apakah {siteConfig.name} cocok untuk alur pesanan di tempatmu.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={buildWhatsAppUrl()} external size="lg">
              <Icon name="chat" className="size-5" /> Chat via WhatsApp
            </ButtonLink>
            <ButtonLink href="#demo" variant="secondary" size="lg">
              Coba demo dulu
            </ButtonLink>
          </div>
          <p className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-ember-200">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-ember-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-ember-400" />
            </span>
            Slot pengerjaan terbatas
          </p>
        </div>
      </Reveal>
    </section>
  );
}
