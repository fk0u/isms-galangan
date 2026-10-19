# ADR-0022: Nomor voucher jurnal diberikan server per transaksi

- **Status:** Accepted
- **Tanggal:** 2026-10-19
- **Pemutus:** Kou (owner), jawaban klien Q24 di `docs/planning/decisions.md`

## Konteks
Klien meminta voucher jurnal untuk **semua transaksi yang berdampak ke Keuangan & Billing** (K17-FIN-08, #193). Jurnal ditulis dari banyak tempat: pelunasan invoice, bayar hutang, bayar gaji (`postCashJournal`), dan jurnal manual. Satu transaksi bisa terdiri dari beberapa baris dengan `dokumen` yang sama. Belum ada nomor bukti yang urut dan bisa dicetak.

## Opsi
1. Tidak melakukan apa-apa: voucher dicetak dari `dokumen` saja. Kelemahannya, `dokumen` tidak urut dan formatnya berbeda-beda per modul.
2. Klien (browser) memberi nomor saat menulis jurnal. Kelemahannya, nomor bisa bentrok antarperangkat dan harus diulang di setiap modul.
3. Koleksi `vouchers` baru. Kelemahannya, perlu migrasi, relasi, dan sinkronisasi dua arah dengan jurnal.
4. **Server memberi `voucherNo` di rute CRUD `journals` saat baris dibuat.**

## Keputusan
Opsi 4. `voucherNo` disimpan di baris `journals` dengan format `VJ/YYYY/MM/NNNN` (urut per bulan tanggal jurnal). Baris dengan `dokumen` yang sama memakai nomor yang sama. Karena semua jurnal lewat satu rute, semua transaksi keuangan otomatis bernomor tanpa mengubah tiap modul. PDF `voucher` merakit seluruh baris bernomor sama (debit/kredit per akun, total, tanda tangan). Jurnal lama dinomori dengan `npm run sync:voucher-numbers` (dry-run; `-- --apply` untuk menulis).

## Konsekuensi
- Modul baru yang menulis jurnal tidak perlu tahu soal voucher.
- Penentuan nomor memindai jurnal bulan itu (ponytail: cukup untuk ribuan jurnal per bulan; beri kolom + indeks bila lebih). Dua POST yang tepat bersamaan dari dua perangkat secara teori bisa mendapat nomor sama; risikonya kecil untuk satu tim keuangan. Pengaman berikutnya bila diperlukan: indeks unik pada kolom voucher.
- Membalik keputusan: hapus panggilan `withVoucherNo` di `crud.ts`; field `voucherNo` yang sudah ada tidak mengganggu apa pun.
