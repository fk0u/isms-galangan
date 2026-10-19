# Rencana Catatan Klien 17 Oktober 2026

Catatan kebutuhan klien (17 Okt 2026) untuk ISMS PT Syukur Bersaudara, dipecah menjadi **37 issue GitHub** berlabel [`catatan-17okt`](https://github.com/fk0u/isms-galangan/issues?q=label%3Acatatan-17okt). Setiap issue memuat kebutuhan, kriteria terima, dan file terkait. Kerjakan **satu ID per branch** sesuai `AGENTS.md`.

Dua butir yang muncul dua kali di catatan digabung menjadi satu issue:

- Integrasi subkontraktor ↔ WBS ↔ anggaran (Manajemen Proyek + Subkontraktor) → **K17-PM-14**.
- Identitas PT + nama kapal pada invoice (Keuangan + Perbaikan Umum) → **K17-FIN-03**.

## Ringkasan per modul

| Modul | Issue | Fase 1 | Fase 2 | Fase 3 |
|---|:-:|:-:|:-:|:-:|
| Manajemen Proyek | 15 | 5 | 4 | 6 |
| Inventori & Material | 2 | 0 | 1 | 1 |
| Procurement | 5 | 3 | 1 | 1 |
| Keuangan & Billing | 8 | 2 | 5 | 1 |
| SDM & Karyawan | 3 | 0 | 2 | 1 |
| Subkontraktor | 1 | 0 | 1 | 0 |
| Data Kapal | 1 | 1 | 0 | 0 |
| Umum | 2 | 1 | 0 | 1 |
| **Total** | **37** | **12** | **14** | **11** |

## Urutan pengerjaan

- **Fase 1 — perubahan label, hapus field, urutan tab** (risiko rendah, tanpa skema baru). Bisa paralel.
- **Fase 2 — fitur dalam satu modul** (import Excel, pajak & PPN, buku besar, grafik, cuti, TOTP). Perlu probe untuk perhitungan uang/saldo.
- **Fase 3 — lintas modul / skema** (material per tahapan WBS, equipment & SDM di WBS, subkon ↔ anggaran, konversi satuan, invoice otomatis PO, voucher jurnal, kasbon, fee proyek, audit PDF). Butuh ADR untuk koleksi/skema baru dan relasi di `refs.ts`.

Ketergantungan utama:

- K17-PM-01 adalah payung; selesai bila K17-PM-02, 09, 10, 11 selesai.
- K17-INV-01 (satuan sak) sebaiknya dikerjakan bersama atau sesudah K17-INV-02 (konversi satuan) karena berbagi model satuan.
- K17-PM-03 (material per tahapan) memakai BOM per proyek (ADR-0020); K17-PM-07, 08, 14 sama-sama menambah penugasan di tahapan WBS — kerjakan berurutan agar tidak bentrok di file tab WBS.
- K17-FIN-02 (PPN 11%) dan K17-FIN-01 (pajak manual) menyentuh perhitungan yang sama; K17-SUB-01 meniru pola K17-FIN-01.
- K17-PROC-05 (invoice otomatis) bergantung pada alur terima barang PO yang sudah ada.

## Perlu konfirmasi klien sebelum implementasi

**Sudah dijawab klien 19 Okt 2026** - lihat `decisions.md` Q17-Q25. Daftar di bawah disimpan sebagai riwayat pertanyaan.

Catatan baru ini belum tercakup keputusan 7 Okt di `decisions.md`. Butir berikut ditandai di issue-nya dan **jangan ditebak**:

1. **K17-PM-15 Fee Project** — fee siapa (marketing/agen/manajemen), dasar hitung (persen nilai kontrak atau nominal), dan kapan dibayar.
2. **K17-PROC-05 Invoice otomatis PO** — pemicunya (PO disetujui, barang diterima lengkap, atau tagihan vendor masuk) dan apakah yang dibuat hutang (AP) ke vendor.
3. **K17-FIN-08 Voucher jurnal** — transaksi mana saja yang menerbitkan voucher dan format nomornya.
4. **K17-HR-03 Kasbon** — aturan memilih potongan Rp500.000 atau Rp1.000.000 (berdasarkan besaran kasbon? ambang berapa?).
5. **K17-PROC-02 Tanda tangan PDF PO** — nama peran untuk 2 kolom PO Besar dan 4 kolom PO Kecil.
6. **K17-KPL-01 Data kapal** — "OT" pada daftar hapus: apakah maksudnya GT (Gross Tonnage).
7. **K17-PM-02 Pimpinan Proyek** — hanya ganti label, atau aturan server yang mewajibkan jabatan Project Manager ikut berubah.
8. **K17-PM-10 Tahapan Progress** — pemetaan tahap lama proyek yang sudah berjalan ke 8 tahap baru.

## Fase 1

| ID | Issue | Modul | Judul |
|---|---|---|---|
| K17-PM-02 | [#165](https://github.com/fk0u/isms-galangan/issues/165) | Manajemen Proyek | Ganti label Project Manager menjadi Pimpinan Proyek |
| K17-PM-04 | [#167](https://github.com/fk0u/isms-galangan/issues/167) | Manajemen Proyek | Ganti label "Riwayat Perubahan Server" menjadi "Riwayat Progress" |
| K17-PM-06 | [#169](https://github.com/fk0u/isms-galangan/issues/169) | Manajemen Proyek | Urutan tab detail proyek: BoQ sebelum WBS |
| K17-PM-09 | [#172](https://github.com/fk0u/isms-galangan/issues/172) | Manajemen Proyek | Form "Tahap Awal" diganti menjadi "Progress" |
| K17-PM-11 | [#174](https://github.com/fk0u/isms-galangan/issues/174) | Manajemen Proyek | Hapus field Prioritas dari form proyek baru |
| K17-PROC-01 | [#181](https://github.com/fk0u/isms-galangan/issues/181) | Procurement | PO Kecil: hapus field estimasi nilai/harga |
| K17-PROC-03 | [#183](https://github.com/fk0u/isms-galangan/issues/183) | Procurement | PO Besar: hapus field Spesifikasi |
| K17-PROC-04 | [#184](https://github.com/fk0u/isms-galangan/issues/184) | Procurement | Hapus estimasi nilai pada detail stok di Procurement |
| K17-FIN-04 | [#189](https://github.com/fk0u/isms-galangan/issues/189) | Keuangan & Billing | Tipe Billing: DP 1–5 dan Pelunasan |
| K17-FIN-05 | [#190](https://github.com/fk0u/isms-galangan/issues/190) | Keuangan & Billing | Hapus field NSFP |
| K17-UMUM-01 | [#199](https://github.com/fk0u/isms-galangan/issues/199) | Umum | Toast yang jelas saat token login kedaluwarsa |
| K17-KPL-01 | [#198](https://github.com/fk0u/isms-galangan/issues/198) | Data Kapal | Penyesuaian form pendaftaran kapal |

## Fase 2

| ID | Issue | Modul | Judul |
|---|---|---|---|
| K17-PM-01 | [#164](https://github.com/fk0u/isms-galangan/issues/164) | Manajemen Proyek | Penyesuaian form pembuatan proyek baru |
| K17-PM-05 | [#168](https://github.com/fk0u/isms-galangan/issues/168) | Manajemen Proyek | Import Excel daftar BoQ di detail proyek |
| K17-PM-10 | [#173](https://github.com/fk0u/isms-galangan/issues/173) | Manajemen Proyek | Urutan tahapan Progress proyek baru |
| K17-PM-13 | [#176](https://github.com/fk0u/isms-galangan/issues/176) | Manajemen Proyek | Import Excel Ruang Lingkup Pekerjaan (tab Ringkasan) |
| K17-INV-01 | [#179](https://github.com/fk0u/isms-galangan/issues/179) | Inventori & Material | Satuan pembelian sak 25 kg dan sak 40 kg |
| K17-PROC-02 | [#182](https://github.com/fk0u/isms-galangan/issues/182) | Procurement | Tanda tangan PDF PO: Besar 2 kolom, Kecil 4 kolom |
| K17-FIN-01 | [#186](https://github.com/fk0u/isms-galangan/issues/186) | Keuangan & Billing | Tab Pajak: input nominal pajak manual |
| K17-FIN-02 | [#187](https://github.com/fk0u/isms-galangan/issues/187) | Keuangan & Billing | PPN 11% pada seluruh invoice |
| K17-FIN-03 | [#188](https://github.com/fk0u/isms-galangan/issues/188) | Keuangan & Billing | Nama PT dan nama kapal di seluruh invoice |
| K17-FIN-06 | [#191](https://github.com/fk0u/isms-galangan/issues/191) | Keuangan & Billing | Buku Besar: total debit/kredit, status seimbang, pencarian |
| K17-FIN-07 | [#192](https://github.com/fk0u/isms-galangan/issues/192) | Keuangan & Billing | Laba Rugi: grafik detail |
| K17-HR-01 | [#194](https://github.com/fk0u/isms-galangan/issues/194) | SDM & Karyawan | QR cuti/izin TOTP berlaku satu tahun |
| K17-HR-02 | [#195](https://github.com/fk0u/isms-galangan/issues/195) | SDM & Karyawan | Cuti sakit tidak mengurangi saldo cuti tahunan |
| K17-SUB-01 | [#197](https://github.com/fk0u/isms-galangan/issues/197) | Subkontraktor | Pajak subkontraktor perorangan: input nominal manual |

## Fase 3

| ID | Issue | Modul | Judul |
|---|---|---|---|
| K17-PM-03 | [#166](https://github.com/fk0u/isms-galangan/issues/166) | Manajemen Proyek | WBS: daftar material yang dibutuhkan per tahapan |
| K17-PM-07 | [#170](https://github.com/fk0u/isms-galangan/issues/170) | Manajemen Proyek | Equipment digabung ke tab WBS (hapus tab Equipment) |
| K17-PM-08 | [#171](https://github.com/fk0u/isms-galangan/issues/171) | Manajemen Proyek | Penugasan SDM/subkon di WBS tampil otomatis di tab Tim |
| K17-PM-12 | [#175](https://github.com/fk0u/isms-galangan/issues/175) | Manajemen Proyek | Hak akses Pimpinan Proyek mengisi rencana docking di tab WBS |
| K17-PM-14 | [#177](https://github.com/fk0u/isms-galangan/issues/177) | Manajemen Proyek | Integrasi subkontraktor dengan WBS dan anggaran proyek |
| K17-PM-15 | [#178](https://github.com/fk0u/isms-galangan/issues/178) | Manajemen Proyek | Modul Fee Project |
| K17-INV-02 | [#180](https://github.com/fk0u/isms-galangan/issues/180) | Inventori & Material | Konversi satuan pengeluaran material |
| K17-PROC-05 | [#185](https://github.com/fk0u/isms-galangan/issues/185) | Procurement | Otomatisasi invoice dari Purchase Order |
| K17-FIN-08 | [#193](https://github.com/fk0u/isms-galangan/issues/193) | Keuangan & Billing | Penerbitan voucher jurnal |
| K17-HR-03 | [#196](https://github.com/fk0u/isms-galangan/issues/196) | SDM & Karyawan | Potongan kasbon otomatis lewat gaji bulanan |
| K17-UMUM-02 | [#200](https://github.com/fk0u/isms-galangan/issues/200) | Umum | Validasi export PDF di semua modul |

## Rincian per modul

### Manajemen Proyek

- **K17-PM-01** [#164](https://github.com/fk0u/isms-galangan/issues/164) — Penyesuaian form pembuatan proyek baru (Fase 2)  
  Payung untuk perubahan form Proyek Baru: label Pimpinan Proyek (K17-PM-02), form "Tahap Awal" jadi "Progress" (K17-PM-09), urutan tahap progress baru (K17-PM-10), dan hapus field Prioritas (K17-PM-11).

- **K17-PM-02** [#165](https://github.com/fk0u/isms-galangan/issues/165) — Ganti label Project Manager menjadi Pimpinan Proyek (Fase 1)  
  Label "Project Manager" pada form pembuatan proyek baru diganti menjadi "Pimpinan Proyek".

- **K17-PM-03** [#166](https://github.com/fk0u/isms-galangan/issues/166) — WBS: daftar material yang dibutuhkan per tahapan (Fase 3)  
  Setiap tahapan WBS bisa diisi daftar material yang dibutuhkan.

- **K17-PM-04** [#167](https://github.com/fk0u/isms-galangan/issues/167) — Ganti label "Riwayat Perubahan Server" menjadi "Riwayat Progress" (Fase 1)  
  Pada detail progress tahapan WBS, teks "Riwayat Perubahan Server" diganti "Riwayat Progress".

- **K17-PM-05** [#168](https://github.com/fk0u/isms-galangan/issues/168) — Import Excel daftar BoQ di detail proyek (Fase 2)  
  Setelah surat BoQ dibuat, daftar Bill of Quantity di detail proyek bisa diisi lewat import Excel.

- **K17-PM-06** [#169](https://github.com/fk0u/isms-galangan/issues/169) — Urutan tab detail proyek: BoQ sebelum WBS (Fase 1)  
  Tab BoQ dipindah ke sebelum tab WBS agar mencerminkan urutan pengisian data dan alur kerja proyek.

- **K17-PM-07** [#170](https://github.com/fk0u/isms-galangan/issues/170) — Equipment digabung ke tab WBS (hapus tab Equipment) (Fase 3)  
  Tab Equipment di detail proyek dihapus; pengelolaan peralatan dipindah ke tiap tahapan WBS.

- **K17-PM-08** [#171](https://github.com/fk0u/isms-galangan/issues/171) — Penugasan SDM/subkon di WBS tampil otomatis di tab Tim (Fase 3)  
  Karyawan dan subkontraktor yang ditugaskan di tahapan WBS otomatis muncul di tab Tim.

- **K17-PM-09** [#172](https://github.com/fk0u/isms-galangan/issues/172) — Form "Tahap Awal" diganti menjadi "Progress" (Fase 1)  
  Pada pembuatan proyek baru, form "Tahap Awal" berganti nama menjadi "Progress".

- **K17-PM-10** [#173](https://github.com/fk0u/isms-galangan/issues/173) — Urutan tahapan Progress proyek baru (Fase 2)  
  Form Progress memakai urutan: Quotation → Estimasi → Kontrak → Produksi → Bill → Invoice → Sea Trial + Dock Report → Pelunasan + Handover.

- **K17-PM-11** [#174](https://github.com/fk0u/isms-galangan/issues/174) — Hapus field Prioritas dari form proyek baru (Fase 1)  
  Field Prioritas pada form pembuatan proyek baru dihilangkan.

- **K17-PM-12** [#175](https://github.com/fk0u/isms-galangan/issues/175) — Hak akses Pimpinan Proyek mengisi rencana docking di tab WBS (Fase 3)  
  Pimpinan Proyek bisa mengisi/melengkapi rencana lokasi docking, rencana tanggal mulai, dan estimasi penyelesaian di tab WBS.

- **K17-PM-13** [#176](https://github.com/fk0u/isms-galangan/issues/176) — Import Excel Ruang Lingkup Pekerjaan (tab Ringkasan) (Fase 2)  
  Bagian Ruang Lingkup Pekerjaan di tab Ringkasan proyek bisa diisi lewat import Excel.

- **K17-PM-14** [#177](https://github.com/fk0u/isms-galangan/issues/177) — Integrasi subkontraktor dengan WBS dan anggaran proyek (Fase 3)  
  Penugasan subkontraktor terhubung ke tahapan WBS dan anggaran proyek agar alokasi pekerjaan dan biayanya tercatat. (Menggabungkan butir Manajemen Proyek dan Modul Subkontraktor.)

- **K17-PM-15** [#178](https://github.com/fk0u/isms-galangan/issues/178) — Modul Fee Project (Fase 3)  
  Menambahkan pengelolaan fee proyek pada Manajemen Proyek.

### Inventori & Material

- **K17-INV-01** [#179](https://github.com/fk0u/isms-galangan/issues/179) — Satuan pembelian sak 25 kg dan sak 40 kg (Fase 2)  
  Form material baru punya pilihan satuan pembelian "sak 25 kg" dan "sak 40 kg".

- **K17-INV-02** [#180](https://github.com/fk0u/isms-galangan/issues/180) — Konversi satuan pengeluaran material (Fase 3)  
  Material bisa dikeluarkan dengan satuan berbeda dari satuan beli (semen sak 40 kg keluar per kg, drum keluar per liter, roll keluar per meter). Stok berkurang akurat sesuai konversi.

### Procurement

- **K17-PROC-01** [#181](https://github.com/fk0u/isms-galangan/issues/181) — PO Kecil: hapus field estimasi nilai/harga (Fase 1)  
  Field estimasi nilai/harga pada form PO Kecil dihilangkan.

- **K17-PROC-02** [#182](https://github.com/fk0u/isms-galangan/issues/182) — Tanda tangan PDF PO: Besar 2 kolom, Kecil 4 kolom (Fase 2)  
  Export PDF PO Besar memakai dua kolom tanda tangan; PO Kecil empat kolom.

- **K17-PROC-03** [#183](https://github.com/fk0u/isms-galangan/issues/183) — PO Besar: hapus field Spesifikasi (Fase 1)  
  Field Spesifikasi pada modul PO Besar dihilangkan.

- **K17-PROC-04** [#184](https://github.com/fk0u/isms-galangan/issues/184) — Hapus estimasi nilai pada detail stok di Procurement (Fase 1)  
  Informasi estimasi nilai pada detail stok di modul Procurement dihilangkan.

- **K17-PROC-05** [#185](https://github.com/fk0u/isms-galangan/issues/185) — Otomatisasi invoice dari Purchase Order (Fase 3)  
  Invoice diterbitkan otomatis berdasarkan transaksi PO sesuai alur procurement.

### Keuangan & Billing

- **K17-FIN-01** [#186](https://github.com/fk0u/isms-galangan/issues/186) — Tab Pajak: input nominal pajak manual (Fase 2)  
  Tab Pajak punya field untuk memasukkan nominal pajak secara manual.

- **K17-FIN-02** [#187](https://github.com/fk0u/isms-galangan/issues/187) — PPN 11% pada seluruh invoice (Fase 2)  
  Tarif PPN 11% diterapkan pada seluruh invoice sesuai konfigurasi pajak perusahaan.

- **K17-FIN-03** [#188](https://github.com/fk0u/isms-galangan/issues/188) — Nama PT dan nama kapal di seluruh invoice (Fase 2)  
  Semua dokumen invoice menampilkan nama PT dan nama kapal secara konsisten. (Menggabungkan butir Keuangan dan Perbaikan Umum.)

- **K17-FIN-04** [#189](https://github.com/fk0u/isms-galangan/issues/189) — Tipe Billing: DP 1–5 dan Pelunasan (Fase 1)  
  Pilihan field Tipe Billing diganti menjadi DP 1, DP 2, DP 3, DP 4, DP 5, dan Pelunasan.

- **K17-FIN-05** [#190](https://github.com/fk0u/isms-galangan/issues/190) — Hapus field NSFP (Fase 1)  
  Field input NSFP pada form Keuangan & Billing dihilangkan.

- **K17-FIN-06** [#191](https://github.com/fk0u/isms-galangan/issues/191) — Buku Besar: total debit/kredit, status seimbang, pencarian (Fase 2)  
  Tab Buku Besar menampilkan total debit, total kredit, status keseimbangan, dan fitur pencarian.

- **K17-FIN-07** [#192](https://github.com/fk0u/isms-galangan/issues/192) — Laba Rugi: grafik detail (Fase 2)  
  Tab Laba Rugi menampilkan grafik detail agar mudah dianalisis.

- **K17-FIN-08** [#193](https://github.com/fk0u/isms-galangan/issues/193) — Penerbitan voucher jurnal (Fase 3)  
  Fitur penerbitan voucher jurnal untuk setiap transaksi yang relevan.

### SDM & Karyawan

- **K17-HR-01** [#194](https://github.com/fk0u/isms-galangan/issues/194) — QR cuti/izin TOTP berlaku satu tahun (Fase 2)  
  Masa berlaku/periode konfigurasi TOTP untuk QR cuti/izin disesuaikan menjadi satu tahun.

- **K17-HR-02** [#195](https://github.com/fk0u/isms-galangan/issues/195) — Cuti sakit tidak mengurangi saldo cuti tahunan (Fase 2)  
  Cuti sakit tidak mengurangi jatah cuti tahunan karyawan.

- **K17-HR-03** [#196](https://github.com/fk0u/isms-galangan/issues/196) — Potongan kasbon otomatis lewat gaji bulanan (Fase 3)  
  Kasbon dipotong otomatis dari gaji bulanan sebesar Rp500.000 atau Rp1.000.000 per bulan sesuai ketentuan dan besaran kasbon.

### Subkontraktor

- **K17-SUB-01** [#197](https://github.com/fk0u/isms-galangan/issues/197) — Pajak subkontraktor perorangan: input nominal manual (Fase 2)  
  Form pajak untuk subkontraktor perorangan punya opsi input nominal pajak manual. (Integrasi subkon ↔ WBS ↔ anggaran ada di K17-PM-14.)

### Data Kapal

- **K17-KPL-01** [#198](https://github.com/fk0u/isms-galangan/issues/198) — Penyesuaian form pendaftaran kapal (Fase 1)  
  Form dan alur pendaftaran kapal disesuaikan dengan kebutuhan operasional. Hapus: Nomor IMO, MMSI, Tahun Bangun, Tipe Mesin Utama, OT (perlu konfirmasi: kemungkinan GT), DWT, NT, DHP Mesin Utama, Bendera (default Indonesia), Status. Ganti/tambah: Pemilik (Klien) → Owner; tambah LBP (m) setelah LOA (m); Beam (m) → Breadth (m); Draft (m) → Depth (m); Bollard (T) → Draft (m); Class: BKI dan RINA.

### Umum

- **K17-UMUM-01** [#199](https://github.com/fk0u/isms-galangan/issues/199) — Toast yang jelas saat token login kedaluwarsa (Fase 1)  
  Notifikasi toast ketika token login kedaluwarsa diperbaiki agar jelas dan sesuai kondisi autentikasi.

- **K17-UMUM-02** [#200](https://github.com/fk0u/isms-galangan/issues/200) — Validasi export PDF di semua modul (Fase 3)  
  Semua modul yang punya export PDF menghasilkan dokumen lengkap, format sesuai, tanpa data hilang.

## Alat bantu: RUAS

RUAS (`@fk0u/ruas` 1.4.0) terpasang untuk membantu agen dan developer menelusuri kode sebelum mengubahnya (lihat ADR-0021):

```bash
npm run ruas:index                       # bangun indeks .ruas/ (lokal, diabaikan git)
npm run ruas -- ask "konversi satuan stok" # cari simbol terkait dalam bahasa Indonesia/Inggris
npm run ruas -- trace <NamaFungsi> . --depth 3   # dampak perubahan sebelum mengedit
```

Agen yang mendukung MCP (Claude Code) memakai server `ruas` dari `.mcp.json` di root repo.
