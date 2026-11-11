# ADR-0024: Relasi lunak (berbasis nama) dijaga di server

- **Status:** Accepted
- **Tanggal:** 2026-11-11
- **Pemutus:** CTO (permintaan audit "sistem relasi data, sinkronisasi, integrasi antar modul harus aman")

## Konteks
Sebagian relasi antar-modul menyimpan NAMA induk, bukan id: kapal (`vessel`),
klien (`client`, `owner`), subkon (`sub`), vendor (`vendor`, `v`), equipment
(`equip`), dan manajer proyek (`manager`). Daftarnya ada di `SOFT_REFS`.
Relasi ini tidak divalidasi saat tulis karena data lama berisi nama.

Audit 11 Nov 2026 menemukan tiga celah:
1. Ganti nama induk hanya dikaskade di FE untuk kapal (4 tabel saja), dan sama
   sekali tidak untuk klien/vendor/subkon/equipment/karyawan. Akibatnya tautan
   anak putus diam-diam.
2. Delete-guard (`findUsages`) hanya memeriksa relasi keras (`REFS`), jadi
   klien/vendor yang masih dipakai bisa dihapus.
3. Skrip `purge-seed-demo` menghapus induk seed tetapi mempertahankan anak yang
   pernah disentuh pengguna. Itulah sumber rujukan yatim di produksi
   (dokumen & change order ke proyek `RF-2026-002`, RFQ ke `PR-6B3CE537`).
   Rujukan itu tidak punya jejak `delete` di `audit_log`.

## Opsi
1. Tidak melakukan apa-apa (tautan tetap rapuh).
2. Migrasi semua relasi lunak ke id. Ini paling bersih, tetapi menyentuh ribuan
   baris produksi dan semua form. CTO meminta tidak ada perubahan database
   saat ini.
3. Pertahankan penyimpanan nama, tetapi jaga relasinya di server.

## Keputusan
Opsi 3. `SOFT_REFS` dipindah ke `services/api/src/refs.ts`, lalu:
- **Hapus:** `findUsages` ikut memeriksa pemakai lunak lewat nama (trim,
  case-insensitive) atau id. Induk yang masih dipakai mendapat 409 REFERENCED.
  Pengecualian: bila ada induk lain dengan nama kembar, tautan anak tetap
  hidup, jadi penghapusan diizinkan.
- **Ganti nama:** PATCH induk yang mengubah `name` menjalankan
  `cascadeSoftRename`. Semua anak ikut diganti dalam transaksi yang sama, dan
  tiap baris anak diaudit dengan penanda `_cascade`. Ganti nama ke nama induk
  lain ditolak dengan 409, karena tautan keduanya akan tercampur.
- **Ref wajib:** `RefDef.required` ditegakkan saat CREATE non-seed. Saat ini
  hanya `movements.itemId`, karena mutasi tanpa item tidak menggerakkan stok.
- **Header `x-seed-import`:** hanya dihormati untuk direktur/developer. Dulu
  header ini membuka bypass rate limit dan sebagian aturan bisnis untuk peran
  apa pun.
- **`purge-seed-demo`:** induk yang masih dirujuk baris yang dipertahankan ikut
  dipertahankan.
- **`npm run report:integrity`:** laporan baca-saja untuk rujukan yatim.

FE `Vessels.tsx` tidak lagi mengaskade sendiri saat tersambung server. Ia
cukup menarik ulang koleksi anak; SSE juga memberi tahu klien lain.

## Konsekuensi
- Ganti nama induk kini menyentuh banyak baris dalam satu transaksi, sehingga
  `updated_at` anak berubah. Klien yang sedang menyunting anak bisa mendapat
  409 STALE, lalu memuat ulang. Itu perilaku yang diharapkan.
- Rujukan yatim yang sudah ada di produksi TIDAK diperbaiki otomatis (keputusan
  CTO: jangan ubah data). Lihat `npm run report:integrity`.
- Cara membalik: hapus panggilan `softUsages`/`cascadeSoftRename` di
  `refs.ts`/`crud.ts`. Data tidak perlu dimigrasi.
