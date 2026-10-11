import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";

const NAV = [
  { href: "#demo", label: "Demo" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#tentang", label: "Tentang" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-sand-200 transition-colors hover:bg-white/5 hover:text-sand-50"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink href="#demo" size="md" className="shrink-0">
          Coba demo
        </ButtonLink>
      </div>
    </header>
  );
}
