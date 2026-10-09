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
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          900: "#09090B",
          800: "#18181B",
          700: "#27272A",
          600: "#3F3F46",
        },
        steel: {
          700: "#27272A",
          600: "#52525B",
          500: "#71717A",
          400: "#A1A1AA",
          300: "#D4D4D8",
          200: "#E4E4E7",
          100: "#F4F4F5",
          50: "#FAFAFA",
        },
        ocean: {
          700: "#A30F0F",
          600: "#C41212",
          500: "#E61919",
          400: "#FF3B3B",
          300: "#FF8A8A",
          200: "#FFC2C2",
          100: "#FFE3E3",
          50: "#FFF3F3",
        },
        /* Latar kanvas aplikasi: abu sangat terang; kartu putih di atasnya. */
        surface: "#FAFAFA",
        ink: "#09090B",
        accent: "#E61919",
        teal: {
          600: "#141414",
          500: "#1C1C1C",
          400: "#474747",
          100: "#EBEBEB",
          50: "#F5F5F5",
        },
        rose: {
          700: "#A30F0F",
          600: "#C41212",
          500: "#E61919",
          400: "#FF3B3B",
          200: "#FFC2C2",
          100: "#FFE3E3",
          50: "#FFF3F3",
        },
        violet: {
          700: "#262626",
          600: "#2B2B2B",
          500: "#474747",
          200: "#D6D6D6",
          100: "#EBEBEB",
          50: "#F5F5F5",
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
        glow: "0 0 0 3px rgba(230,25,25,0.16)",
      },
      /* Tanpa gradien: nama kelas lama dipertahankan, isinya warna solid. */
      backgroundImage: {
        "gradient-hero": "linear-gradient(#0A0A0A, #0A0A0A)",
        "gradient-teal": "linear-gradient(#1C1C1C, #1C1C1C)",
        "gradient-rose": "linear-gradient(#E61919, #E61919)",
        "gradient-violet": "linear-gradient(#474747, #474747)",
        "gradient-amber": "linear-gradient(#E61919, #E61919)",
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
