import { siteConfig } from "@/config/site";

export function Logo() {
  return (
    <a href="#" className="group inline-flex min-h-11 items-center gap-2.5 rounded-full pr-2" aria-label={`${siteConfig.name} — ke atas`}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-xl bg-ember-400 font-display text-lg font-extrabold text-ink-950 transition-transform duration-300 motion-safe:group-hover:-rotate-6"
      >
        K
      </span>
      <span className="font-display text-base font-bold tracking-tight text-sand-50">
        Kou <span className="font-semibold text-sand-400">Restaurant System</span>
      </span>
    </a>
  );
}
