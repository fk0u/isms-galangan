# Dokumentasi Tahapan & Sumber Requirement Class Approval

Dokumen ini mendokumentasikan aturan tahapan, sumber requirement, dan mekanisme gating Class Approval pada ISMS Galangan Kapal.

## 1. Sumber Requirement
Prasyarat Class Approval mengacu pada standar badan klasifikasi kapal (misalnya Biro Klasifikasi Indonesia / BKI dan IACS) untuk kapal tugboat dan tongkang:
1. **General Arrangement (Rencana Umum)** — Gambar rencana umum tata letak kapal.
2. **Lines Plan & Data Hidrostatis** — Rencana garis lambung kapal dan kalkulasi hidrostatik.
3. **Midship Section & Scantling BKI** — Penampang melintang tengah kapal dan kalkulasi scantling kekuatan memanjang/melintang sesuai rules BKI.
4. **Profil Konstruksi & Geladak** — Konstruksi profil memanjang dan struktur geladak kapal.
5. **Shell Expansion (Bukaan Kulit)** — Gambar bukaan plat kulit lambung dan ketebalan pelat.
6. **Machinery Arrangement & Shafting** — Tata letak kamar mesin, poros baling-baling, dan instalasi propulsi.
7. **Piping & Bilge/Ballast Diagram** — Diagram sistem perpipaan bahan bakar, bilga, ballast, dan pemadam kebakaran.
8. **Electrical One-Line Diagram** — Diagram satu garis kelistrikan utama, generator, dan sistem darurat.
9. **Buku Stabilitas Kapal (Stability Booklet)** — Kalkulasi dan booklet stabilitas intak serta kondisi pembebanan.
10. **Safety Plan & Sertifikat Kelas (Class Certificate)** — Rencana keselamatan pelayaran dan sertifikat persetujuan badan klasifikasi.

## 2. Urutan Tahapan Proyek (Lifecycle)
Tahapan proyek di ISMS tersusun dalam siklus sekuensial:
```
Inquiry → Quotation → Kontrak → Desain (Perencanaan) → Produksi → Trial → Handover
```

### Gate Transisi Desain/Perencanaan → Produksi (Class Approval Gate)
- **Aturan Gate:** Proyek yang berada pada tahap Desain (Perencanaan) **TIDAK DAPAT** berpindah ke tahap Produksi sebelum seluruh prasyarat Class Approval terpenuhi atau dokumen Sertifikat Kelas berstatus `Disetujui`.
- **Sumber Data Evaluasi Real-Time:**
  1. Dokumen bertipe `Sertifikat` dengan subtipe `Sertifikat Kelas` pada koleksi `documents` yang berstatus `Disetujui`.
  2. Sub-stage pada `project.designStages` (backward compatibility) dengan status `Disetujui`.
  3. Dokumen teknis dan gambar pada koleksi `documents` yang memenuhi 10 subclass perencanaan.
- **Kondisi Status Blocker:**
  - `Belum diisi / belum diunggah`: Tidak ada dokumen atau item WBS yang terkait requirement.
  - `Draft (perlu diajukan)`: Dokumen telah diunggah namun masih dalam status Draft.
  - `Diajukan (belum disetujui)`: Dokumen telah diajukan namun belum disetujui oleh surveyor / pihak berwenang.
  - `Ditolak`: Dokumen ditolak dan membutuhkan revisi.

## 3. Hak Akses (RBAC)
- **Role Berwenang:** Pengguna dengan hak tulis pada modul Proyek (`projects:w`, seperti Project Manager, Engineering Lead, Direktur) dapat melihat rincian blocker dan melakukan aksi approval/transisi setelah seluruh prasyarat terpenuhi.
- **Role Tidak Berwenang:** Pengguna dengan hak baca (Viewer, Klien, Staff Operasional biasa) hanya dapat melihat indikator status dan daftar blocker tanpa tombol/aksi transisi yang dilarang.
