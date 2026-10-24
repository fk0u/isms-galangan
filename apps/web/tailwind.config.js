/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* Design system "Minimal Modern" (ADR-0014): putih netral + satu aksen
         merah. Nama token lama (navy/steel/ocean/teal/rose/violet) dipertahankan
         sebagai alias supaya ±2.600 pemakaian di halaman ikut berubah — maknanya:
         navy = tinta, steel = abu netral, ocean & rose = merah aksen,
         teal & violet = netral gelap. Kode baru: ink / accent / steel / surface. */
      colors: {
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        steel: {
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
          50: "#f8fafc",
        },
        /* ocean: coral-rose elegan (sesuai referensi UI modern SaaS/logistik CEO) */
        ocean: {
          800: "#9f1239",
          700: "#be123c",
          600: "#e11d48",
          500: "#f43f5e",
          400: "#fb7185",
          300: "#fda4af",
          200: "#fecdd3",
          100: "#ffe4e6",
          50: "#fff1f2",
        },
        /* Latar kanvas aplikasi: off-white lembut; kartu putih timbul elegan */
        surface: "#f8f9fb",
        ink: "#0f172a",
        accent: "#f43f5e",
        teal: {
          700: "#0f766e",
          600: "#0d9488",
          500: "#14b8a6",
          400: "#2dd4bf",
          200: "#99f6e4",
          100: "#ccfbf1",
          50: "#f0fdfa",
        },
        rose: {
          800: "#9f1239",
          700: "#be123c",
          600: "#e11d48",
          500: "#f43f5e",
          400: "#fb7185",
          300: "#fda4af",
          200: "#fecdd3",
          100: "#ffe4e6",
          50: "#fff1f2",
        },
        violet: {
          700: "#6d28d9",
          600: "#7c3aed",
          500: "#8b5cf6",
          400: "#a78bfa",
          200: "#ddd6fe",
          100: "#ede9fe",
          50: "#f5f3ff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      /* Bayangan sangat tipis: kartu hampir rata, lapisan (modal, popover)
         sedikit terangkat. */
      boxShadow: {
        soft: "0 1px 2px rgba(9,9,11,0.04), 0 1px 1px rgba(9,9,11,0.02)",
        lift: "0 12px 32px -8px rgba(9,9,11,0.16), 0 2px 6px rgba(9,9,11,0.06)",
        glow: "0 0 0 3px rgba(185,28,28,0.16)",
      },
      /* Gradien harmonis untuk dashboard visual rich */
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)",
        "gradient-teal": "linear-gradient(135deg, #0d9488, #14b8a6)",
        "gradient-rose": "linear-gradient(135deg, #e11d48, #f43f5e)",
        "gradient-violet": "linear-gradient(135deg, #6366f1, #8b5cf6)",
        "gradient-amber": "linear-gradient(135deg, #d97706, #f59e0b)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
