# TASK DAN ROADMAP PENYELESAIAN CATATAN CTO & TIM (11 - 13 OKTOBER 2026)

Dokumen ini memetakan seluruh notulensi, evaluasi, dan catatan kebutuhan dari **Kak Nanda (CTO Alenkosa)** dan **Ghani** pada tanggal 11, 12, dan 13 Oktober 2026 untuk sistem **ISMS PT Syukur Bersaudara**.

---

## 1. Ringkasan Status Global

| Kategori Modul | Total Catatan | Selesai (PR #120 - #146) | Status / Target Lanjutan |
|---|:---:|:---:|:---:|
| **Manajemen Proyek** | 18 | **18 (100%)** | Selesai (Termasuk WBS Foto & Pending Req Bersih di PR #146) |
| **Monitoring Proyek** | 3 | **3 (100%)** | Selesai |
| **Drydock & Kapasitas** | 2 | **2 (100%)** | Selesai |
| **Inventori & Material** | 7 | **6** | 1 Butir Penyempurnaan (BOM Checklist Barang Masuk/Keluar) |
| **Procurement** | 5 | **5 (100%)** | Selesai |
| **Subkontraktor** | 3 | **3 (100%)** | Selesai (Termasuk Skema Ajukan Termin di PR #145) |
| **QC & Safety** | 3 | **2** | 1 Butir Penyempurnaan (Kuesioner Inspeksi per Proyek) |
| **SDM & Karyawan** | 8 | **8 (100%)** | Selesai |
| **Keuangan & CRM** | 3 | **3 (100%)** | Selesai |
| **Dashboard & Eksekutif** | 2 | **2 (100%)** | Selesai |
| **Standar UI & Branding** | 2 | **2 (100%)** | Selesai (Bebas Em Dash & Branding PT Syukur Bersaudara) |

---

## 2. Pembagian Task & Rincian Implementasi

### MODUL 1: MANAJEMEN PROYEK

- [x] **TASK-PRJ-01: Filter Status Animasi Pop-up Deret ke Kanan + Tombol "Lainnya"**
  - **Deskripsi:** Filter status saat tombol filter diklik tampil berderet ke kanan. Di paling kanan terdapat tombol "Lainnya" untuk membuka filter detail secara vertikal ke bawah.
  - **Status:** Selesai (PR #120 / `Projects.tsx`).
  - **Cek Fungsi:** Buka `/proyek`, klik tombol filter, pilih filter status horizontal, lalu klik "Lainnya" untuk melihat filter dropdown lanjutan.

- [x] **TASK-PRJ-02: Isolasi BoQ per Proyek (Pencegahan BoQ Bentrok)**
  - **Deskripsi:** Saat membuat BoQ di Proyek A, Proyek B tidak boleh ikut terisi BoQ yang sama.
  - **Status:** Selesai (PR #120 / `BoQSection.tsx` terisolasi dengan filter `projectId`).
  - **Cek Fungsi:** Buka Proyek A, buat BoQ baru. Buka Proyek B, pastikan daftar BoQ Proyek B kosong / hanya memuat BoQ miliknya.

- [x] **TASK-PRJ-03: Form Tambah Proyek: Filter Hanya Project Manager**
  - **Deskripsi:** Dropdown PM di form tambah proyek hanya menampilkan karyawan dengan jabatan atau departemen Project Manager.
  - **Status:** Selesai (PR #120).
  - **Cek Fungsi:** Buka modal "Tambah Proyek", periksa opsi Project Manager tidak memuat manager departemen lain.

- [x] **TASK-PRJ-04: Akumulasi Bobot WBS & Informasi Sisa Alokasi Real-Time**
  - **Deskripsi:** Saat menambah tahapan WBS, akumulasi bobot saat ini dan sisa alokasi (100% - total) ditampilkan real-time di bawah input bobot (default 0).
  - **Status:** Selesai (PR #121 / `WbsTree.tsx` & `ProjectDetail.tsx`).
  - **Cek Fungsi:** Di tab WBS, klik "Tambah Tahapan", ketik bobot 10%, periksa label sisa alokasi 90%.

- [x] **TASK-PRJ-05: Struktur WBS Toggle Hide & Show (Default Hide)**
  - **Deskripsi:** Tampilan hierarki worktree WBS default tertutup (hanya tahapan utama), dapat di-toggle buka/tutup.
  - **Status:** Selesai (PR #121 / `ProjectDetail.tsx`).
  - **Cek Fungsi:** Buka tab WBS, periksa default toggle ringkas dan tombol toggle untuk membuka rincian pohon pekerjaan.

- [x] **TASK-PRJ-06: WBS Baru Tanpa Template Otomatis (Kosongkan di Awal)**
  - **Deskripsi:** Proyek baru tidak otomatis diisi template tahapan WBS default, user bebas mengisi dari awal.
  - **Status:** Selesai (PR #121).
  - **Cek Fungsi:** Buat proyek baru, tab WBS bersih tanpa baris dummy bawaan.

- [x] **TASK-PRJ-07: Penggantian Istilah Tahap "Desain" Menjadi "Perencanaan"**
  - **Deskripsi:** Teks alur tahapan proyek dari "Desain" diubah menjadi "Perencanaan".
  - **Status:** Selesai (PR #122).
  - **Cek Fungsi:** Cek strip tahapan proyek dan badge status di tab ringkasan bertuliskan "Perencanaan".

- [x] **TASK-PRJ-08: BoQ Diajukan Otomatis Muncul di Tab Dokumen & Modul Dokumen**
  - **Deskripsi:** BoQ berstatus Diajukan otomatis terdaftar di tab "Dokumen & Laporan" proyek dan modul Dokumen global beserta informasi pembuatnya.
  - **Status:** Selesai (PR #122 / `BoqDocsSection.tsx`).
  - **Cek Fungsi:** Ajukan BoQ, buka tab Dokumen & Laporan serta halaman `/dokumen`, verifikasi BoQ terdaftar.

- [x] **TASK-PRJ-09: Live Akumulasi Quantity & Harga Satuan pada Form BoQ**
  - **Deskripsi:** Kalkulasi otomatis subtotal (Qty × Harga Satuan) tampil di bawah field harga satuan.
  - **Status:** Selesai (PR #122).
  - **Cek Fungsi:** Di form tambah item BoQ, ubah volume dan tarif, periksa label subtotal live yang berformat Rupiah.

- [x] **TASK-PRJ-10: Pilihan Kondisi Sea Trial (Sudah Sesuai, Tidak Sesuai, Perlu Diperbaiki)**
  - **Deskripsi:** Form commissioning/trial opsi kondisi diubah menjadi 3 pilihan baku.
  - **Status:** Selesai (PR #122 / `ProjectDetail.tsx`).
  - **Cek Fungsi:** Di tab Terkait > Tambah Trial, periksa dropdown kondisi memuat 3 opsi tersebut.

- [x] **TASK-PRJ-11: Alur Class Approval & Tombol Direct Masalah**
  - **Deskripsi:** Persyaratan class approval menampilkan requirement yang belum selesai beserta direct button (unggah dokumen / buka WBS).
  - **Status:** Selesai (PR #125).
  - **Cek Fungsi:** Di tab Ringkasan > Perencanaan & Class Approval, klik direct button pada item pending, verifikasi modal atau tab yang sesuai langsung terbuka.

- [x] **TASK-PRJ-12: Detail Proyek: Pending Requirement Kosong (Tanpa Template) & Tombol Hapus Hanya di Item Pending**
  - **Deskripsi:** Catatan 13 Okt 23:12: Bagian pending requirements jangan diberi template bawaan (kosongkan bila belum ada custom requirements). Tombol hapus hanya tampil pada item pending, pada item selesai tidak boleh ada tombol hapus.
  - **Status:** Selesai (PR #146).
  - **Cek Fungsi:** Buka detail proyek baru, buka "Lihat Persyaratan", pastikan daftar mulai kosong. Tambah requirement kustom baru, pastikan ada tombol hapus (Trash) di item pending. Saat item selesai, pastikan tombol hapus tidak muncul.

- [x] **TASK-PRJ-13: Wajib Upload Image Bukti Progres WBS + Tempat Upload Foto (Online & Offline)**
  - **Deskripsi:** Form update progres WBS wajib melampirkan foto bukti, dilengkapi tempat upload foto (`PhotoUploader`) yang andal baik online maupun offline fallback.
  - **Status:** Selesai (PR #146).
  - **Cek Fungsi:** Di tab WBS, klik "Update Progres". Coba naikkan persentase tanpa foto, sistem akan memblokir dengan toast. Pilih file gambar pada area dropzone `PhotoUploader`, foto berhasil dipratinjau dan disimpan ke log riwayat WBS.

- [x] **TASK-PRJ-14: Panduan Langkah Step-by-Step Setelah Membuat Proyek Baru**
  - **Deskripsi:** Banner instruksi pemula memandu user setelah membuat proyek (1. Isi Tim, 2. Buat WBS, 3. Upload Dokumen Desain).
  - **Status:** Selesai (PR #124).
  - **Cek Fungsi:** Buat proyek baru, cek banner instruksi 3 langkah pemula di bagian atas.

- [x] **TASK-PRJ-15: Penataan Layout Modal Sparepart, Tim, dan Penugasan WBS**
  - **Deskripsi:** Form garansi di sebelah kanan teknisi, height modal responsif sesuai status dropdown aktif.
  - **Status:** Selesai (PR #123 & PR #124).
  - **Cek Fungsi:** Periksa modal tambah sparepart, tambah tim, dan penugasan WBS tidak terpotong atau memiliki blank space berlebih.

---

### MODUL 2: MONITORING PROYEK

- [x] **TASK-MON-01: Label "Perhatian Khusus" Warna Merah**
  - **Deskripsi:** Mengganti label "Proyek Butuh Perhatian" menjadi "Perhatian Khusus" bernuansa merah.
  - **Status:** Selesai (PR #126 / `Monitoring.tsx`).
  - **Cek Fungsi:** Buka `/monitoring`, periksa kartu status merah bertuliskan "Perhatian Khusus".

- [x] **TASK-MON-02: Informasi Siapa yang Mengupdate Progres (Pembeda Role / RBAC)**
  - **Deskripsi:** Riwayat update progres menampilkan nama karyawan dan role yang melakukan update.
  - **Status:** Selesai (PR #126 / `MonitoringFeed.tsx`).
  - **Cek Fungsi:** Buka feed update di `/monitoring`, periksa badge role dan nama aktor pembaru progres.

- [x] **TASK-MON-03: Tabel Update Pekerjaan di Bagian Bawah Halaman**
  - **Deskripsi:** Menempatkan list tabel pekerjaan di bagian bawah setelah card tahapan.
  - **Status:** Selesai (PR #126).
  - **Cek Fungsi:** Buka `/monitoring`, scroll ke bagian paling bawah untuk melihat tabel pekerjaan lengkap dengan tombol detail.

---

### MODUL 3: DRYDOCK & KAPASITAS

- [x] **TASK-DRY-01: Manajemen Spesifikasi Dock (Tambah & Hapus Detail Panjang/Lebar/DWT)**
  - **Deskripsi:** Tambah dan hapus fasilitas galangan dock dengan spesifikasi teknis lengkap.
  - **Status:** Selesai (PR #127 / `Drydock.tsx`).
  - **Cek Fungsi:** Buka tab Kapasitas Dock di `/drydock`, klik "Tambah Fasilitas Dock", isi spesifikasi dimensi.

- [x] **TASK-DRY-02: Tabel List Dock di Bagian Bawah Halaman**
  - **Deskripsi:** Menempatkan tabel inventori fasilitas dock di posisi bawah halaman manajemen kapasitas.
  - **Status:** Selesai (PR #127).
  - **Cek Fungsi:** Periksa tabel fasilitas dock terpasang rapi di bagian bawah halaman.

---

### MODUL 4: INVENTORI & MATERIAL

- [x] **TASK-INV-01: Pilihan Eceran 2 Button (Ya / Tidak)**
  - **Deskripsi:** Input eceran pada tambah material menggunakan tombol toggle Ya / Tidak.
  - **Status:** Selesai (PR #128).
  - **Cek Fungsi:** Buka modal "Tambah Material" langkah ke-2, verifikasi toggle button Ya / Tidak.

- [x] **TASK-INV-02: Pergerakan Barang Urutan Descending (Data Terbaru di Page 1)**
  - **Deskripsi:** Riwayat mutasi stok dan kartu stok diurutkan descending (terbaru di atas).
  - **Status:** Selesai (PR #128).
  - **Cek Fungsi:** Buka tab Mutasi/Pergerakan, pastikan transaksi paling baru berada di baris pertama halaman 1.

- [x] **TASK-INV-03: Form Stok Minimum Dipindah ke Tab Identitas & Hilangkan Stok Awal**
  - **Deskripsi:** Field stok minimum dipindahkan ke tab identitas, form stok awal ditiadakan saat tambah material (masuk via PO barang datang).
  - **Status:** Selesai (PR #128).
  - **Cek Fungsi:** Tambah material baru, pastikan tab identitas memuat stok minimum dan tidak ada input stok gudang awal.

- [x] **TASK-INV-04: BOM Transfer Antar Gudang: Gudang Tujuan Tanpa Gudang Asal**
  - **Deskripsi:** Dropdown gudang tujuan mengecualikan gudang sumber yang sedang dipilih.
  - **Status:** Selesai (PR #128).
  - **Cek Fungsi:** Pada modal transfer stok BOM, pilih gudang asal "Gudang Utama", periksa gudang tujuan tidak memuat "Gudang Utama".

- [ ] **TASK-INV-05: Checklist Terima Barang BOM (Procurement vs Additional)**
  - **Deskripsi:** Tab penerimaan BOM berbentuk tabel checklist dengan 2 kategori: berdasarkan procurement dan additional (tanpa procurement). Untuk barang keluar, bentuk list permintaan procurement + checklist additional.
  - **Status:** Dalam Pengerjaan (Refinement Tab BOM).
  - **File:** `apps/web/src/pages/inventori/Inventory.tsx`.
  - **Rencana Uji:** Buka tab BOM, verifikasi pemisahan checklist penerimaan barang procurement vs additional.

---

### MODUL 5: PROCUREMENT

- [x] **TASK-PRO-01: PO Besar "Stok Gudang Saja" Ubah Form Proyek Jadi Pilihan Gudang**
  - **Deskripsi:** Saat memilih stok gudang, field proyek berubah menjadi pilihan gudang target.
  - **Status:** Selesai (PR #130 / `Procurement.tsx`).
  - **Cek Fungsi:** Buat PO Besar, pilih tipe "Stok Gudang Saja", periksa field input proyek berganti menjadi dropdown pilihan gudang.

- [x] **TASK-PRO-02: PO Besar Baris Item Selectable di Bagian Atas**
  - **Deskripsi:** Tabel baris item ditaruh di atas dan selectable.
  - **Status:** Selesai (PR #130).
  - **Cek Fungsi:** Buka form PO Besar, periksa posisi tabel item di posisi atas form.

- [x] **TASK-PRO-03: Terima Barang PO Besar Tampilkan List Item Permintaan & Alokasi**
  - **Deskripsi:** Modal terima barang menampilkan daftar item terpesan beserta tujuan barang dan kuantitas otomatisasi.
  - **Status:** Selesai (PR #130).
  - **Cek Fungsi:** Pada aksi "Terima Barang" di PO Besar, periksa rincian tabel barang pesanan sebelum submit penerimaan.

- [x] **TASK-PRO-04: PO Kecil Lampirkan Upload File Bukti / Nota**
  - **Deskripsi:** Tambah PO kecil menyertakan upload file nota/struk bukti transaksi.
  - **Status:** Selesai (PR #130).
  - **Cek Fungsi:** Buat PO Kecil, unggah berkas nota / kuitansi pembelian.

- [x] **TASK-PRO-05: Koneksi Permintaan Item dengan Inventori & Tombol Tambah Material**
  - **Deskripsi:** Jika item material belum terdaftar di inventori, disediakan tombol direct tambah material yang membuka modal inventori.
  - **Status:** Selesai (PR #130).
  - **Cek Fungsi:** Ketik nama item baru di permintaan material, klik "Tambah ke Master Material".

---

### MODUL 6: SUBKONTRAKTOR

- [x] **TASK-SUB-01: Skema Termin pada Modal "Ajukan Termin" (Persentase, DP 1/2, Kontan)**
  - **Deskripsi:** Modal ajukan termin memiliki selector skema pembayaran dengan preset 1-klik, kalkulasi nominal otomatis dari kontrak WO, dan live breakdown potongan pajak/retensi.
  - **Status:** Selesai (PR #145 / `Subcontractor.tsx`).
  - **Cek Fungsi:** Di tab Termin, klik "Ajukan Termin". Pilih skema "Persentase" (klik preset 30%), pilih skema "DP / Termin" (klik preset DP 1 50%), pilih skema "Kontan" (100% sisa). Periksa nominal dan rincian neto langsung terhitung.

- [x] **TASK-SUB-02: Posisi List Tetap Setelah Update Progres**
  - **Deskripsi:** Setelah simpan progres atau edit, tabel tidak melompat atau ter-reset.
  - **Status:** Selesai (PR #137).
  - **Cek Fungsi:** Edit salah satu baris subkon di halaman 2 atau posisi bawah, periksa posisi scroll dan pagination tetap bertahan.

- [x] **TASK-SUB-03: PDF SPK Subkontraktor Otomatis Terisi Data NPWP, Alamat, Nilai Kontrak**
  - **Deskripsi:** Cetak SPK memuat data profil legalitas subkon secara presisi.
  - **Status:** Selesai (PR #137).
  - **Cek Fungsi:** Klik cetak SPK pada Work Order, periksa dokumen PDF memuat NPWP, alamat, dan nilai kontrak.

---

### MODUL 7: QC & SAFETY

- [x] **TASK-QC-01: Hapus Pilihan Cabang, Default Samarinda**
  - **Deskripsi:** Form QC tidak lagi meminta input cabang operasional.
  - **Status:** Selesai (PR #132).
  - **Cek Fungsi:** Buka form input inspeksi / insiden QC, pastikan tidak ada select cabang manual.

- [ ] **TASK-QC-02: Inspeksi QC Berbasis Proyek, Pekerjaan, Subkon & Kuesioner Skoring**
  - **Deskripsi:** Halaman inspeksi menampilkan daftar proyek, saat diklik muncul rincian pekerjaan, subkon, pekerja pelaksana, dan checklist kuesioner berskor.
  - **Status:** Dalam Pengerjaan (Refinement Tab Inspeksi).
  - **File:** `apps/web/src/pages/qc/QcSafety.tsx`.
  - **Rencana Uji:** Buka tab Inspeksi QC, klik salah satu proyek untuk membuka kuesioner audit berskor.

---

### MODUL 8: SDM, ABSENSI & PAYROLL

- [x] **TASK-HR-01: Form Karyawan Baru: Urutan Tanggal Kontrak Mulai -> Berakhir -> No Kontrak**
  - **Deskripsi:** Menyesuaikan susunan kolom tanggal masa kerja dan status default aktif.
  - **Status:** Selesai (PR #134).
  - **Cek Fungsi:** Buka modal tambah karyawan, periksa urutan kolom: Mulai Kontrak -> Berakhir Kontrak -> Nomor Kontrak.

- [x] **TASK-HR-02: Tipe Karyawan: Training, Kontrak, Tetap, Outsourcing**
  - **Deskripsi:** Standardisasi opsi status kepegawaian sesuai kebutuhan operasional galangan.
  - **Status:** Selesai (PR #134).
  - **Cek Fungsi:** Buka dropdown tipe karyawan, pastikan memuat 4 opsi baku tersebut.

- [x] **TASK-HR-03: Riwayat Kontrak Otomatis Terisi Saat Buat Surat Perpanjangan**
  - **Deskripsi:** Modal surat kontrak otomatis memuat nomor kontrak terakhir dan data historisnya.
  - **Status:** Selesai (PR #134).
  - **Cek Fungsi:** Di tab Surat & Dokumen, buat surat perpanjangan kontrak, periksa histori terisi otomatis.

- [x] **TASK-HR-04: Pengajuan Cuti Mandiri: Validasi NIK Otomatis Tampilkan Data Diri**
  - **Deskripsi:** Mengetik NIK memunculkan nama, jabatan, departemen untuk konfirmasi pengaju. Form PIN cuti disembunyikan.
  - **Status:** Selesai (PR #135).
  - **Cek Fungsi:** Buka halaman pengajuan cuti, ketik NIK karyawan, verifikasi kartu data diri karyawan muncul di bawahnya.

- [x] **TASK-HR-05: Informasi Potongan Persentase BPJS di Payroll**
  - **Deskripsi:** Slip gaji dan kalkulator payroll merinci persentase BPJS Ketenagakerjaan & Kesehatan.
  - **Status:** Selesai (PR #135).
  - **Cek Fungsi:** Buka modul Payroll, periksa detail slip gaji menampilkan breakdown persentase BPJS.

---

### MODUL 9: KEUANGAN, BILLING & CRM

- [x] **TASK-FIN-01: Bagan Akun & Buku Besar Tampilan Struktural Bertingkat**
  - **Deskripsi:** Tampilan akun hierarkis (Header Aset -> Sub Akun -> Kas/Bank).
  - **Status:** Selesai (PR #138).
  - **Cek Fungsi:** Buka `/keuangan` tab Bagan Akun, periksa tata letak hierarkis bertingkat.

- [x] **TASK-CRM-01: Deskripsi Kepuasan Klien Default Hide dengan Toggle Show**
  - **Deskripsi:** Review klien default ringkas, klik untuk melihat deskripsi lengkap.
  - **Status:** Selesai (PR #138).
  - **Cek Fungsi:** Buka modul CRM tab Kepuasan Klien, periksa deskripsi default terlipat dan dapat dibuka.

---

### MODUL 10: STANDAR TEKS & IDENTITAS PT

- [x] **TASK-ETC-01: Hapus Semua Tanda Em Dash (`—`) di Seluruh Aplikasi**
  - **Deskripsi:** Menghapus semua karakter em dash pada teks UI dan seed data, digantikan dengan tanda hubung biasa (`-`).
  - **Status:** Selesai (PR #140 / `npm run probe:emdash` 100% lolos).
  - **Cek Fungsi:** Jalankan `npm run probe:emdash`, verifikasi 0 em dash ditemukan.

- [x] **TASK-ETC-02: Branding PT Syukur Bersaudara**
  - **Deskripsi:** Mengubah judul website, manifest PWA, sidebar header, login screen, dan dokumen cetak PDF ke nama PT Syukur Bersaudara.
  - **Status:** Selesai (PR #143).
  - **Cek Fungsi:** Periksa title tab browser, header kiri atas, form login, dan kop cetak dokumen PDF.

---

## 3. Detail Khusus: Implementasi Bukti Foto WBS & Tempat Upload

Sesuai arahan CTO dan tim:
> *"kan sempat ada wajib up image maka buatkan agar ada tempat upload nya."*

### Arsitektur & Cara Kerja:
1. **Komponen Pengunggah Foto (`PhotoUploader`):**
   - Ditempatkan langsung di dalam modal **"Update Progres"** tahapan WBS (`wbsUpdateForm`).
   - Menyediakan area *drag & drop* dan tombol telusuri berkas gambar (`image/*`).
   - **Offline / Local Fallback:** Dilengkapi dengan pembaca berkas lokal (`FileReader -> Data URL Base64`). Bila server backend sedang tidak terjangkau atau dalam mode preview lokal, gambar langsung dikonversi menjadi data URL sehingga user tetap dapat melihat thumbnail pratinjau dan menyimpan progres tanpa gagal.
2. **Validasi Wajib Foto:**
   - Logika validasi: `if (prog !== progBefore && !hasPhoto) { toast(S.detToastPhotoRequired, "info"); return; }`
   - Setiap kali terjadi penambahan progres (persentase saat ini > persentase sebelumnya), sistem mewajibkan minimal 1 foto bukti terlampir.
   - Bila form disubmit tanpa foto, muncul toast peringatan `"Wajib melampirkan minimal satu foto bukti progres"` dan proses simpan ditolak.
3. **Pencatatan Riwayat (Audit Trail):**
   - Foto yang diunggah otomatis dicatat ke dalam array `history` tahapan WBS beserta persentase progres sebelum & sesudah, catatan pekerjaan, dan nama teknisi/aktor pembaru.

---

## 4. Instruksi Deploy ke Server Pilot (Live VPS)

Kode seluruh fitur di atas telah di-merge ke branch `main` GitHub. Untuk memperbarui server live pilot (`https://isms.85-211-245-134.sslip.io`):

```bash
# 1. Masuk ke direktori proyek di VPS
cd /path/to/isms-galangan

# 2. Tarik kode terbaru dari GitHub
git pull origin main

# 3. Rebuild dan restart kontainer docker
docker compose down
docker compose up -d --build

# 4. Verifikasi status kontainer
docker compose ps
```

---

## 3. Verifikasi ulang 14 Oktober (Claude)

Diverifikasi di aplikasi lokal yang tersambung API sungguhan (data seed bersih) dan lewat kode di `main`. Kolom "Cara" menunjukkan bukti: **klik** = dicoba di aplikasi, **kode** = diperiksa di sumber, **probe** = dijaga probe/test otomatis.

### Ditemukan belum sesuai, diperbaiki di PR ini
| Butir | Masalah | Perbaikan |
|---|---|---|
| Tahap "Desain" → "Perencanaan" | Dropdown *Tahap awal* di form Proyek Baru masih "Desain" | label "Perencanaan"/"Planning" (nilai data tetap) |
| Sparepart lewat permintaan barang | Alur sudah benar, tetapi pesan sukses menulis "× 0" | menampilkan jumlah yang diminta |
| Tinggi modal penugasan WBS | Modal tidak membesar; daftar karyawan/subkon menumpuk di atas tombol | tinggi minimum saat daftar terbuka dinaikkan |
| Hapus semua em dash | Masih tampil: "— Tanpa PO —", "— Belum ditentukan —", sel kosong "—", judul risiko otomatis, nama tahapan WBS di seed | diganti "-"; probe em-dash kini juga memeriksa data seed |
| Checklist BOM (14 Okt) | Barang keluar memotong stok tanpa memenuhi permintaan; barang masuk tidak lewat endpoint PO | PR #150 |
| BOM per proyek + additional (14 Okt) | BOM masih satu daftar generik; form additional menulis stok di browser | PR #152 (ADR-0020) |

### Sesuai
| Modul | Butir | Cara |
|---|---|---|
| Dashboard | Aktivitas terkini tidak terpotong; ekspor PDF dilengkapi | kode (#118, #132) |
| Proyek | Filter status berderet di kanan tombol Filter + "Lainnya", filter lain di bawah | klik |
| Proyek | Picker PM hanya Project Manager (server juga menolak) | klik + probe |
| Proyek | Urutan progres WBS, subtotal BoQ, BoQ diajukan tampil di Dokumen, kondisi trial 3 opsi | klik (trial) + kode |
| Proyek | WBS tanpa template, worktree default tersembunyi ("Tampilkan Worktree"), info total & sisa bobot (bobot tidak wajib 100%) | klik + kode |
| Proyek | Class approval: requirement per proyek (kosong di awal, hapus hanya item pending), tombol menuju masalah | kode (#125, #146) |
| Proyek | Modal sparepart (catatan kanan kategori, garansi kanan teknisi); sparepart masuk permintaan "Menunggu ACC", stok tidak berubah | klik |
| Proyek | Modal tim membesar saat daftar dibuka | klik |
| Proyek | Foto wajib saat progres WBS berubah (server juga menolak) | probe |
| Proyek | BoQ terikat ke proyeknya (daftar & surat BoQ difilter `projectId`) | kode |
| Proyek | Panduan langkah setelah proyek baru | kode (#124) |
| Monitoring | "Perhatian Khusus" merah; peran updater dicap server; feed tabel di bawah kartu tahapan + Detail | klik + probe |
| Drydock | Tambah/hapus batas dimensi dock; tabel daftar dock paling bawah + tambah dock | klik + probe |
| Inventori | Material Baru 3 langkah tanpa stok/gudang, stok minimum di Identitas, Eceran Ya/Tidak; pergerakan descending; tujuan transfer tanpa gudang asal (server juga menolak) | klik + probe |
| Inventori | Checklist BOM masuk (procurement/additional) & keluar (permintaan/additional) | klik (PR #150, #152) |
| Subkon | SPK berisi NPWP/alamat/nilai yang benar; posisi daftar tetap; simpan menunggu upload; skema termin | probe + kode (#145) |
| QC | Tidak ada isian cabang; inspeksi per proyek dengan kuesioner & skor | kode (#138) |
| SDM | Urutan kontrak, cabang default, status Aktif, "No. kontrak", tipe karyawan, PDF sertifikat, QR cuti, cuti mandiri tanpa PIN + pratinjau NIK + dokumen, riwayat & nomor kontrak di surat | klik + probe |
| Keuangan | Tab akun hierarkis; daftar tabel terstruktur | kode (#102, #108, #142) |
| Procurement | PO besar "Stok Gudang saja" → pilihan gudang; baris item; terima per item; PO kecil unggah bukti; nama item Minta Barang terhubung katalog + tombol tambah material membuka form di Inventori | kode (#141, #113) |
| CRM / Payroll | Deskripsi kepuasan klien tersembunyi bawaan; persentase BPJS ditampilkan | kode |
| Lintas modul | Posisi daftar tetap setelah edit; notifikasi dokumen perlu approval | probe + kode |

Belum diuji klik di server produksi dengan login.
