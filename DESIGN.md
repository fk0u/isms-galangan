# DESIGN.md — Design System "Minimal Modern"

Sumber kebenaran visual: `apps/web/tailwind.config.js` (token), `apps/web/src/index.css` (tema, kelas dasar, primitif, gerak), `apps/web/src/components/ui.tsx` (komponen). Keputusan: [ADR-0014](docs/architecture/adr/0014-design-system-minimal-modern.md) (menggantikan ADR-0013).

## Karakter
Tenang, rapi, cepat dibaca — aplikasi kerja harian yang layak dipresentasikan ke klien. **Putih netral + satu warna merek: merah `#E61919`.** Hierarki datang dari ruang, ukuran, dan nada abu — bukan dari garis tebal atau warna. Detail kecil (tekan tombol, masuk modal, garis tab) bergerak halus dan cepat; selebihnya diam.

Aturan emas:
1. **Merah = merek & perhatian.** Tombol aksi utama, menu/ikon aktif, peringatan bahaya. Maksimal satu tombol merah per area.
2. **Hijau & kuning hanya untuk status**, selalu lembut (latar tint + teks gelap + titik).
3. Tidak ada biru, ungu, atau gradien dekoratif.

## Token warna

| Peran | Token | Hex | Pemakaian |
|---|---|---|---|
| Kanvas | `bg-surface` | `#FAFAFA` | Latar aplikasi & panel sekunder |
| Kartu / permukaan | `bg-white` | `#FFFFFF` | Kartu, modal, sidebar, top bar |
| Tinta | `ink`, `navy-900` | `#09090B` | Judul, angka utama |
| Teks badan | `steel-700` | `#27272A` | Isi |
| Teks sekunder | `steel-500/600` | `#71717A` / `#52525B` | Label, deskripsi |
| Teks samar | `steel-400` | `#A1A1AA` | Placeholder, label grup |
| Garis | `steel-200` / `steel-100` | `#E4E4E7` / `#F4F4F5` | Border kartu / divider |
| **Merek** | `accent`, `ocean-500` | **`#E61919`** | CTA, aktif, bahaya |
| Merek hover / teks | `ocean-600/700` | `#C41212` / `#A30F0F` | Hover tombol, teks merah |
| Merek tint | `ocean-50/100` | `#FFF3F3` / `#FFE3E3` | Latar badge bahaya, seleksi teks |
| Status selesai | `emerald-50/500/700` | `#F0FDF4` `#22A55B` `#14632F` | Badge & delta positif |
| Status peringatan | `amber-50/500/700` | `#FFFBEB` `#E59A0B` `#92520D` | Badge menunggu/menipis |

Nama token lama (`navy`, `steel`, `ocean`, `rose`, `teal`, `violet`) tetap sebagai alias agar halaman lama ikut sistem. **Kode baru pakai nama semantik:** `ink`, `accent`, `steel-*`, `surface`, `emerald-*`, `amber-*`.

### Status
| Arti | Badge | Contoh |
|---|---|---|
| Selesai / OK | Tint hijau, titik hijau | Selesai, Disetujui, Lunas, Tersedia |
| Berjalan | Abu, titik tinta | Dalam Proses, Dikirim, Terpakai |
| Menunggu / peringatan | Tint kuning, titik kuning | Diajukan, Menunggu, Menipis, Tertunda |
| Bahaya | Tint merah, titik merah | Terlambat, Kritis, Ditolak, Kedaluwarsa |
| Netral | Abu terang | Draft, Batal, Ditutup |
Status selalu = titik + teks (tidak pernah warna saja).

## Tipografi
Inter untuk semuanya; JetBrains Mono hanya untuk ID/kode bila perlu (`font-mono`).
| Peran | Spesifikasi |
|---|---|
| Judul halaman (`.display`) | 26–28px, semibold, tracking −0.035em |
| Judul kartu/modal | 15–16px, semibold, tracking −0.01em |
| Badan | 14px regular |
| Label form (`.label`) | 13px medium, `steel-700` |
| Header tabel (`.th`) | 12px medium, `steel-500`, latar `steel-50` |
| Angka | `tabular-nums` di tabel & KPI |
**Sentence case** di mana pun. Huruf kapital penuh hanya untuk singkatan (ID/EN, BKI).

## Bentuk & kedalaman
- Radius: input & tombol `rounded-lg` (10px), kartu `rounded-xl` (12px), modal `rounded-2xl` (14px), badge `rounded-md`, avatar & titik `rounded-full`.
- Bayangan: kartu `shadow-soft` (nyaris rata); lapisan mengambang (modal, dropdown, popover) `shadow-lift`; fokus tombol merah `shadow-glow`.
- Border 1px `steel-200` untuk kartu; divider `steel-100`.
- Spasi kelipatan 4px; kartu `p-5`; jarak antar section `gap-4`/`gap-6`.

