import { siteConfig } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 text-sm text-sand-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {year} {siteConfig.name}
        </p>
        <p>
          Dibuat oleh {siteConfig.creator.name}, {siteConfig.creator.city}.
        </p>
      </div>
    </footer>
  );
}
