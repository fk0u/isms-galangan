# ADR-0013: Design system "Swiss Industrial" (putih netral + aksen merah)

- **Status:** Accepted
- **Tanggal:** 2026-10-09
- **Pemutus:** Kou (owner)

## Konteks
Owner meminta redesain menyeluruh UI dengan arah *industrial brutalist*, aksen merah, dan warna netral putih. UI sebelumnya bergaya SaaS biru-navy dengan radius besar, gradien, dan bayangan lembut. Ada ±46 ribu baris halaman; menyunting tiap halaman tidak realistis untuk demo Sabtu.

## Opsi
1. Tidak berubah.
2. Tulis ulang tiap halaman ke komponen baru.
3. **Redesain lewat token & komponen inti:** petakan ulang palet lama ke sistem baru, override palet default Tailwind di `@theme`, radius/bayangan/gradien dinolkan secara global, lalu desain ulang komponen inti, shell, dan login.

## Keputusan
Opsi 3, arketipe **Swiss Industrial Print (light)** dari skill industrial-brutalist (mode Telemetry gelap ditolak karena owner meminta netral putih). Satu aksen `#E61919`; tinta `#0A0A0A`; abu netral; Inter (900 untuk makro) + JetBrains Mono (mikro). Nama token lama dipertahankan sebagai alias agar ±2.600 pemakaian di halaman ikut berubah tanpa disentuh; 228 hex warna grafik dipetakan dengan codemod.

Konflik dengan revisi klien PRJ-04 ("card status diberi warna gradient"): gradien diganti bar warna solid 3px di atas kartu; bagian lain PRJ-04 (hapus grafik di card) dipenuhi.

## Konsekuensi
- Seluruh aplikasi berubah dalam satu PR, risiko regresi fungsional rendah (hanya kelas/warna).
- Nama token lama (`navy`, `ocean`, `teal`) kini menyesatkan secara makna; kode baru wajib memakai nama semantik (`ink`, `accent`, `steel`, `surface`). Rename massal bisa dilakukan di F6 (PEMBERSIH).
- Status hijau hilang: "OK" ditampilkan sebagai tinta solid. Bila klien butuh hijau untuk sukses, tambahkan satu warna fungsional lewat ADR baru.
- PDF server belum mengikuti sistem ini.
- Membalik keputusan: kembalikan blok `colors`/`@theme` (satu commit).
