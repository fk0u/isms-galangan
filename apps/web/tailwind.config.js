/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* Design system "Swiss Industrial" (ADR-0013): putih netral + tinta + satu
         aksen merah. Nama token lama (navy/steel/ocean/teal/rose/violet)
         dipertahankan supaya ±2.600 pemakaian di halaman ikut berubah tanpa
         menyentuh tiap file — maknanya kini: navy = tinta, steel = abu netral,
         ocean & rose = merah aksen, teal & violet = netral gelap. */
      colors: {
        navy: {
          50: "#F5F5F5",
          100: "#EBEBEB",
          200: "#D6D6D6",
          900: "#0A0A0A",
          800: "#141414",
          700: "#1C1C1C",
          600: "#2B2B2B",
        },
        steel: {
          700: "#262626",
          600: "#474747",
          500: "#666666",
          400: "#8F8F8F",
          300: "#C7C7C7",
          200: "#E2E2E2",
          100: "#F1F1F1",
          50: "#F8F8F8",
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
        /* Panel sekunder & hover: abu sangat terang (halaman tetap putih). */
        surface: "#F7F7F7",
        ink: "#0A0A0A",
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
      /* Tanpa bayangan lembut: kedalaman diganti garis 1px tinta. */
      boxShadow: {
        soft: "none",
        lift: "none",
        glow: "none",
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
