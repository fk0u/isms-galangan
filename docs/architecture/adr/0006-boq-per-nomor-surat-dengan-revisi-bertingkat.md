# ADR-0006: BoQ per nomor surat dengan revisi bertingkat

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
PRJ-19/21 (krusial). Q5: contoh dokumen asli belum ada.

## Opsi
1. Kolom nomor surat di baris BoQ.
2. **Koleksi `boqDocs` (surat) + `boq.boqDocId`; revisi = surat baru `supersedes`.**

## Keputusan
Opsi 2. Surat Disetujui terkunci; Change Order disetujui direktur (owner) lalu otomatis membuat revisi. Format PDF memakai default umum (nomor, revisi, tabel item, total, tanda tangan) sampai contoh asli diterima.

## Konsekuensi
Migrasi data lama ke surat `Rev 0`. Format PDF mungkin berubah saat contoh asli datang (perubahan template saja).
