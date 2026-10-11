import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { isPlaceholder, siteConfig } from "@/config/site";

export function About() {
  const { creator } = siteConfig;
  const hasPortfolio = !isPlaceholder(creator.portfolioUrl);

  return (
    <Section id="tentang" eyebrow="Tentang pembuat" title="Dibuat di Samarinda.">
      <Reveal>
        <article className="glass mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
          <span
            aria-hidden="true"
            className="grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-ember-300 to-ember-500 font-display text-3xl font-extrabold text-ink-950"
          >
            {creator.name.charAt(0)}
          </span>
          <div>
            <h3 className="font-display text-2xl font-bold text-sand-50">{creator.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-sand-400">
              <Icon name="pin" className="size-4" /> {creator.city}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-ember-400/10 px-3 py-1.5 text-sm font-semibold text-ember-200 ring-1 ring-ember-400/30">
              <Icon name="trophy" className="size-4" /> {creator.achievement}
            </p>
            <p className="mt-4 leading-relaxed text-sand-200">
              Kou Restaurant System dirancang dan dibangun oleh {creator.name}. Saat kamu menghubungi lewat WhatsApp,
              kamu bicara langsung dengan pembuatnya — jadi pertanyaan teknis bisa dijawab apa adanya.
            </p>
            {hasPortfolio && (
              <ButtonLink href={creator.portfolioUrl} external variant="ghost" className="-ml-3 mt-3">
                Lihat portofolio <Icon name="external" className="size-4" />
              </ButtonLink>
            )}
          </div>
        </article>
      </Reveal>
    </Section>
  );
}
