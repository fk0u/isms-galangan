import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { PAIN_POINTS } from "@/data/content";

export function ProblemSolution() {
  return (
    <Section
      id="masalah"
      eyebrow="Masalah vs solusi"
      title="Pesanan manual itu capek — buat kamu dan pelangganmu."
      description="Tiga hal yang paling sering bikin jam ramai jadi kacau, dan cara Kou menanganinya."
    >
      <ol className="space-y-4">
        {PAIN_POINTS.map((p, i) => (
          <li key={p.id}>
            <Reveal delay={i * 0.08} className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
              <article className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-danger-400/10 text-danger-400">
                    <Icon name={p.problem.icon} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-400">Masalah</p>
                </div>
                <h3 className="font-display text-xl font-bold text-sand-50">{p.problem.title}</h3>
                <p className="mt-2 leading-relaxed text-sand-400">{p.problem.body}</p>
              </article>

              <div aria-hidden="true" className="grid place-items-center text-ember-400">
                <span className="grid size-10 rotate-90 place-items-center rounded-full bg-ember-400/10 md:rotate-0">
                  <Icon name="arrowRight" />
                </span>
              </div>

              <article className="glass rounded-3xl p-6 transition-[border-color,transform] duration-300 hover:border-ember-400/30 motion-safe:hover:-translate-y-0.5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-ember-400/15 text-ember-300">
                    <Icon name={p.solution.icon} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember-300">Dengan Kou</p>
                </div>
                <h3 className="font-display text-xl font-bold text-sand-50">{p.solution.title}</h3>
                <p className="mt-2 leading-relaxed text-sand-200">{p.solution.body}</p>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
