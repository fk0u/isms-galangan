import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
}

/** Kerangka section: heading terhubung via aria-labelledby untuk landmark yang jelas. */
export function Section({ id, eyebrow, title, description, children, className, align = "center" }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("scroll-mt-20 py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <header className={cn("mb-12 max-w-2xl sm:mb-16", align === "center" && "mx-auto text-center")}>
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-ember-300">{eyebrow}</p>
          )}
          <h2 id={headingId} className="font-display text-3xl font-bold leading-tight text-balance text-sand-50 sm:text-4xl">
            {title}
          </h2>
          {description && <p className="mt-4 text-lg leading-relaxed text-pretty text-sand-400">{description}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
