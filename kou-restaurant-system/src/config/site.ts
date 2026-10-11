/**
 * Konfigurasi situs. Nilai dalam kurung siku ([...]) adalah placeholder
 * yang wajib diganti — lewat environment variable (disarankan, lihat .env.example)
 * atau langsung di file ini.
 */

const PLACEHOLDER = /^\[.+\]$/;

/** True bila nilai masih berupa placeholder seperti "[NOMOR_WA]". */
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER.test(value.trim());
}

function envOr(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && !isPlaceholder(explicit)) return explicit.replace(/\/$/, "");
  // Vercel menyediakan domain produksi otomatis saat build.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Kou Restaurant System",
  shortName: "Kou",
  url: resolveSiteUrl(),
  locale: "id_ID",
  title: "Kou Restaurant System — Pesan dari Meja, Tanpa Antre Kasir",
  description:
    "Sistem pemesanan restoran berbasis PWA. Pelanggan scan QR di meja, pilih menu dan meja lewat denah visual, lalu bayar pakai QRIS. Coba demonya langsung.",
  whatsapp: {
    number: envOr(process.env.NEXT_PUBLIC_WA_NUMBER, "[NOMOR_WA]"),
    message: "Halo, saya tertarik dengan Kou Restaurant System",
  },
  demoUrl: envOr(process.env.NEXT_PUBLIC_DEMO_URL, "[LINK_DEMO]"),
  creator: {
    name: "Ghani",
    city: "Samarinda",
    achievement: "Juara 3 LKS Web Technologies 2025",
    portfolioUrl: envOr(process.env.NEXT_PUBLIC_PORTFOLIO_URL, "[LINK_PORTFOLIO]"),
  },
} as const;
