# Kou Restaurant System — Website Marketing + Demo Interaktif

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · Framer Motion · Zustand.

## Struktur folder

```
src/
├─ app/            layout, page, metadata, OG image, robots, sitemap, globals.css
├─ config/site.ts  konfigurasi + placeholder (WA, demo, portofolio)
├─ data/           MOCK: menu.ts, tables.ts, content.ts (tanpa logika UI)
├─ store/          demo-store.ts (Zustand: langkah, keranjang, meja, pembayaran)
├─ lib/            cart, format Rupiah, builder link WhatsApp
└─ components/
   ├─ ui/          Button, Icon, Section, Reveal, PhoneFrame
   ├─ layout/      Header, Footer, Logo
   ├─ demo/        DemoApp, Menu/Table/Summary/Payment/Confirm screen, FloorPlan, MockQr, Stepper, Toast
   └─ sections/    Hero, ProblemSolution, DemoSection, HowItWorks, Features, About, ClosingCta
```

## Menjalankan

```bash
cd kou-restaurant-system
cp .env.example .env.local   # isi nilai placeholder
npm install
npm run dev                  # http://localhost:3000
npm run check                # typecheck + production build
```

## Deploy ke Vercel

1. Push repo ke GitHub, lalu **Add New → Project** di Vercel.
2. **Root Directory**: `kou-restaurant-system` (framework Next.js terdeteksi otomatis).
3. Isi Environment Variables di bawah, lalu Deploy.
4. Tambah custom domain bila ada; `NEXT_PUBLIC_SITE_URL` boleh dikosongkan (otomatis pakai domain produksi Vercel).

## Placeholder yang harus diisi

| Variabel | Fungsi | Jika belum diisi |
|---|---|---|
| `NEXT_PUBLIC_WA_NUMBER` | Nomor WA (`62812...` atau `0812...`) untuk semua tombol WhatsApp | Tombol membuka `wa.me/?text=...` tanpa nomor |
| `NEXT_PUBLIC_SITE_URL` | Canonical, Open Graph, sitemap | Domain Vercel / `localhost:3000` |
| `NEXT_PUBLIC_DEMO_URL` (`[LINK_DEMO]`) | Tombol "Buka demo versi penuh" | Tombol disembunyikan |
| `NEXT_PUBLIC_PORTFOLIO_URL` (`[LINK_PORTFOLIO]`) | Link portofolio di bagian Tentang | Link disembunyikan |

Konten lain yang perlu kamu cek manual: nama kafe contoh dan menu/harga di `src/data/menu.ts` (semua data sintetis), serta teks di `src/data/content.ts`.

## Catatan

- Semua klaim dibatasi pada fakta produk; tidak ada testimoni, angka, atau klien.
- QR di demo adalah QR palsu berlabel "SIMULASI", bukan QRIS valid.
- Lighthouse belum diukur di sini — jalankan di URL Vercel/`npm run build && npm start` untuk memverifikasi target Performance >90 / Accessibility >95.
