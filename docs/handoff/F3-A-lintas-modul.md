# F3-A — Lintas Modul

Komponen bersama yang dipakai semua modul. **Kerjakan dulu** sebelum task F3 lain, karena task lain memakai komponennya.
Estimasi: 2–3 HK.

---

### F3-A-01 — Hapus filter cabang di top bar
P0 · 3 j · Revisi: ETC-01 · Keputusan: ADR-0003 (satu cabang)

**Konteks.** `layouts/AppShell.tsx` (sekitar baris 540–560) menampilkan `<select>` cabang yang memanggil `setBranch` dari `useStore()`. Store menyaring data lewat `inBranch` (`data/store.tsx`). Nilai cabang disimpan di `localStorage` (`BRANCH_KEY`).
**Langkah.**
1. Hapus elemen select dari top bar (desktop & mobile).
2. Jangan hapus `branch`/`inBranch` di store — set nilai efektif dari sesi user (`user.branch`, default `"SEMUA"`), bukan dari input user. Hapus pembacaan `BRANCH_KEY` dari localStorage.
3. Pastikan halaman yang menampilkan label cabang (kartu, filter internal) tidak rusak.
**Kriteria terima.**
- [ ] Top bar tanpa filter cabang di semua lebar layar.
- [ ] Data tampil sama seperti sebelumnya untuk akun direktur.
- [ ] `npm run check` lulus (probe render 28 halaman).
**Jangan.** Menghapus kolom `branch` di data atau API.

---

### F3-A-02 — Format titik untuk semua input harga
P0 · 1 HK · Revisi: ETC-02

**Konteks.** Komponen `MoneyInput` sudah ada di `components/ui.tsx` (~baris 1875) dengan `parseRupiah` di `utils/format.ts`, dan sudah dipasang di Finance, Payroll, Procurement, Subkon, BoQ, Equipment. Masih ada input harga memakai `NumInput`/`<input type="number">` di modul lain.
**Langkah.**
1. Cari kandidat: `grep -rnE "(harga|price|biaya|cost|nilai|amount|amt|tarif|gaji|upah|total)" src/pages src/components | grep -E "type=\"number\"|NumInput"`.
2. Ganti dengan `MoneyInput` untuk field bernilai rupiah saja (bukan qty, persen, jam).
3. Tambah probe kecil `scripts/money-probe.ts` (format 1000000 → "1.000.000", parse balik, nilai kosong, negatif ditolak) dan daftarkan di `check`.
**Kriteria terima.**
- [ ] Tidak ada input harga tanpa pemisah ribuan (sertakan daftar file yang diubah).
- [ ] Nilai tersimpan tetap number (bukan string bertitik) — cek satu baris di DB.

---

### F3-A-03 — Pagination tabel diperbaiki
P1 · 4 j · Revisi: ETC-07

**Konteks.** `usePager(total, defaultSize)` di `components/ui.tsx` (~baris 1385) dipakai ±27 tempat; default 100. Klien mengeluhkan tampilan pagination di bawah tabel.
**Langkah.** Satu komponen `<Pager>` bersama: info "1–25 dari 312", pilihan ukuran 10/25/50/100, tombol awal/sebelumnya/nomor halaman (maks 5)/berikutnya/akhir; responsif (mobile hanya prev/next + info). Default ukuran 25 di semua pemanggil. Reset ke halaman 1 saat filter/search berubah.
**Kriteria terima.**
- [ ] Semua tabel memakai `<Pager>` yang sama.
- [ ] Mengubah filter tidak meninggalkan user di halaman kosong.

---

### F3-A-04 — Komponen bersama untuk task berikutnya
P0 · 1 HK

Buat sekali, dipakai banyak task (letakkan di `components/`):
| Komponen | Dipakai di | Spesifikasi |
|---|---|---|
| `SearchSelect` | PRJ-11, DRY-04, PRJ-26, PRJ-30, HR-10 | Perluas `EntityPicker` (ui.tsx ~975) bila cukup; dropdown searchable, keyboard, label + sublabel (mis. stok) |
| `DateInput` | DRY-04, DRY-05, ANL-01 | `<input type="date">` dengan format tampilan dd/mm/yyyy, nilai ISO |
| `TimeInput24` | ABS, E2 | Teks masking `HH:MM` 24 jam (pakai `utils/time24.ts` `norm24`) |
| `PhotoUploader` | PRJ-17, MON-01, SUB-04, HR-09, HR-05 | Upload ke `POST /api/files`, preview thumbnail, banyak foto, caption |
| `ChangeHistory` | PRJ-17, SUB-04 | Daftar perubahan dari `GET /api/audit?table=&rowId=` (nama, waktu, before→after) |
| `StatusChips` | PRJ-05, SUB-03 | Filter berbentuk deretan chip, animasi slide (framer-motion sudah terpasang) |
**Kriteria terima.** Tiap komponen punya contoh pemakaian di satu halaman dan lolos probe render.
