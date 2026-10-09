# DESIGN.md — Design System "Swiss Industrial"

Sumber kebenaran visual: `apps/web/tailwind.config.js` (token), `apps/web/src/index.css` (tema, kelas dasar, primitif), `apps/web/src/components/ui.tsx` (komponen). Keputusan: [ADR-0013](docs/architecture/adr/0013-design-system-swiss-industrial.md).

## Karakter
Manual teknik galangan, bukan aplikasi konsumen: **putih netral, tinta hitam, satu aksen merah**. Struktur terlihat dari garis, bukan dari bayangan. Tipografi adalah dekorasi utama: judul tebal raksasa huruf kapital, metadata monospace kecil berjarak lebar. Tidak ada radius, gradien, bayangan lembut, atau blur.

Aturan emas: **merah hanya untuk hal yang butuh perhatian atau aksi utama.** Bila semua merah, tidak ada yang merah.

## Token warna

| Peran | Token Tailwind | Hex | Pemakaian |
|---|---|---|---|
| Latar halaman | `bg-white` | `#FFFFFF` | Semua halaman |
| Panel sekunder / hover | `bg-surface`, `bg-steel-50/100` | `#F7F7F7` / `#F8F8F8` / `#F1F1F1` | Footer modal, hover baris, panel info |
| Tinta (teks utama, garis struktural, tombol utama) | `navy-900` / `ink` | `#0A0A0A` | Judul, border tebal, tombol primer, item nav aktif |
| Tinta sekunder | `navy-700/800`, `steel-700` | `#1C1C1C` / `#141414` / `#262626` | Teks badan |
| Abu teks | `steel-600/500/400` | `#474747` / `#666666` / `#8F8F8F` | Label, metadata, placeholder |
| Garis | `steel-300/200` | `#C7C7C7` / `#E2E2E2` | Border kartu, divider tabel |
| **Aksen** | `ocean-500` / `accent` / `rose-500` | **`#E61919`** | CTA utama, penanda aktif, peringatan & bahaya |
| Aksen gelap / terang | `ocean-600/700`, `ocean-300/100/50` | `#C41212` `#A30F0F` / `#FF8A8A` `#FFE3E3` `#FFF3F3` | Hover, teks di latar terang, latar peringatan |

Kompatibilitas: nama token lama tetap ada supaya halaman tidak perlu ditulis ulang — `navy` = tinta, `steel` = abu, `ocean`/`rose` = merah, `teal`/`violet` = netral gelap. Palet default Tailwind dipetakan ulang di `@theme` (`index.css`): hijau/emerald → tinta, amber/oranye/kuning → merah muda, biru/ungu/cyan/slate → abu. **Untuk kode baru, pakai nama semantik: `ink`, `accent`, `steel-*`, `surface`.**

### Status → visual
| Arti | Badge (`StatusBadge`) | Contoh status |
|---|---|---|
| Selesai / OK | Tinta solid, teks putih | Selesai, Disetujui, Lunas, Tersedia |
| Berjalan | Garis tinta, teks tinta | Dalam Proses, Dikirim, Terpakai |
| Peringatan | Garis merah, teks merah | Diajukan, Menunggu, Menipis, Tertunda |
| Bahaya | Merah solid, teks putih | Terlambat, Kritis, Ditolak, Kedaluwarsa |
| Netral | Abu | Draft, Batal, Ditutup |
Jangan pernah menyampaikan status lewat warna saja — badge selalu berisi teks.

## Tipografi
| Peran | Kelas | Spesifikasi |
|---|---|---|
| Makro (judul halaman, angka hero) | `.display` | Inter Black 900, HURUF KAPITAL, tracking −0.04em, leading 0.92, `clamp()` untuk ukuran |
| Judul kartu/modal | `font-extrabold uppercase` | Inter 800, 13–18px |
| Badan | default | Inter 400/500, 14px |
| Mikro (label, metadata, nav, tombol, header tabel) | `.mono-label`, `.label`, `.th`, `.btn` | JetBrains Mono 600, 10–11.5px, HURUF KAPITAL, tracking 0.06–0.12em |
| Angka | `tabular-nums` | Wajib di tabel & KPI |
Font dimuat dari Google Fonts di `apps/web/index.html`.

## Bentuk, garis, ruang
- **Radius 0 di mana pun** (termasuk `rounded-full` — status dot & avatar berbentuk kotak).
- **Tanpa bayangan dan gradien.** Kedalaman = garis: `border` 1px `steel-300` untuk kompartemen biasa, `border-2 navy-900` untuk struktur utama (sidebar, top bar, header halaman, modal, form login).
- **Bar aksen**: 3px merah di atas kartu/modal penting (`.rule-accent`, bar atas `KpiCard`), 3px kiri untuk baris yang ditandai (`notif-hl`).
- Spasi kelipatan 4px. Padding kartu `p-4`/`p-5`.

