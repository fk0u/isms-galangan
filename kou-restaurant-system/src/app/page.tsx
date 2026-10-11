import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { About } from "@/components/sections/About";
import { ClosingCta } from "@/components/sections/ClosingCta";
import { DemoSection } from "@/components/sections/DemoSection";
import { Features } from "@/components/sections/Features";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ProblemSolution } from "@/components/sections/ProblemSolution";
import { siteConfig } from "@/config/site";

// Structured data minimal — hanya fakta produk, tanpa rating/harga karangan.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web (PWA)",
  description: siteConfig.description,
  inLanguage: "id",
  url: siteConfig.url,
  author: { "@type": "Person", name: siteConfig.creator.name, address: siteConfig.creator.city },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON statis dari config sendiri, bukan input pengguna.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Header />
      <main id="konten">
        <Hero />
        <ProblemSolution />
        <DemoSection />
        <HowItWorks />
        <Features />
        <About />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
