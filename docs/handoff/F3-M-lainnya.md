# F3-M — Kapal, Analitik, Dashboard, Keuangan

Estimasi: 3–4 HK.

---

### F3-M-01 — Detail data kapal
P1 · 4 j · VSL-01
Halaman: `/kapal` (`Vessels.tsx`), `/kapal/:id` (`VesselDetail.tsx`).
Pastikan baris kapal bisa diklik ke detail; detail menampilkan: spesifikasi (LOA, beam, draft, GT/DWT, tahun bangun, klas, bendera, IMO), pemilik (klien), riwayat proyek & docking, survey, dokumen + masa berlaku. Field yang belum ada ditambahkan ke form kapal. Dimensi dipakai validasi drydock (F3-F-01).

### F3-M-02 — Analitik: date picker, hapus prediktif & preskriptif
P1 · 4 j · ANL-01, ANL-02
Halaman `pages/Analytics.tsx`. Rentang bulan memakai dua `DateInput` mode bulan (`<input type="month">`). Hapus tab/kartu Prediktif & Preskriptif beserta sheet ekspor Excel terkait (sekitar baris 728–817) dan i18n yang tak terpakai.

### F3-M-03 — Dashboard: report perlu perhatian per kategori
P1 · 3 j · DSH-01
Halaman `pages/Dashboard.tsx`. Bagian "perlu perhatian" diawali pilihan kategori (Proyek, Inventori, Keuangan, SDM, Equipment, QC, …) sebagai chip; tidak ada yang tampil sebelum kategori dipilih (atau ingat pilihan terakhir di localStorage).

### F3-M-04 — Keuangan: tanggal & sort (sisa F1/F2 lama)
P2 · 1 HK
Halaman `pages/keuangan/Finance.tsx` (5.147 baris — pecah per tab saat disentuh). Semua tabel punya kolom tanggal + sort; Kas Bank, Buku Besar, Neraca, Laba Rugi punya filter rentang tanggal. Verifikasi dulu di F1-01 mana yang sudah ada.
