# F3-L — SDM, Karyawan & Absensi

Halaman: `/sdm` (`pages/sdm/HR.tsx`, 2.382 baris), `/sdm/karyawan/:id` (`KaryawanDetail.tsx`), `/absensi` (`pages/absensi/Absensi.tsx`), `/payroll`. Teks: `i18n/n_hr*.ts`/`n_misc.ts`. Koleksi: `employees`, `leaves`, `letters`, `trainings`, `attendance`, `payroll`.
Tab SDM saat ini: Karyawan, Cuti & Izin, Mutasi, Org Chart, Training, Surat & Impor. Tab Absensi: Catat, Rekap.
Estimasi: 6–8 HK.

**Perhatian data pribadi:** foto KTP, ijazah, status kawin adalah data pribadi (UU PDP). Wajib bergantung pada F2-05: hanya peran HR/direktur yang bisa melihat; file disimpan lewat `/api/files` dengan izin baca terbatas (lihat F4-05).

---

### F3-L-01 — Tabel karyawan & tab
P1 · 3 j · HR-01, HR-04, HR-07
Urutan default stabil berdasarkan `createdAt` asc (data baru di bawah; edit tidak memindah posisi — jangan sort by `updated_at`). Kolom "Dibuat" → "Terakhir diupdate". Sembunyikan tab Mutasi & Org Chart.

### F3-L-02 — Data karyawan lengkap
P0 · 1,5 HK · HR-02, HR-09, HR-10, HR-11
Field baru/ubah:
| Field | Bentuk |
|---|---|
| Tipe karyawan | select: Training, Kontrak, Tetap, Outsourcing |
| Kontrak | Kontrak kerja sama (nomor, mitra), kontrak terakhir (nomor, mulai, selesai) — riwayat di F3-L-05 |
| Jabatan | select dari daftar jabatan (setting `JOB_TITLES`, dapat diedit HR) |
| Pendidikan terakhir | select: SD, SMP, SMA/SMK, D1–D4, S1, S2, S3 |
| Jenis kelamin, Status kawin, Jumlah tanggungan (0–3) | select |
| PTKP | **otomatis**: TK/K + tanggungan → kode PTKP (TK/0…K/3); tampil read-only, dipakai payroll |
| Foto karyawan, Foto KTP, Ijazah terakhir | `PhotoUploader` (KTP & ijazah: izin baca terbatas) |
Fungsi `utils/ptkp.ts` + probe (8 kombinasi). Payroll membaca PTKP dari karyawan.

### F3-L-03 — Skill matriks dengan persentase
P1 · 4 j · HR-03
Modal "Tambah skill": pilih skill dari daftar (bisa tambah baru), level persentase 0–100 (slider + angka), tanggal asesmen, penilai. Matriks menampilkan bar persentase.

### F3-L-04 — Sertifikat lengkap
P1 · 3 j · HR-05
Field: nama sertifikat, nomor, diterbitkan oleh, tanggal terbit, berlaku hingga, file. Peringatan 30 hari sebelum kedaluwarsa (masuk alert modul).

### F3-L-05 — Surat: kontrak, perpanjangan, SP, preview & kop
P0 · 1,5 HK · HR-08
Jenis surat: Kontrak baru, Perpanjang kontrak, SP1/SP2/SP3. Perpanjangan membaca kontrak terakhir dan menyimpan riwayat (`letters` dengan `supersedes`). Kop surat dari setting perusahaan (logo, nama, alamat — upload di Pengaturan). **Preview PDF** (server, `kind` baru di `pdf/registry.ts`) sebelum "Simpan ke arsip". Riwayat kontrak tampil di detail karyawan.

### F3-L-06 — Cuti/izin mandiri via QR
P1 · 1 HK · HR-06 · Bergantung: F2-04
Halaman publik ringan `/f/cuti/:token`: karyawan memindai QR (ditempel di bengkel) → masukkan NIK + PIN/OTP (bukan password akun) → isi form cuti/izin + lampiran → status Diajukan. HR menyetujui di tab Cuti & Izin. Endpoint publik dibatasi rate limit dan hanya bisa membuat pengajuan, tidak membaca data lain.
**Keamanan.** Jangan memakai login penuh di halaman publik; PIN disimpan hash.

### F3-L-07 — Absensi: rekap bulanan, tanpa shift, lembur otomatis
P0 · 1,5 HK · ABS-02…ABS-06
Halaman langsung rekap bulanan (karyawan × tanggal) dengan filter **bulan & tahun**. Hapus shift (jam kerja standar dari setting `WORK_START`, `WORK_HOURS=8`). Lembur otomatis = jam kerja − 8 jam, dibatasi `OVERTIME_MAX_DAILY` (default 4) dan `OVERTIME_MAX_WEEKLY` (default 18; sesuaikan aturan ketenagakerjaan yang berlaku — konfirmasi HR). Hapus grafik tren kehadiran. Input jam memakai `TimeInput24` (E2 lama). Fungsi `utils/overtime.ts` + probe.

### F3-L-08 — Integrasi alat absensi
P2 · 1–2 HK · ABS-01 · Keputusan: Q14 (ingest generik + CSV)
Endpoint `POST /api/attendance/ingest` (API key per perangkat) menerima `{deviceId, employeeNo, timestamp, type}`; "status hari ini" dihitung dari data alat. Format persis menunggu merk alat (Q14); sediakan juga impor CSV sebagai fallback.
