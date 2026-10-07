# F3-I — Subkontraktor

Halaman: `/subkontraktor` (`pages/subkontraktor/Subcontractor.tsx`, 1.875 baris), teks `i18n/n_sub*.ts`/`n_misc.ts`. Koleksi: `subcontractors`, `workOrders`, `termins`, `timesheets`.
Tab saat ini: Subkontraktor, Work Order, Termin & Pembayaran, Timesheet, Kepatuhan K3.
Estimasi: 4–5 HK.

---

### F3-I-01 — Bersihkan modul
P1 · 3 j · SUB-01, SUB-03, SUB-06, SUB-10
Hapus evaluasi kinerja (UI; data dibiarkan). Hapus tab Timesheet (koleksi tetap). Filter hanya status, ditampilkan sebagai `StatusChips` (semua status langsung terlihat). Rapikan tampilan: kartu subkon (nama, bidang, WO aktif, nilai kontrak), tabel konsisten dengan modul lain (Pager bersama).

### F3-I-02 — Work Order rinci
P0 · 4 j · SUB-02
WO menampilkan & mewajibkan: subkon, **kapal** (dari proyek), **proyek**, pekerjaan WBS terkait (bila dari Assign F3-B-09), nilai, tanggal, status. Kolom tabel WO: No WO · Subkon · Kapal · Proyek · Pekerjaan · Nilai · Progres · Status.

### F3-I-03 — Update progres WO dengan foto & histori
P0 · 4 j · SUB-04 · Bergantung: F3-A-04
Modal update progres: milestone WO (sudah ada), persen, foto (`PhotoUploader`), catatan. Panel histori (`ChangeHistory`). Update muncul di feed Monitoring (F3-E-01).

### F3-I-04 — SPK terkunci kecuali procurement
P0 · 3 j · SUB-05 · Bergantung: F2-05
Field SPK/kontrak WO (nilai, scope, tanggal) read-only di UI kecuali peran procurement; **server** menolak PATCH field-field tersebut dari peran lain (validasi per field di route WO atau hook di `crud.ts` untuk `workOrders`).

### F3-I-05 — Termin: tabel, skema, pajak
P0 · 1,5 HK · SUB-07, SUB-08, SUB-09
**Tabel termin:** Proyek · Subkon · WO · Nilai · Retensi · Neto · Status.
**Skema pembayaran** per WO (dipilih saat SPK): `Kontan` (100% sekali), `Persentase` (daftar % per tahap, total 100%), `DP bertahap` (DP1, DP2, …, pelunasan — nominal atau %). Sistem membuat termin otomatis sesuai skema; validasi total = nilai kontrak.
**Pajak:** field PPh → "Pajak" dengan pilihan persentase (0%, 2%, 2,5%, 4%, lainnya — daftar di setting `TAX_RATES`). Neto = nilai − retensi − pajak.
**Kriteria.** [ ] Probe `termin-probe.ts`: 3 skema menghasilkan termin dengan total tepat; pembulatan rupiah tanpa selisih.
