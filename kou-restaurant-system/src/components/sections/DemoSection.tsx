import { DemoApp } from "@/components/demo/DemoApp";
import { DemoGuide } from "@/components/demo/DemoGuide";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { isPlaceholder, siteConfig } from "@/config/site";

export function DemoSection() {
  const hasFullDemo = !isPlaceholder(siteConfig.demoUrl);
  return (
    <Section
      id="demo"
      eyebrow="Demo interaktif"
      title="Coba sendiri, persis seperti pelangganmu nanti."
      description="Pesan menu, pilih meja di denah, lalu bayar di layar QRIS simulasi. Semua data di sini contoh — tidak ada transaksi sungguhan."
      className="relative"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-[500px] max-w-3xl rounded-full bg-ember-500/10 blur-[120px]"
      />
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div className="order-2 lg:order-1 lg:sticky lg:top-24">
          <DemoGuide />
          <p className="mt-4 flex items-start gap-2 px-2 text-sm text-sand-400">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            Bisa dipakai dengan keyboard: Tab untuk pindah, Enter/Spasi untuk memilih meja dan tombol.
          </p>
          {hasFullDemo && (
            <ButtonLink href={siteConfig.demoUrl} external variant="secondary" className="mt-4">
              Buka demo versi penuh <Icon name="external" className="size-4" />
            </ButtonLink>
          )}
        </div>
        <div className="order-1 lg:order-2">
          <DemoApp />
        </div>
      </div>
    </Section>
  );
}
