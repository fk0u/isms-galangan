import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { FEATURES } from "@/data/content";

export function Features() {
  return (
    <Section
      id="fitur"
      eyebrow="Fitur"
      title="Fokus ke yang benar-benar dipakai."
      description="Tanpa fitur tempelan. Empat hal inti untuk alur pesan sampai bayar."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <li key={f.id}>
            <Reveal delay={i * 0.06} className="h-full">
              <article className="glass group h-full rounded-3xl p-6 transition-[border-color,transform,background-color] duration-300 hover:border-ember-400/30 hover:bg-white/[0.06] motion-safe:hover:-translate-y-1">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-ember-400/15 text-ember-300 transition-transform duration-300 motion-safe:group-hover:scale-110">
                  <Icon name={f.icon} className="size-6" />
                </span>
                <h3 className="font-display text-xl font-bold text-sand-50">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-sand-400">{f.body}</p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
