# F3-H — Equipment

Halaman: `/equipment` (`pages/equipment/Equipment.tsx`, 3.116 baris — pecah per bagian), teks `i18n/n_eqp.ts`. Koleksi: `equipment`, `bookings`, `maintenances`, `calibrations`.
Tab saat ini: Register, Alokasi/Booking, Sedang Dipakai, Maintenance, Kalibrasi, Biaya, Utilisasi.
Estimasi: 3–4 HK.

---

### F3-H-01 — Form & tabel equipment
P0 · 1 HK · EQP-01, EQP-02
**Pemetaan field** (simpan nama field data lama bila maknanya sama; tambahkan yang baru):
| Lama | Baru | Catatan |
|---|---|---|
| Cabang | (hidden) | default `"Samarinda"`/cabang sesi |
| Nomor seri | Tahun unit | `unitYear` (number) — data lama `serial` dipertahankan tapi tidak ditampilkan |
| — | Tahun akuisisi | `acquisitionYear` baru |
| PIC | Penanggung jawab unit | `pic` → ganti label, pakai `SearchSelect` karyawan |
| Model | Merk | `brand`; migrasi nilai `model` → `brand` bila kosong |
| Utilisasi awal | Estimasi utilisasi saat ini (%) | |
| Umur ekonomis | Estimasi umur pakai (bulan) | konversi tahun→bulan untuk data lama |
| — | Keterangan | `note` |
| Harga perolehan | Harga barang | `MoneyInput` |
| Tarif pakai, Harga BBM | disembunyikan | field tetap di data; setting `SHOW_EQP_COST_FIELDS=0` |
Tabel memakai kolom yang sama dengan form (Kode, Nama, Merk, Tahun unit, Penanggung jawab, Status, Estimasi utilisasi, Aksi).
**Kriteria.** [ ] Data lama tetap tampil benar setelah pemetaan.

### F3-H-02 — Tab & kartu ringkasan
P0 · 4 j · EQP-03, EQP-04
Tab menjadi: **Daftar Equipment** (+ Utilisasi bila tetap dipakai — konfirmasi). Hapus tab Alokasi/Booking, Sedang Dipakai, Maintenance, Kalibrasi, Biaya (pindahkan logika yang masih diperlukan ke delegasi, F3-H-03). Kartu: Total · Sedang terpakai · Dalam maintenance (kalibrasi + service).

### F3-H-03 — Delegasi peminjaman
P0 · 1,5 HK · EQP-05
**Langkah.** Aksi "Delegasi" per equipment membuka panel: riwayat delegasi + form baru. Tipe delegasi: **Peminjaman** (ke proyek/karyawan, tanggal mulai–selesai, kondisi keluar/kembali) atau **Maintenance** (service/kalibrasi, vendor/teknisi, tanggal, biaya `MoneyInput`, catatan). Data disimpan di koleksi yang sudah ada: peminjaman → `bookings`, maintenance → `maintenances`/`calibrations` (tambahkan `type` bila perlu). Status equipment dihitung dari delegasi aktif. Biaya maintenance tetap masuk biaya proyek bila ada `projectId` (`utils/projectCost.ts`).
**Kriteria.** [ ] Equipment yang sedang dipinjam tidak bisa didelegasikan lagi di rentang tanggal yang sama (server 409).
