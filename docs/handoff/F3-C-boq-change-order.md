# F3-C — BoQ per Nomor Surat & Change Order

**Ditandai klien "sangat krusial".** Perubahan model data, bukan hanya UI.
Estimasi: 5–7 HK. Bergantung: F3-B (struktur tab). Keputusan: ADR-0006 (format default sampai contoh asli datang).

## Konteks
Sekarang 1 baris koleksi `boq` = 1 pekerjaan (`pages/proyek/BoQSection.tsx`, tipe `BoQItem` di `data/index.ts`), tanpa nomor surat dan tanpa revisi tingkat surat; ada riwayat harga per baris. `refs.ts`: `boq.projectId → projects`. Change Order (`changeOrders`) punya status Diajukan → Disetujui → Diterapkan, tapi tidak menyentuh BoQ.

Kebutuhan klien:
- 1 **surat BoQ** (nomor surat) berisi banyak pekerjaan.
- List hanya: nomor surat, total, status, dokumen, aksi. Klik → detail item.
- **Status revisi** surat (Rev 0, Rev 1, …) — perhatian khusus.
- Dokumen BoQ juga tampil di tab Dokumen & Laporan.
- Change Order wajib disetujui **owner** dulu, lalu terhubung ke BoQ.

## Model data target
```
boqDocs (koleksi baru, prefix "BQD")
  id, branch, data: {
    projectId, number, revision: 0, status: "Draft"|"Diajukan"|"Disetujui"|"Ditolak"|"Digantikan",
    supersedes?: boqDocId,     // revisi sebelumnya
    issuedAt, approvedBy?, approvedAt?, documentId?, note, total (dihitung server)
  }
boq (tetap) + field baru: boqDocId
changeOrders + field baru: boqDocId (surat yang diubah), ownerApproval: {status, by, at, note}, resultBoqDocId
```
Aturan revisi: surat **Disetujui** tidak bisa diedit. Mengubahnya = membuat revisi baru (`revision+1`, `supersedes`), item disalin, surat lama → "Digantikan" saat revisi disetujui. Hanya satu revisi aktif per nomor surat.

---

### F3-C-01 — Migrasi & API boqDocs
P0 · 1,5 HK
**File.** `services/api/migrations/009_boq_docs.sql`, `routes/crud.ts` (`COLLECTIONS`, `PREFIX`, `REQUIRED_DATA: boqDocs: ["projectId","number"]`), `refs.ts` (`boqDocs.projectId→projects`, `boq.boqDocId→boqDocs`, `changeOrders.boqDocId→boqDocs`), `apps/web/src/data/store.tsx` (`PREFIX`, koleksi), `data/index.ts` (tipe).
**Langkah.** Tambah koleksi; endpoint khusus `POST /api/boqDocs/:id/revise` (buat revisi + salin item dalam satu transaksi) dan `POST /api/boqDocs/:id/status` (validasi transisi). Unik `(projectId, number, revision)`.
**Kriteria.** [ ] PATCH item `boq` milik surat Disetujui → 409. [ ] Revise menghasilkan surat baru dengan item tersalin.

### F3-C-02 — Migrasi data lama
P0 · 3 j
**Langkah.** Skrip `scripts/migrate-boq-docs.ts`: kelompokkan `boq` lama per proyek ke 1 surat `BQ/<projectId>/001 Rev 0` status Disetujui; isi `boqDocId`. Update seed agar memakai model baru (minimal 2 proyek dengan 2 surat, satu punya revisi).
**Kriteria.** [x] Tidak ada `boq` tanpa `boqDocId` setelah migrasi.

### F3-C-03 — UI list & detail surat BoQ
P0 · 1,5 HK
**File.** `pages/proyek/BoQSection.tsx` (pindah ke `pages/proyek/tabs/BoQ/`).
**Langkah.** List surat: No surat · Rev · Total · Status (badge) · Dokumen (ikon) · Aksi (Detail, Revisi, Ajukan/Setujui sesuai izin). Detail (drawer/halaman): header surat + tabel item (kode, uraian, qty, satuan, harga, total) + riwayat revisi (timeline, diff total per revisi). Edit item hanya bila Draft.
**Kriteria.** [ ] Alur Draft → Diajukan → Disetujui → Revisi → Disetujui berjalan, surat lama jadi Digantikan.

### F3-C-04 — PDF & dokumen
P1 · 1 HK
**Langkah.** `kind: "boq"` di `services/api/src/pdf/registry.ts` (header surat, nomor, revisi, tabel item, total, tanda tangan). Surat yang disetujui membuat entri `documents` (`project`, `type: "BoQ"`, `boqDocId`) sehingga tampil di tab Dokumen & Laporan (PRJ-20); rapikan tab itu (kelompok per tipe dokumen).

### F3-C-05 — Change Order lewat owner & terhubung BoQ
P0 · 1 HK · PRJ-21
**Langkah.** Form CO: pilih surat BoQ aktif + item yang ditambah/diubah/dihapus. Status: Diajukan → **Disetujui owner** (aksi oleh peran direktur atau "owner" sesuai Q2; simpan `ownerApproval`) → Diterapkan. Diterapkan = otomatis membuat revisi surat BoQ dengan perubahan item tersebut (`resultBoqDocId`). Nilai kontrak/anggaran proyek diperbarui dari total revisi.
**Kriteria.** [ ] CO tanpa persetujuan owner tidak bisa diterapkan (server menolak). [ ] Menerapkan CO menghasilkan revisi BoQ baru yang benar totalnya.