## Gerak (prinsip Emil Kowalski)
| Interaksi | Nilai | Alasan |
|---|---|---|
| Tekan tombol | `scale(0.97)`, 160ms `var(--ease-out)` | Umpan balik instan bahwa klik "didengar" |
| Modal masuk / keluar | `scale(0.96)→1` + opacity, 220ms / keluar 140ms, `cubic-bezier(0.23,1,0.32,1)` | Tidak pernah dari scale(0); keluar lebih cepat dari masuk; modal tetap berpusat |
| Garis tab aktif | `layoutId` spring 300ms tanpa bounce | Garis berpindah ke tab baru, bukan muncul tiba-tiba |
| Header halaman | `.enter-up`: naik 6px + fade 260ms, sekali | Halaman terasa hidup tanpa menunda kerja |
| Hover kartu | Border + bayangan, hanya `@media (hover:hover) and (pointer:fine)` | Tablet bengkel tidak memicu hover palsu |
| Warna/hover | 150ms `ease` | — |
Aturan: hanya animasikan `transform`, `opacity`, warna, bayangan. Tidak ada `transition: all`. Durasi UI ≤ 300ms. Aksi keyboard tidak dianimasikan. `prefers-reduced-motion` mematikan gerak posisi (`.enter-up`).
Token: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`.

## Primitif (`index.css`)
| Kelas | Fungsi |
|---|---|
| `.card` | Kartu putih, border `steel-200`, `rounded-xl`, `shadow-soft` |
| `.btn-primary` | Merah merek (CTA) |
| `.btn-dark` | Tinta (aksi konfirmasi netral) |
| `.btn-secondary` | Putih bergaris |
| `.btn-danger` | Teks merah, tint saat hover (aksi destruktif sekunder) |
| `.input` | Border abu, fokus = border merah lembut + cincin 3px |
| `.label`, `.th`, `.td` | Form & tabel |
| `.display` | Judul halaman |
| `.enter-up` | Animasi masuk header |
| `.grid-ruled` | Grid bergaris halus 1px (statistik) |

## Komponen (`components/ui.tsx`)
| Komponen | Tampilan |
|---|---|
| `PageHeader` | Ikon dalam kotak putih bulat (desktop), judul `.display`, subjudul abu, aksi di kanan — membungkus di mobile |
| `KpiCard` | Label abu 13px, angka 28px semibold, ikon dalam kotak tint sesuai nada, delta hijau/merah; tanpa grafik (revisi PRJ-04) |
| `Badge` / `StatusBadge` | `rounded-md`, tint lembut + cincin tipis + titik status |
| `Tabs` | Teks 14px medium; aktif = teks tinta + garis merah 2px yang meluncur (`layoutId`) |
| `Modal` | `rounded-2xl`, `shadow-lift`, latar buram 2px, header & footer tipis |
| `ProgressBar` | 6px `rounded-full`, transisi lebar 500ms |
| `Avatar` | Bulat, inisial |
| `EmptyState` | Ikon abu + judul medium + deskripsi |

## Shell
- **Sidebar** putih, border kanan `steel-200`. Logo kotak merah kecil. Label grup abu samar. Item `rounded-lg`; aktif = latar `steel-100` + teks tinta + **ikon merah**.
- **Top bar** putih 80% + `backdrop-blur`, border bawah tipis; status koneksi = pil hijau "Server" / abu "Lokal".
- **Login**: panel kiri kanvas abu (logo, judul "Seluruh galangan, dalam satu sistem.", statistik grid halus), form dalam kartu `rounded-2xl` di kanan.

## Grafik
Seri utama `#27272A`, pembanding merah `#E61919`, lainnya abu `#A1A1AA`/`#D4D4D8` dan merah muda `#FF8A8A`. Grid `#E4E4E7`. Tanpa gradien tebal.

## Pola halaman
Tabel: kolom No pertama, default 25 baris, aksi di kolom terakhir, header `steel-50`. Filter = chip. Tombol Kembali ke halaman asal. Menu aktif tersorot.

## Aksesibilitas
- Tinta di putih 19:1; `steel-500` di putih 4.8:1; merah `#E61919` di putih 4.6:1 (AA), teks merah kecil pakai `ocean-600`/`700`.
- Fokus: outline merah 2px offset 2px (`:focus-visible`), input = cincin merah 3px.
- Target sentuh ≥ 36–40px; tidak ada scroll horizontal di 375px (diverifikasi 20 halaman).

## Dokumen PDF
Dirender di server (`services/api/src/pdf/`), belum mengikuti sistem ini — tindak lanjut terpisah.