## Primitif (`index.css`)
| Kelas | Fungsi |
|---|---|
| `.card` | Kompartemen putih bergaris 1px |
| `.btn-primary` | Hitam → merah saat hover (aksi utama per layar, maks 1) |
| `.btn-primary-gradient` | Merah → hitam saat hover (CTA paling penting, mis. "Proyek baru", "Sign in") |
| `.btn-secondary` | Garis tinta, terbalik saat hover |
| `.btn-danger` | Garis merah, merah solid saat hover |
| `.input` | Garis abu, fokus = garis tinta + garis bawah merah 2px |
| `.label`, `.mono-label` | Mikro-tipografi |
| `.th`, `.td` | Header tabel bergaris tinta 2px; sel bergaris abu |
| `.display` | Makro-tipografi |
| `.rule-accent`, `.rule-ink` | Garis struktural 3px merah / 2px tinta |
| `.grid-ruled` | Grid dengan garis 1px presisi (gap 1px + latar garis) |
| `.hazard-stripe` | Pita peringatan diagonal merah-putih — hemat, hanya dekorasi struktural |

## Komponen (`components/ui.tsx`)
| Komponen | Tampilan |
|---|---|
| `PageHeader` | Kicker mono `■ ISMS / MODUL`, judul `.display`, garis tinta 2px di bawah; aksi membungkus di mobile |
| `KpiCard` | Bar atas 3px (merah untuk nada `rose`/`amber`), label mono, angka Inter Black 30px; **tanpa grafik** (revisi klien PRJ-04) |
| `Card` + `CardHeader` | Judul huruf kapital tebal, subjudul mono, garis bawah |
| `Badge` / `StatusBadge` | Kotak mono huruf kapital, lihat tabel status |
| `Tabs` | Tab mono huruf kapital; aktif = blok tinta + bar merah bawah |
| `Modal` | Border tinta 2px, bar merah atas, judul huruf kapital, footer abu |
| `ProgressBar` | Batang 6px tanpa radius; merah untuk nada peringatan |
| `EmptyState` | `[ JUDUL ]` mono |
| `Avatar` | Kotak tinta, inisial mono |
| Komponen bersama F3-A-04 | `SearchSelect`, `DateInput`, `TimeInput24`, `PhotoUploader`, `ChangeHistory`, `StatusChips` — ikuti primitif di atas |

## Shell
- **Sidebar** putih, garis kanan tinta 2px. Grup = label mono. Item aktif = blok tinta, teks putih, bar kiri merah 3px. Badge notifikasi = kotak merah.
- **Top bar** putih solid, garis bawah tinta 2px, breadcrumb mono.
- **Login** = poster Swiss: tipografi makro "COMMAND YOUR SHIPYARD.", tanda registrasi (+) di sudut, grid statistik bergaris, pita hazard; form di kompartemen bergaris tinta.

## Grafik (Recharts)
Seri utama tinta `#0A0A0A`, seri pembanding merah `#E61919`, seri lain abu (`#8F8F8F`, `#474747`) dan merah muda `#FF8A8A`. Garis lurus (`type="linear"`), tanpa isian gradien tebal, grid abu `#E2E2E2`.

## Pola halaman
Sama seperti sebelumnya (tabel kolom No pertama, 25 baris, aksi di kolom terakhir, filter chip, tombol Kembali ke asal, menu aktif tersorot), dengan bahasa visual di atas.

## Gerak
150–200ms, `easeOut`, hanya untuk masuk/keluar panel/modal dan perubahan tab. Tidak ada efek melayang (hover = garis menebal/warna terbalik). Hormati `prefers-reduced-motion`.

## Aksesibilitas
- Kontras: tinta di putih 19:1; merah `#E61919` di putih 4.6:1 (lolos AA untuk teks normal); teks putih di merah 4.6:1. Teks merah kecil (< 12px) pakai `ocean-600` `#C41212`.
- Fokus: outline merah 2px offset 2px di semua elemen fokus (`:focus-visible`).
- Target sentuh ≥ 40px; tidak ada scroll horizontal tingkat halaman di 375px (diverifikasi 20 halaman).

## Dokumen PDF
Dirender di server (`services/api/src/pdf/`), belum mengikuti sistem ini — tindak lanjut terpisah.
