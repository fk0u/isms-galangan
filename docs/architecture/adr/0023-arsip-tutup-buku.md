# ADR-0023: Arsip tutup buku sebagai snapshot immutable di tabel khusus

- **Status:** Accepted
- **Tanggal:** 2026-11-05
- **Pemutus:** Kou (owner), catatan klien 5 Nov 2026 (#314)

## Konteks
Tutup buku (#283) hanya menyimpan daftar periode terkunci. Klien meminta tutup buku menjadi **arsip dan laporan historis**: kondisi keuangan akhir bulan/tahun bisa dilihat dan dibandingkan kapan saja tanpa membuka kunci, dan tidak ikut berubah oleh transaksi sesudahnya. Neraca/Neraca Lajur sejauh ini dihitung ulang di browser dari jurnal live.

## Opsi
1. Tidak melakukan apa-apa: periode lama selalu dihitung ulang dari jurnal (berubah bila jurnal dikoreksi setelah dibuka).
2. Snapshot dihitung klien lalu dikirim ke server. Kelemahannya, angka arsip bisa dimanipulasi dan bergantung versi browser.
3. Koleksi envelope baru `closingArchives` lewat CRUD generik. Kelemahannya, perlu didaftarkan di policy/store/PREFIX dan harus diblokir tulisnya agar tetap immutable.
4. **Tabel `closingArchives` khusus, ditulis hanya oleh rute `/api/closing`; snapshot dihitung server dari jurnal.**

## Keputusan
Opsi 4. `POST /api/closing` (bulan/tahun) menghitung snapshot dengan `buildSnapshot` (neraca lajur, neraca, laba rugi, kas & bank, nilai persediaan), menyimpannya sebagai `ARC-<periode>-v<n>`, **sebelum** periode dikunci; gagal arsip berarti periode tidak jadi tutup. Tutup tahun mengarsip setelah jurnal persediaan dicatat. Tidak ada rute ubah/hapus arsip, dan tabel bukan koleksi CRUD (PATCH `/api/closingArchives/:id` = 404). Tutup ulang setelah buka kunci menambah versi baru; versi lama tetap ada. Periode yang sudah terkunci sebelum fitur ini dibuatkan arsip lewat `POST /api/closing/backfill` dan ditandai `backfilled` (dihitung dari jurnal saat ini). Baca arsip dibatasi peran penutup buku (Keuangan, Pajak, Direktur, Developer).

## Konsekuensi
- Logika neraca kini ada di dua tempat (frontend untuk tampilan live, server untuk arsip); `buildSnapshot` dijaga tes dengan angka yang sama.
- Hutang/Piutang per pihak belum masuk snapshot v1 (butuh logika as-of pembayaran); ditambah sebagai versi lanjutan.
- Untuk menjadikannya koleksi biasa nanti: daftarkan di `COLLECTIONS/PREFIX`, `policy.ts`, `store.tsx`, dan blokir tulis non-server.
