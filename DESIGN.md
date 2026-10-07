# DESIGN.md — Design System & Aturan UI

Sumber kebenaran visual: `apps/web/tailwind.config.js` (token), `apps/web/src/index.css` (kelas dasar), `apps/web/src/components/ui.tsx` (komponen). Dokumen ini menjelaskan **cara memakainya**. Jangan membuat token/komponen baru bila yang ada sudah cukup.

## Karakter
Aplikasi kerja harian untuk galangan: **tenang, padat informasi, cepat dibaca di tablet bengkel**. Navy maritim sebagai warna merek, steel netral untuk teks & garis, ocean untuk aksen interaktif. Hindari dekorasi yang tidak membawa informasi.

## Token

### Warna
| Token | Hex | Pemakaian |
|---|---|---|
| `navy-900` | `#0b3a63` | Judul, teks penting |
| `navy-700` | `#12598f` | Tombol utama |
| `navy-600/800` | `#166aa5` / `#0e4a7d` | Hover/aktif |
| `steel-700` | `#3d5468` | Teks badan (default `body`) |
| `steel-500/600` | `#5a7a94` / `#52697c` | Teks sekunder, label |
| `steel-200/300` | `#d7e1ea` / `#bcccd8` | Border, divider |
| `steel-100` | `#e9eff4` | Latar hover |
| `surface` | `#f4f7fb` | Latar halaman |
| `ocean-400/500` | `#5cb1de` / `#2e9ad4` | Fokus, link, aksen |
| `teal-*` | — | Status sukses/selesai |
| `rose-*` | — | Bahaya, kritis, **Perhatian khusus** (MON-03) |
| `amber`/`orange` (Tailwind default) | — | Peringatan, tertunda |
| `violet-*` | — | Kategori/aksen sekunder |

Status → warna (konsisten di `StatusBadge`, `i18n/status.ts`):
Selesai/Disetujui = teal · Dalam proses/Berjalan = ocean · Tertunda/Menunggu = amber · Terlambat/Kritis/Ditolak = rose · Draft/Batal = steel.

### Tipografi
- `font-sans` **Inter** — semua teks UI. `font-display` **Sora** — judul halaman & angka KPI. `font-mono` **JetBrains Mono** — kode, nomor dokumen bila perlu.
- Skala: judul halaman `text-xl font-semibold`, judul card `text-sm font-semibold`, teks `text-sm`, label `text-xs font-medium` (`.label`), header tabel `.th` (11px uppercase).
- Angka di tabel: rata kanan, `tabular-nums`.

### Bentuk & elevasi
- Radius: card `rounded-2xl`, tombol & input `rounded-xl`, badge `rounded-full`.
- Shadow: `shadow-soft` (default card), `shadow-lift` (hover/aksi), `shadow-glow` (CTA gradient). Jangan menumpuk shadow lain.
- Spasi: kelipatan 4px (Tailwind). Padding card `p-4`/`p-5`; jarak antar section `gap-4`/`gap-6`.

## Kelas dasar (`index.css`)
`.card`, `.btn-primary`, `.btn-primary-gradient`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.th`. Gunakan ini, bukan menulis ulang utility panjang.

## Komponen (`components/ui.tsx`)
| Kebutuhan | Pakai |
|---|---|
| Kerangka halaman | `PageHeader`, `Card`, `CardHeader`, `Tabs` |
| Angka ringkas | `KpiCard` (revisi PRJ-04: varian gradient tanpa sparkline) |
| Status | `Badge`, `StatusBadge` |
| Form | `Field`, `FormGrid`, `MoneyInput` (**wajib untuk rupiah**), `NumInput`, `TimeInput` (24 jam), `EntityPicker`/`SearchSelect` (pilihan data), `FileUploadButton` |
| Tabel | `SortTh`, `SearchBox`, `usePager` + `<Pager>` (F3-A-03), `RowAction` |
| Dialog | `Modal`, `ConfirmModal` |
| Feedback | `toast()` + `Toaster`, `EmptyState`, `Skeleton`, `AsyncButton` |
| Grafik | Recharts + `ChartTooltip`, `Donut`, `RadialGauge`, `ProgressBar` |
| Animasi masuk | `Stagger`, `StaggerItem` (framer-motion) |
Komponen bersama baru (F3-A-04): `SearchSelect`, `DateInput`, `PhotoUploader`, `ChangeHistory`, `StatusChips`, `Pager` — letakkan di `components/`, satu file per komponen.

## Pola halaman
- **Daftar:** `PageHeader` (judul + aksi utama) → baris KPI (maks 4) → banner peringatan (maks 3 item, PRJ-01) → toolbar (search, filter chip) → tabel → `Pager`.
- **Tabel:** kolom pertama **No** (PRJ-02); aksi di kolom terakhir sebagai tombol "Detail" + menu `RowAction`; default 25 baris; data terbaru di atas kecuali dinyatakan lain (SDM: data baru di bawah, HR-01).
- **Detail:** header entitas + status + aksi → `Tabs`. Tombol **Kembali** kembali ke halaman asal (MON-04).
- **Form:** `Modal` untuk ≤ 8 field; lebih dari itu bertahap (step) atau halaman. Field wajib bertanda `*`. Pilihan data dari koleksi lain **selalu** `SearchSelect`, bukan teks bebas. Tanggal pakai `DateInput`.
- **Filter:** deretan chip yang muncul dengan animasi slide (PRJ-05, SUB-03), bukan popup.
- **Sidebar:** menu aktif disorot (MON-05).

## Gerak
framer-motion sudah terpasang. Durasi 150–250ms, easing `easeOut`. Animasi hanya untuk: masuk/keluar panel & modal, chip filter, perubahan tab. Hormati `prefers-reduced-motion`. Jangan menganimasikan angka tabel.

## Bahasa & copy
- Indonesia baku tapi ringkas; istilah domain tetap (BoQ, WBS, PO, NCR). EN wajib tersedia.
- Tombol = kata kerja ("Simpan", "Ajukan", "Setujui"). Pesan error menjelaskan apa yang harus dilakukan.
- Semua string di `src/i18n/` — dilarang hardcode.

## Aksesibilitas & responsif
- Kontras teks ≥ 4.5:1 (steel-500 ke bawah hanya untuk teks sekunder di latar putih).
- Target sentuh ≥ 40px untuk aksi di tablet. Fokus terlihat (`focus:ring-ocean-400`).
- Breakpoint: tabel lebar boleh scroll horizontal di dalam card; layout tidak boleh scroll horizontal di level halaman. Uji di 768px (tablet) dan 390px.
- Ikon dari `lucide-react`, selalu dengan label atau `aria-label`.

## Dokumen PDF
Dirender di server (`services/api/src/pdf/`). Kop surat dari pengaturan perusahaan; font Noto Sans (R-02). Tata letak tabel memakai blok yang ada di `pdf/blocks.ts`.
