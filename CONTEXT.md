# CONTEXT.md — Konteks Bisnis & Domain

Baca ini sebelum menyentuh kode. Tujuannya: siapa pun (manusia atau AI agent) memahami **untuk siapa** sistem ini dibuat, **bagaimana galangan bekerja**, dan **istilah** yang muncul di kode.

## Klien & pengguna
- **Klien:** perusahaan galangan kapal tugboat di Kalimantan Timur. Lokasi aktif: **Samarinda** (satu cabang untuk prototype — ADR-0003).
- **Bisnis:** pembangunan kapal baru (new build), reparasi & docking, modifikasi/retrofit tugboat.
- **Pengguna & peran** (ADR-0004):

| Peran | Siapa | Kebutuhan utama |
|---|---|---|
| `direktur` | Pemilik / direksi ("owner") | Ringkasan semua modul, persetujuan change order, keuangan |
| `manager` | Manager proyek/operasional | Semua proyek, monitoring, kelola user operasional |
| `proyek` | PM, site engineer, foreman | WBS, progres, BoQ proyeknya |
| `mekanik` | Mekanik/teknisi bengkel | Lihat pekerjaan yang di-assign, update progres + foto, minta barang |
| `gudang` | Admin gudang | Barang masuk/keluar, stok |
| `procurement` | Purchasing | PR, RFQ, PO, vendor, persetujuan service, SPK subkon |
| `finance` | Akuntansi | Invoice, hutang, kas-bank, jurnal, pajak |
| `hr` | Personalia | Karyawan, absensi, cuti, payroll, surat |
| `qc` | QC & HSE/K3 | Inspeksi, NCR, kuesioner HSE, insiden |
| `subkon` | Subkontraktor eksternal | Work order miliknya, update progres |
| `equipment`, `drydock` | PIC alat & dock | Delegasi alat, slot dock |
| `viewer` | Pemilik kapal (klien galangan) | Lihat proyek kapalnya saja |
| `developer` | Tim pengembang | Semua, termasuk pengaturan |

Pengguna lapangan memakai **tablet/HP bersama** di bengkel dengan sinyal tidak stabil → aplikasi punya mode offline dan antrean sinkron; cache harus dibersihkan saat logout (F2-07).

## Alur bisnis inti

### New build / repair
```
Request (CRM) → Quotation → Kontrak → Proyek
  → Surat BoQ (nomor surat, revisi) → disetujui
  → WBS & jadwal → assign pekerjaan (karyawan / subkon)
  → Produksi: update progres + foto, material dari gudang
  → Change Order (perlu persetujuan owner) → revisi BoQ
  → QC inspeksi berskor → Commissioning & Trial (checklist dari WBS)
  → BAST → Garansi per pekerjaan → Invoice/termin
```

### Material (ETC-03, ETC-04, ADR-0007)
```
Mekanik minta barang untuk pekerjaan
  ├─ stok cukup  → Barang keluar (movement OUT)
  └─ stok kurang → PR → RFQ (bandingkan harga + riwayat harga) → PO ke vendor
                     → vendor tak sanggup sebagian → sisa dialihkan ke vendor lain
                     → semua diterima → Barang masuk → otomatis keluar ke peminta
```

### Docking
Kapal butuh slot dock sesuai **dimensi** (LOA, beam, draft, DWT). Booking slot mengikuti jadwal proyek; slot bisa dijadwalkan maintenance; ada waiting list bila penuh.

## Glosarium

| Istilah | Arti |
|---|---|
| **BoQ** | Bill of Quantities — daftar pekerjaan/material + harga untuk proyek. Diterbitkan per **nomor surat** dengan **revisi** (Rev 0, Rev 1, …) |
| **WBS** | Work Breakdown Structure — pecahan pekerjaan proyek dengan progres |
| **CO** | Change Order — perubahan lingkup, wajib disetujui owner |
| **PR / RFQ / PO** | Purchase Request / Request for Quotation / Purchase Order |
| **SPK / WO** | Surat Perintah Kerja / Work Order ke subkontraktor |
| **Termin** | Tahap pembayaran (DP1, DP2, persentase, atau kontan); **retensi** = bagian yang ditahan sampai garansi selesai |
| **BAST** | Berita Acara Serah Terima |
| **NCR** | Non-Conformance Report (temuan QC) |
| **ITP** | Inspection & Test Plan |
| **HSE / K3** | Health, Safety, Environment / Keselamatan & Kesehatan Kerja |
| **Toolbox meeting** | Briefing keselamatan singkat sebelum kerja |
| **Drydock / slot** | Fasilitas docking kapal; slot = posisi + rentang tanggal |
| **LOA / beam / draft / DWT / GT** | Panjang keseluruhan / lebar / sarat air / bobot mati / tonase kotor |
| **Klas (BKI)** | Biro Klasifikasi Indonesia — badan sertifikasi kapal |
| **Sea trial / commissioning** | Uji coba kapal sebelum serah terima |
| **Eceran** | Material yang dipakai sebagian (liter dari drum, potongan plat) |
| **Tonase** | Pencatatan material berdasarkan berat |
| **PTKP** | Penghasilan Tidak Kena Pajak — kode TK/0…K/3 dari status kawin & tanggungan |
| **PPh** | Pajak penghasilan (di modul subkon diganti istilah "Pajak" dengan pilihan %) |
| **WITA** | Waktu Indonesia Tengah (UTC+8), zona waktu aplikasi |

## Konvensi data
- Mata uang **Rupiah**, tampilan `1.000.000` (titik ribuan), disimpan sebagai number.
- Tanggal disimpan ISO 8601; tampil `dd/mm/yyyy`; zona **Asia/Makassar**.
- Bahasa UI: **Indonesia** (default) dan Inggris — semua teks lewat `apps/web/src/i18n/`.
- ID baris berprefiks per koleksi (`PRJ-`, `INV-`, `STK-`, …) — daftar di `services/api/src/routes/crud.ts` `PREFIX` (harus sama dengan frontend).

## Batasan yang harus diingat
- Data riil klien **tidak boleh** masuk repo (repo publik — ADR-0001).
- Data pribadi karyawan (KTP, ijazah, gaji, status kawin) tunduk pada UU PDP: hanya peran `hr`/`direktur`/`developer`.
- Dokumen resmi (kwitansi, BoQ, surat) dirender **di server** dari data DB, bukan dari payload klien.
