# ADR-0011: Rumus progres proyek berbobot

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Q11 / PRJ-08.

## Opsi
1. Rata-rata sederhana WBS.
2. **Rata-rata progres WBS berbobot nilai BoQ (fallback anggaran task, lalu bobot sama).**
3. Berdasarkan milestone.

## Keputusan
Opsi 2 di `utils/projectProgress.ts`, satu fungsi untuk semua halaman.

## Konsekuensi
Angka progres proyek lama akan berubah; dijelaskan ke klien saat demo.
