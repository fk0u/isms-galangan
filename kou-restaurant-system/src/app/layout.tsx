import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { siteConfig } from "@/config/site";
import "./globals.css";

// next/font: self-host + size-adjust otomatis → tanpa layout shift dari font.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "sistem pemesanan restoran",
    "pesan lewat QR meja",
    "QRIS restoran",
    "aplikasi kafe",
    "PWA restoran",
    "self order",
    "denah meja",
  ],
  authors: [{ name: siteConfig.creator.name }],
  creator: siteConfig.creator.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0a08",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh overflow-x-clip">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ember-400 focus:px-5 focus:py-3 focus:font-semibold focus:text-ink-950"
        >
          Lewati ke konten utama
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
