# Dokumen Handover & Panduan Onboarding Arsitektur Sistem

> **Proyek:** ISMS PT Syukur Bersaudara  
> **Waktu Pembuatan:** `2026-10-19T09:47:57.401Z`  
> **Total File:** 381 | **Total Simbol AST:** 3010 | **Total Relasi:** 12442 | **Sub-sistem Terdeteksi:** 925  
> **Prinsip Dokumentasi:** *Zero Uncited Claims* — Setiap klaim fungsional dan arsitektural wajib menyertakan tautan langsung ke nomor baris kode sumber asli.

---

## 1. Ringkasan Topologi & Sub-sistem Terdeteksi (Leiden Partitioning)

Melalui algoritma partisi graf modularitas terarah (Leiden) dan penamaan TF-IDF bebas LLM eksternal, basis kode ini secara otomatis terkelompokkan ke dalam beberapa sub-sistem fungsional berikut:

### Sub-sistem: `invoiceid:paidat:paidtotal` (Klaster #760)
- **Kepadatan Simbol:** 81 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sptNumOf`](file://apps/web/src/pages/keuangan/Finance.tsx#L596-L599) (`apps/web/src/pages/keuangan/Finance.tsx:596-599`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`taxManualOf`](file://apps/web/src/pages/keuangan/Finance.tsx#L606-L607) (`apps/web/src/pages/keuangan/Finance.tsx:606-607`) [Tipe: `function`]
    - *Signature:* `(period: StoreItem | null | undefined, k: TaxManualKey): number`
  - [`bump`](file://apps/web/src/pages/keuangan/Finance.tsx#L1881-L1885) (`apps/web/src/pages/keuangan/Finance.tsx:1881-1885`) [Tipe: `function`]
    - *Signature:* `(period: string, k: "revenue" | "costProj" | "salary" | "writeoff", v: number)`
  - [`amtD`](file://apps/web/src/pages/keuangan/Finance.tsx#L2438-L2438) (`apps/web/src/pages/keuangan/Finance.tsx:2438-2438`) [Tipe: `function`]
    - *Signature:* `(kode: string): number`
  - [`closeAst`](file://apps/web/src/pages/keuangan/Finance.tsx#L2412-L2416) (`apps/web/src/pages/keuangan/Finance.tsx:2412-2416`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // --- Aset: ubah harta (nama/kelompok/periode/nilai/metode), susut dihitung ulang ---

### Sub-sistem: `analisis:potong:stok` (Klaster #748)
- **Kepadatan Simbol:** 80 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`onPhotoFile`](file://apps/web/src/pages/inventori/Inventory.tsx#L1355-L1369) (`apps/web/src/pages/inventori/Inventory.tsx:1355-1369`) [Tipe: `function`]
    - *Signature:* `(f: File | undefined)`
    - *Deskripsi:* // Analisis + BOM + Stok: search PER CARD (bukan global), tanpa potong jumlah.
  - [`setF`](file://apps/web/src/pages/inventori/Inventory.tsx#L1310-L1328) (`apps/web/src/pages/inventori/Inventory.tsx:1310-1328`) [Tipe: `function`]
    - *Signature:* `(key: keyof MaterialFormValues, value: string | boolean)`
    - *Deskripsi:* // Analisis + BOM + Stok: search PER CARD (bukan global), tanpa potong jumlah.
  - [`handleImportFile`](file://apps/web/src/pages/inventori/Inventory.tsx#L1876-L1912) (`apps/web/src/pages/inventori/Inventory.tsx:1876-1912`) [Tipe: `function`]
    - *Signature:* `(file: File)`
    - *Deskripsi:* // Analisis + BOM + Stok: search PER CARD (bukan global), tanpa potong jumlah.
  - [`auditOf`](file://apps/web/src/pages/inventori/Inventory.tsx#L913-L917) (`apps/web/src/pages/inventori/Inventory.tsx:913-917`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem)`
    - *Deskripsi:* /** Label dua bahasa per tingkat. Opsi `<option>` tidak bisa diberi warna,
      jadi angkanya yang dipakai; badge warnanya sudah ada di baris tabel
      lewat `katalogBadge`. */
  - [`openEdit`](file://apps/web/src/pages/inventori/Inventory.tsx#L1400-L1424) (`apps/web/src/pages/inventori/Inventory.tsx:1400-1424`) [Tipe: `function`]
    - *Signature:* `(i: StoreItem)`
    - *Deskripsi:* // Analisis + BOM + Stok: search PER CARD (bukan global), tanpa potong jumlah.

### Sub-sistem: `siklus:stok:memotong` (Klaster #723)
- **Kepadatan Simbol:** 62 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`todayISO`](file://apps/web/src/utils/format.ts#L104-L109) (`apps/web/src/utils/format.ts:104-109`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`parseJam`](file://apps/web/src/utils/time24.ts#L86-L91) (`apps/web/src/utils/time24.ts:86-91`) [Tipe: `function`]
    - *Signature:* `(jam: unknown): { mulai: string; selesai: string } | null`
  - [`projOf`](file://apps/web/src/pages/equipment/Equipment.tsx#L444-L445) (`apps/web/src/pages/equipment/Equipment.tsx:444-445`) [Tipe: `function`]
    - *Signature:* `(id: unknown): StoreItem | undefined`
  - [`saveUtilOverride`](file://apps/web/src/pages/equipment/Equipment.tsx#L1556-L1570) (`apps/web/src/pages/equipment/Equipment.tsx:1556-1570`) [Tipe: `function`]
    - *Signature:* `(eq: StoreItem, manual: boolean)`
    - *Deskripsi:* /** Hapus satu siklus. Stok dikembalikan bila siklus sudah memotong stok. */
  - [`adjustMaintMaterials`](file://apps/web/src/pages/equipment/Equipment.tsx#L1071-L1118) (`apps/web/src/pages/equipment/Equipment.tsx:1071-1118`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem, next: { itemId: string; qty: string }[])`
    - *Deskripsi:* /**
   * Ubah qty material pada siklus yang stoknya SUDAH terpotong.
   * Dipakai tombol Ubah di baris berstatus Selesai: yang dihitung adalah
   * DELTA (kurang/tambah), bukan jumlah baru - supaya adjusting tidak
   * menggandakan atau mengembalikan seluruh stok.
   */

### Sub-sistem: `slot:dock:melebihi` (Klaster #719)
- **Kepadatan Simbol:** 59 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`witaTodayISO`](file://apps/web/src/utils/drydockBookingDates.ts#L16-L21) (`apps/web/src/utils/drydockBookingDates.ts:16-21`) [Tipe: `function`]
    - *Signature:* `(now: Date = new Date()): string`
  - [`isoDayNumber`](file://apps/web/src/utils/drydockBookingDates.ts#L23-L28) (`apps/web/src/utils/drydockBookingDates.ts:23-28`) [Tipe: `function`]
    - *Signature:* `(value: unknown): number | null`
  - [`slotDateOffsets`](file://apps/web/src/utils/drydockBookingDates.ts#L101-L114) (`apps/web/src/utils/drydockBookingDates.ts:101-114`) [Tipe: `function`]
    - *Signature:* `(
  slot: object,
  today: string = witaTodayISO(),
): DayOffsets | null`
  - [`bookingDateOffsets`](file://apps/web/src/utils/drydockBookingDates.ts#L88-L98) (`apps/web/src/utils/drydockBookingDates.ts:88-98`) [Tipe: `function`]
    - *Signature:* `(
  startDate: unknown,
  endDate: unknown,
  today: string = witaTodayISO(),
): DayOffsets | null`
  - [`dayToISO`](file://apps/web/src/utils/drydockBookingDates.ts#L34-L38) (`apps/web/src/utils/drydockBookingDates.ts:34-38`) [Tipe: `function`]
    - *Signature:* `(day: number, today: string = witaTodayISO()): string`

### Sub-sistem: `draf:termin:aliran` (Klaster #833)
- **Kepadatan Simbol:** 55 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`handleSelectTermWo`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L379-L430) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:379-430`) [Tipe: `function`]
    - *Signature:* `(woId: string)`
    - *Deskripsi:* // Ubah / hapus timesheet & termin. Edit hanya boleh saat belum Disetujui.
  - [`recordPenalty`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L580-L592) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:580-592`) [Tipe: `function`]
    - *Signature:* `(w: StoreItem)`
    - *Deskripsi:* // Tarif pajak: daftar standar + tarif lama PPh subkon (0,5% final) agar data lama tetap terbaca.
  - [`removeMilestone`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L525-L533) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:525-533`) [Tipe: `function`]
    - *Signature:* `(idx: number)`
    - *Deskripsi:* // Default PPh subkon bila termin tak menyebut pphPct (pengaturan PPH_SUBKON_DEFAULT).
  - [`hoursByWo`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L447-L448) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:447-448`) [Tipe: `function`]
    - *Signature:* `(woId: string): number`
    - *Deskripsi:* // Ubah / hapus timesheet & termin. Edit hanya boleh saat belum Disetujui.
  - [`approveTimesheet`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L1154-L1160) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:1154-1160`) [Tipe: `function`]
    - *Signature:* `(t: StoreItem)`
    - *Deskripsi:* // Ubah termin Draf: milestone + amount (aliran Draf→… terkunci setelah Diajukan).

### Sub-sistem: `pemakai:confirmmodal:vendor` (Klaster #783)
- **Kepadatan Simbol:** 53 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`signKeys`](file://apps/web/src/pages/procurement/Procurement.tsx#L1109-L1109) (`apps/web/src/pages/procurement/Procurement.tsx:1109-1109`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): string[]`
    - *Deskripsi:* // Hapus PO/PR (Draft saja) & vendor via ConfirmModal + daftar pemakai.
  - [`pickNotifIds`](file://apps/web/src/pages/procurement/Procurement.tsx#L639-L656) (`apps/web/src/pages/procurement/Procurement.tsx:639-656`) [Tipe: `function`]
    - *Signature:* `(ids: string[]): void`
    - *Deskripsi:* // Hapus PO/PR (Draft saja) & vendor via ConfirmModal + daftar pemakai.
  - [`doPoStatus`](file://apps/web/src/pages/procurement/Procurement.tsx#L848-L857) (`apps/web/src/pages/procurement/Procurement.tsx:848-857`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem, next: string)`
    - *Deskripsi:* // Hapus PO/PR (Draft saja) & vendor via ConfirmModal + daftar pemakai.
  - [`maxRet`](file://apps/web/src/pages/procurement/Procurement.tsx#L1379-L1380) (`apps/web/src/pages/procurement/Procurement.tsx:1379-1380`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): number`
    - *Deskripsi:* // Hapus PO/PR (Draft saja) & vendor via ConfirmModal + daftar pemakai.
  - [`cetakPo`](file://apps/web/src/pages/procurement/Procurement.tsx#L1131-L1160) (`apps/web/src/pages/procurement/Procurement.tsx:1131-1160`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem)`
    - *Deskripsi:* // Hapus PO/PR (Draft saja) & vendor via ConfirmModal + daftar pemakai.

### Sub-sistem: `berakhir:403:sesi` (Klaster #393)
- **Kepadatan Simbol:** 50 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`getJwt`](file://apps/web/src/services/http.ts#L65-L71) (`apps/web/src/services/http.ts:65-71`) [Tipe: `function`]
    - *Signature:* `(): string | null`
  - [`loadSideMapConflictHolds`](file://apps/web/src/data/sideMapConflictHolds.ts#L14-L21) (`apps/web/src/data/sideMapConflictHolds.ts:14-21`) [Tipe: `function`]
    - *Signature:* `(storage: ConflictHoldStorage): Set<string>`
  - [`persistSideMapConflictHolds`](file://apps/web/src/data/sideMapConflictHolds.ts#L23-L31) (`apps/web/src/data/sideMapConflictHolds.ts:23-31`) [Tipe: `function`]
    - *Signature:* `(storage: ConflictHoldStorage, holds: ReadonlySet<string>): void`
  - [`storedCacheOwnerId`](file://apps/web/src/data/store.tsx#L612-L618) (`apps/web/src/data/store.tsx:612-618`) [Tipe: `function`]
    - *Signature:* `(): string | null`
    - *Deskripsi:* /** Username akun yang sedang login, untuk kolom "Aktor" jejak aktivitas.
 *  Dulu selalu "Anda", sehingga Audit Trail tidak bisa menunjukkan siapa
 *  pelakunya (catatan CTO 15 Okt). */
  - [`currentSessionOwnerId`](file://apps/web/src/data/store.tsx#L585-L594) (`apps/web/src/data/store.tsx:585-594`) [Tipe: `function`]
    - *Signature:* `(): string | null`

### Sub-sistem: `nde:due:kalibrasi` (Klaster #820)
- **Kepadatan Simbol:** 50 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`reworkCost`](file://apps/web/src/pages/qc/QCSafety.tsx#L396-L397) (`apps/web/src/pages/qc/QCSafety.tsx:396-397`) [Tipe: `function`]
    - *Signature:* `(n: StoreItem): number`
    - *Deskripsi:* // Kalibrasi valid untuk NDE: status Selesai & due belum lewat
  - [`certsOfInspector`](file://apps/web/src/pages/qc/QCSafety.tsx#L379-L382) (`apps/web/src/pages/qc/QCSafety.tsx:379-382`) [Tipe: `function`]
    - *Signature:* `(name: string): string[]`
    - *Deskripsi:* // Kalibrasi valid untuk NDE: status Selesai & due belum lewat
  - [`needsFollowUp`](file://apps/web/src/pages/qc/QCSafety.tsx#L389-L393) (`apps/web/src/pages/qc/QCSafety.tsx:389-393`) [Tipe: `function`]
    - *Signature:* `(n: StoreItem): boolean`
    - *Deskripsi:* // Kalibrasi valid untuk NDE: status Selesai & due belum lewat
  - [`mark`](file://apps/web/src/pages/qc/QCSafety.tsx#L157-L160) (`apps/web/src/pages/qc/QCSafety.tsx:157-160`) [Tipe: `function`]
    - *Signature:* `(index: number, go: (p: number) => void, size: number): void`
  - [`toTab`](file://apps/web/src/pages/qc/QCSafety.tsx#L161-L165) (`apps/web/src/pages/qc/QCSafety.tsx:161-165`) [Tipe: `function`]
    - *Signature:* `(name: string, after: () => void): void`

### Sub-sistem: `otomatis:trial:selesai` (Klaster #807)
- **Kepadatan Simbol:** 48 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`docUrlOf`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L101-L103) (`apps/web/src/pages/proyek/ProjectDetail.tsx:101-103`) [Tipe: `function`]
    - *Signature:* `(d: StoreItem): string`
  - [`patch`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L3069-L3069) (`apps/web/src/pages/proyek/ProjectDetail.tsx:3069-3069`) [Tipe: `function`]
    - *Signature:* `(p: Partial<CoChangeForm>)`
  - [`advanceBast`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L935-L1009) (`apps/web/src/pages/proyek/ProjectDetail.tsx:935-1009`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem, next: string)`
    - *Deskripsi:* // Tanpa kecocokan (tanpa fuzzy) → tolak.
  - [`riskScore`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L614-L615) (`apps/web/src/pages/proyek/ProjectDetail.tsx:614-615`) [Tipe: `function`]
    - *Signature:* `(r: StoreItem): number`
    - *Deskripsi:* // Terlambat otomatis dari due (P8: bisa di-override manual).
  - [`nextMilestoneInvId`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L883-L901) (`apps/web/src/pages/proyek/ProjectDetail.tsx:883-901`) [Tipe: `function`]
    - *Signature:* `(tanggalISO: string): string`
    - *Deskripsi:* // Nomor invoice tunggal format Finance (INV/<TIPE>-SMD-YYYY-NNN).

### Sub-sistem: `cuti:absensi:final` (Klaster #824)
- **Kepadatan Simbol:** 47 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`contractDays`](file://apps/web/src/pages/sdm/HR.tsx#L398-L398) (`apps/web/src/pages/sdm/HR.tsx:398-398`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): number | null`
    - *Deskripsi:* // Cap waktu server UTC: dipotong 10 huruf pertama akan mundur sehari di WITA.
  - [`importCSV`](file://apps/web/src/pages/sdm/HR.tsx#L1303-L1425) (`apps/web/src/pages/sdm/HR.tsx:1303-1425`) [Tipe: `function`]
    - *Signature:* `(file: File)`
    - *Deskripsi:* /** Buka form UBAH surat yang sudah tersimpan. */
  - [`empNameOf`](file://apps/web/src/pages/sdm/HR.tsx#L911-L911) (`apps/web/src/pages/sdm/HR.tsx:911-911`) [Tipe: `function`]
    - *Signature:* `(id: string)`
    - *Deskripsi:* /**
   * Ubah cuti yang sudah DISETUJUI.
   *
   * Keberadaan jalur ini penting: tanpa itu, satu kesalahan admin (tanggal
   * salah, alasan keliru) pada cuti yang sudah final tidak bisa diperbaiki -
   * tombol Edit sengaja disembunyikan untuk status final karena biasanya cuti
   * yang sudah disetujui tidak boleh diubah.
   *
   * Yang dikunci di jalur ini: karyawan, periode, dan tipe - semuanya sudah
   * memengaruhi rekap absensi yang tersinkron otomatis saat persetujuan. Yang
   * boleh diubah: catatan dan lampiran, supaya data administratif tetap bisa
   * dikoreksi tanpa merusak rekap absensi.
   */
  - [`openTrainingEdit`](file://apps/web/src/pages/sdm/HR.tsx#L1006-L1015) (`apps/web/src/pages/sdm/HR.tsx:1006-1015`) [Tipe: `function`]
    - *Signature:* `(t: StoreItem)`
    - *Deskripsi:* /**
   * Ubah cuti yang sudah DISETUJUI.
   *
   * Keberadaan jalur ini penting: tanpa itu, satu kesalahan admin (tanggal
   * salah, alasan keliru) pada cuti yang sudah final tidak bisa diperbaiki -
   * tombol Edit sengaja disembunyikan untuk status final karena biasanya cuti
   * yang sudah disetujui tidak boleh diubah.
   *
   * Yang dikunci di jalur ini: karyawan, periode, dan tipe - semuanya sudah
   * memengaruhi rekap absensi yang tersinkron otomatis saat persetujuan. Yang
   * boleh diubah: catatan dan lampiran, supaya data administratif tetap bisa
   * dikoreksi tanpa merusak rekap absensi.
   */
  - [`pickNotifIds`](file://apps/web/src/pages/sdm/HR.tsx#L450-L467) (`apps/web/src/pages/sdm/HR.tsx:450-467`) [Tipe: `function`]
    - *Signature:* `(ids: string[]): void`
    - *Deskripsi:* // Cap waktu server UTC: dipotong 10 huruf pertama akan mundur sehari di WITA.

### Sub-sistem: `ringkas:enak:1234567` (Klaster #858)
- **Kepadatan Simbol:** 45 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`add`](file://services/api/src/pdf/document.ts#L169-L225) (`services/api/src/pdf/document.ts:169-225`) [Tipe: `method`]
    - *Signature:* `(block: Block): this`
    - *Deskripsi:* /**
   * Tambahkan blok. Satu blok per panggilan boleh panjang, tabel boleh banyak.
   */
  - [`add`](file://services/api/src/pdf/documents/shared.ts#L200-L206) (`services/api/src/pdf/documents/shared.ts:200-206`) [Tipe: `function`]
    - *Signature:* `(v: unknown): void`
  - [`add`](file://apps/web/src/components/ServiceNotes.tsx#L82-L105) (`apps/web/src/components/ServiceNotes.tsx:82-105`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`money`](file://services/api/src/pdf/documents/shared.ts#L99-L107) (`services/api/src/pdf/documents/shared.ts:99-107`) [Tipe: `function`]
    - *Signature:* `(v: unknown, decimals = 0): string`
  - [`rupiah`](file://services/api/src/pdf/documents/shared.ts#L110-L114) (`services/api/src/pdf/documents/shared.ts:110-114`) [Tipe: `function`]
    - *Signature:* `(v: unknown, decimals = 0): string`

### Sub-sistem: `tanggal:klien:prepare` (Klaster #639)
- **Kepadatan Simbol:** 41 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`str`](file://services/api/src/pdf/documents/shared.ts#L244-L250) (`services/api/src/pdf/documents/shared.ts:244-250`) [Tipe: `function`]
    - *Signature:* `(src: Record<string, unknown>, ...keys: string[]): string`
  - [`arr`](file://services/api/src/pdf/documents/shared.ts#L276-L294) (`services/api/src/pdf/documents/shared.ts:276-294`) [Tipe: `function`]
    - *Signature:* `(src: Record<string, unknown>, ...keys: string[]): Record<string, unknown>[]`
  - [`round1`](file://services/api/src/pdf/reports.ts#L118-L120) (`services/api/src/pdf/reports.ts:118-120`) [Tipe: `function`]
    - *Signature:* `(v: number): number`
  - [`allowanceTotal`](file://services/api/src/pdf/reports.ts#L106-L111) (`services/api/src/pdf/reports.ts:106-111`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`prepare`](file://services/api/src/pdf/registry.ts#L1318-L1329) (`services/api/src/pdf/registry.ts:1318-1329`) [Tipe: `method`]
    - *Signature:* `(_id, ctx)`

### Sub-sistem: `open:seq:archive` (Klaster #717)
- **Kepadatan Simbol:** 41 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`looksLikeUrl`](file://apps/web/src/utils/docAttachment.ts#L30-L37) (`apps/web/src/utils/docAttachment.ts:30-37`) [Tipe: `function`]
    - *Signature:* `(v: unknown): boolean`
  - [`setF`](file://apps/web/src/pages/dokumen/Documents.tsx#L677-L677) (`apps/web/src/pages/dokumen/Documents.tsx:677-677`) [Tipe: `function`]
    - *Signature:* `(k: string, v: string)`
  - [`maxSeq`](file://apps/web/src/utils/sb.ts#L59-L70) (`apps/web/src/utils/sb.ts:59-70`) [Tipe: `function`]
    - *Signature:* `(docNos: string[], re: RegExp): number`
  - [`flowTo`](file://apps/web/src/pages/dokumen/Documents.tsx#L613-L623) (`apps/web/src/pages/dokumen/Documents.tsx:613-623`) [Tipe: `function`]
    - *Signature:* `(d: StoreItem, next: string)`
  - [`openDetail`](file://apps/web/src/pages/dokumen/Documents.tsx#L464-L474) (`apps/web/src/pages/dokumen/Documents.tsx:464-474`) [Tipe: `function`]
    - *Signature:* `(d: StoreItem)`

### Sub-sistem: `projects:contract:quotations` (Klaster #708)
- **Kepadatan Simbol:** 40 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`dispStage`](file://apps/web/src/pages/crm/CRM.tsx#L82-L82) (`apps/web/src/pages/crm/CRM.tsx:82-82`) [Tipe: `function`]
    - *Signature:* `(s: string): string`
  - [`toggleSurvey`](file://apps/web/src/pages/crm/CRM.tsx#L129-L130) (`apps/web/src/pages/crm/CRM.tsx:129-130`) [Tipe: `function`]
    - *Signature:* `(clientId: string)`
    - *Deskripsi:* // via ConfirmModal + findUsages + cek relasi lokal.
  - [`nextProjectCode`](file://apps/web/src/pages/crm/CRM.tsx#L195-L204) (`apps/web/src/pages/crm/CRM.tsx:195-204`) [Tipe: `function`]
    - *Signature:* `(type: string, start: string): string`
    - *Deskripsi:* // Relasi lokal di luar findUsages: quotation←projects/contracts, request←quotations, contract←projects/clientPos.
  - [`openSend`](file://apps/web/src/pages/crm/CRM.tsx#L313-L317) (`apps/web/src/pages/crm/CRM.tsx:313-317`) [Tipe: `function`]
    - *Signature:* `(q: StoreItem)`
    - *Deskripsi:* // Relasi lokal di luar findUsages: quotation←projects/contracts, request←quotations, contract←projects/clientPos.
  - [`dispType`](file://apps/web/src/pages/crm/CRM.tsx#L85-L85) (`apps/web/src/pages/crm/CRM.tsx:85-85`) [Tipe: `function`]
    - *Signature:* `(t: string): string`

### Sub-sistem: `bonus:nominal:keterangan` (Klaster #775)
- **Kepadatan Simbol:** 36 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`askAdvance`](file://apps/web/src/pages/payroll/Payroll.tsx#L481-L490) (`apps/web/src/pages/payroll/Payroll.tsx:481-490`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem)`
    - *Deskripsi:* // Ubah THR/bonus HANYA bila Draft: nominal+keterangan (Bonus) / keterangan (THR, nominal turunan basis×masa).
  - [`empNameOf`](file://apps/web/src/pages/payroll/Payroll.tsx#L369-L369) (`apps/web/src/pages/payroll/Payroll.tsx:369-369`) [Tipe: `function`]
    - *Signature:* `(id: string): string`
    - *Deskripsi:* // Ubah THR/bonus HANYA bila Draft: nominal+keterangan (Bonus) / keterangan (THR, nominal turunan basis×masa).
  - [`openEdit`](file://apps/web/src/pages/payroll/Payroll.tsx#L517-L526) (`apps/web/src/pages/payroll/Payroll.tsx:517-526`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem)`
    - *Deskripsi:* // Ubah THR/bonus HANYA bila Draft: nominal+keterangan (Bonus) / keterangan (THR, nominal turunan basis×masa).
  - [`removeKasbon`](file://apps/web/src/pages/payroll/Payroll.tsx#L805-L811) (`apps/web/src/pages/payroll/Payroll.tsx:805-811`) [Tipe: `function`]
    - *Signature:* `(emp: StoreItem, kasbonId: string)`
    - *Deskripsi:* // Ubah THR/bonus HANYA bila Draft: nominal+keterangan (Bonus) / keterangan (THR, nominal turunan basis×masa).
  - [`empOf`](file://apps/web/src/pages/payroll/Payroll.tsx#L368-L368) (`apps/web/src/pages/payroll/Payroll.tsx:368-368`) [Tipe: `function`]
    - *Signature:* `(id: string): StoreItem | undefined`
    - *Deskripsi:* // Ubah THR/bonus HANYA bila Draft: nominal+keterangan (Bonus) / keterangan (THR, nominal turunan basis×masa).

### Sub-sistem: `dekat:muncul:kapan` (Klaster #515)
- **Kepadatan Simbol:** 26 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`push`](file://services/api/src/routes/readModels.ts#L24-L29) (`services/api/src/routes/readModels.ts:24-29`) [Tipe: `function`]
    - *Signature:* `(row: WbsPhotoRow): void`
  - [`push`](file://apps/web/src/pages/proyek/WbsTree.tsx#L19-L19) (`apps/web/src/pages/proyek/WbsTree.tsx:19-19`) [Tipe: `function`]
    - *Signature:* `(p: Photo): void`
  - [`push`](file://apps/web/src/utils/usages.ts#L13-L15) (`apps/web/src/utils/usages.ts:13-15`) [Tipe: `function`]
    - *Signature:* `(out: string[], n: number, label: string): void`
    - *Deskripsi:* // Perbandingan nama memakai sameName (trim + case-insensitive); join ID exact.
  - [`list`](file://apps/web/src/services/repositories.ts#L160-L194) (`apps/web/src/services/repositories.ts:160-194`) [Tipe: `method`]
    - *Signature:* `()`
  - [`sinceOf`](file://apps/web/src/utils/moduleAlerts.ts#L120-L124) (`apps/web/src/utils/moduleAlerts.ts:120-124`) [Tipe: `function`]
    - *Signature:* `(row: StoreItem, explicit?: unknown): string`
    - *Deskripsi:* /** Umur kondisi: dari field yang paling dekat ke "kapan ini muncul". */

### Sub-sistem: `klaim:lanjut:dlp` (Klaster #730)
- **Kepadatan Simbol:** 24 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`str`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L226-L226) (`apps/web/src/pages/kapal/VesselDetail.tsx:226-226`) [Tipe: `function`]
    - *Signature:* `(x: unknown): string`
  - [`setCompliance`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L259-L272) (`apps/web/src/pages/kapal/VesselDetail.tsx:259-272`) [Tipe: `function`]
    - *Signature:* `(name: string, patch: { status?: string; date?: string })`
    - *Deskripsi:* // Klaim garansi/DLP: Aktif → Klaim (lanjut Selesai setelah perbaikan).
  - [`removePlan`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L332-L337) (`apps/web/src/pages/kapal/VesselDetail.tsx:332-337`) [Tipe: `function`]
    - *Signature:* `(idx: number)`
    - *Deskripsi:* // Klaim garansi/DLP: Aktif → Klaim (lanjut Selesai setelah perbaikan).
  - [`openDockEdit`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L294-L299) (`apps/web/src/pages/kapal/VesselDetail.tsx:294-299`) [Tipe: `function`]
    - *Signature:* `(i: number)`
    - *Deskripsi:* // Klaim garansi/DLP: Aktif → Klaim (lanjut Selesai setelah perbaikan).
  - [`opt`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L241-L241) (`apps/web/src/pages/kapal/VesselDetail.tsx:241-241`) [Tipe: `function`]
    - *Signature:* `(x: string): number | null`

### Sub-sistem: `persist:parsial:divalidasi` (Klaster #676)
- **Kepadatan Simbol:** 22 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`persist`](file://services/api/src/routes/crud.ts#L729-L748) (`services/api/src/routes/crud.ts:729-748`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Hanya saat dock/proyek berganti: slot lama yang sudah terlanjur tidak dikunci.
  - [`registerCrud`](file://services/api/src/routes/crud.ts#L402-L858) (`services/api/src/routes/crud.ts:402-858`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance, table: string): void`
  - [`performWrite`](file://services/api/src/routes/crud.ts#L749-L753) (`services/api/src/routes/crud.ts:749-753`) [Tipe: `function`]
    - *Signature:* `(): Promise<string | null>`
    - *Deskripsi:* // Hanya saat dock/proyek berganti: slot lama yang sudah terlanjur tidak dikunci.
  - [`performDelete`](file://services/api/src/routes/crud.ts#L820-L834) (`services/api/src/routes/crud.ts:820-834`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // 5. activities: DELETE ditolak (append-only)
  - [`sendCached`](file://services/api/src/routes/crud.ts#L423-L427) (`services/api/src/routes/crud.ts:423-427`) [Tipe: `function`]
    - *Signature:* `(e: { etag: string; json: string })`

### Sub-sistem: `draw:bar:chart` (Klaster #618)
- **Kepadatan Simbol:** 22 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`measure`](file://services/api/src/pdf/measure.ts#L67-L88) (`services/api/src/pdf/measure.ts:67-88`) [Tipe: `function`]
    - *Signature:* `(
  pdf: jsPDF,
  text: string,
  opts: { font: FontName; size: number; embedded: boolean },
): number`
  - [`safeText`](file://services/api/src/pdf/font.ts#L127-L131) (`services/api/src/pdf/font.ts:127-131`) [Tipe: `function`]
    - *Signature:* `(s: unknown, spec?: FontSpec): string`
  - [`safe`](file://services/api/src/pdf/font.ts#L216-L218) (`services/api/src/pdf/font.ts:216-218`) [Tipe: `function`]
    - *Signature:* `(text: unknown, weight: FontName): string`
  - [`fmt`](file://apps/web/src/utils/stockIssue.ts#L48-L48) (`apps/web/src/utils/stockIssue.ts:48-48`) [Tipe: `function`]
    - *Signature:* `(n: number)`
  - [`txt`](file://services/api/src/pdf/chart.ts#L85-L97) (`services/api/src/pdf/chart.ts:85-97`) [Tipe: `function`]
    - *Signature:* `(ctx: ChartCtx, text: string, x: number, yBaseline: number, boxW: number, o: { size?: number; font?: FontName; color?: RGB; align?: "left" | "center" | "right" } = {}): void`
    - *Deskripsi:* /** 1.500.000 -> "1,5 jt". Memakai pemisah ribuan Indonesia (titik). */

### Sub-sistem: `draw:block:divider` (Klaster #604)
- **Kepadatan Simbol:** 20 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`lineHeightFor`](file://services/api/src/pdf/measure.ts#L156-L158) (`services/api/src/pdf/measure.ts:156-158`) [Tipe: `function`]
    - *Signature:* `(size: number, leading = 1.32): number`
  - [`drawText`](file://services/api/src/pdf/blocks.ts#L89-L127) (`services/api/src/pdf/blocks.ts:89-127`) [Tipe: `function`]
    - *Signature:* `(
  ctx: Ctx,
  rec: DrawRecord[],
  text: string,
  x: number,
  yBaseline: number,
  boxW: number,
  o: TextOpts = {},
): void`
  - [`drawLine`](file://services/api/src/pdf/blocks.ts#L129-L142) (`services/api/src/pdf/blocks.ts:129-142`) [Tipe: `function`]
    - *Signature:* `(ctx: Ctx, rec: DrawRecord[], x1: number, y1: number, x2: number, y2: number, color: RGB, weight = STROKE.thin): void`
  - [`wrap`](file://services/api/src/pdf/measure.ts#L100-L148) (`services/api/src/pdf/measure.ts:100-148`) [Tipe: `function`]
    - *Signature:* `(
  pdf: jsPDF,
  text: string,
  maxMm: number,
  opts: { font: FontName; size: number; embedded: boolean },
): string[]`
  - [`keyValue`](file://services/api/src/pdf/blocks.ts#L384-L431) (`services/api/src/pdf/blocks.ts:384-431`) [Tipe: `function`]
    - *Signature:* `(spec: KvSpec): Block`

### Sub-sistem: `edit:save:att` (Klaster #829)
- **Kepadatan Simbol:** 20 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`openLeaveEdit`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L401-L411) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:401-411`) [Tipe: `function`]
    - *Signature:* `(l: StoreItem)`
  - [`delRowDesc`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L476-L496) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:476-496`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`attOtApproved`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L341-L341) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:341-341`) [Tipe: `function`]
    - *Signature:* `(a: StoreItem): boolean`
  - [`openAttEdit`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L343-L362) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:343-362`) [Tipe: `function`]
    - *Signature:* `(a: StoreItem)`
  - [`delCert`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L257-L263) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:257-263`) [Tipe: `function`]
    - *Signature:* `(name: string)`

### Sub-sistem: `svc:service:open` (Klaster #812)
- **Kepadatan Simbol:** 19 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`onError`](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L262-L265) (`apps/web/src/pages/proyek/SparepartServiceSection.tsx:262-265`) [Tipe: `function`]
    - *Signature:* `()`
  - [`svcTypeLabel`](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L78-L78) (`apps/web/src/pages/proyek/SparepartServiceSection.tsx:78-78`) [Tipe: `function`]
    - *Signature:* `(t: string): string`
  - [`saveFromInventory`](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L308-L335) (`apps/web/src/pages/proyek/SparepartServiceSection.tsx:308-335`) [Tipe: `function`]
    - *Signature:* `()`
  - [`advanceService`](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L195-L202) (`apps/web/src/pages/proyek/SparepartServiceSection.tsx:195-202`) [Tipe: `function`]
    - *Signature:* `(s: SvcExt, next: SvcExt["status"])`
  - [`openEditSvc`](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L102-L115) (`apps/web/src/pages/proyek/SparepartServiceSection.tsx:102-115`) [Tipe: `function`]
    - *Signature:* `(s: SvcExt)`

### Sub-sistem: `cabang:seksi:absensi` (Klaster #767)
- **Kepadatan Simbol:** 19 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`shiftMonth`](file://apps/web/src/pages/laporan/Laporan.tsx#L69-L74) (`apps/web/src/pages/laporan/Laporan.tsx:69-74`) [Tipe: `function`]
    - *Signature:* `(ym: string, delta: number): string`
  - [`sigRows`](file://apps/web/src/pages/laporan/Laporan.tsx#L252-L254) (`apps/web/src/pages/laporan/Laporan.tsx:252-254`) [Tipe: `function`]
    - *Signature:* `(): unknown[][]`
    - *Deskripsi:* // Filter cabang lokal untuk seksi PO/absensi/insiden/payroll (Semua + daftar cabang).
  - [`matchProject`](file://apps/web/src/pages/laporan/Laporan.tsx#L133-L137) (`apps/web/src/pages/laporan/Laporan.tsx:133-137`) [Tipe: `function`]
    - *Signature:* `(pid: string): boolean`
    - *Deskripsi:* // Filter cabang lokal untuk seksi PO/absensi/insiden/payroll (Semua + daftar cabang).
  - [`applyTpl`](file://apps/web/src/pages/laporan/Laporan.tsx#L275-L282) (`apps/web/src/pages/laporan/Laporan.tsx:275-282`) [Tipe: `function`]
    - *Signature:* `(t: ReportTpl)`
    - *Deskripsi:* // Filter cabang lokal untuk seksi PO/absensi/insiden/payroll (Semua + daftar cabang).
  - [`exportProject`](file://apps/web/src/pages/laporan/Laporan.tsx#L353-L375) (`apps/web/src/pages/laporan/Laporan.tsx:353-375`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Filter cabang lokal untuk seksi PO/absensi/insiden/payroll (Semua + daftar cabang).

### Sub-sistem: `dibuka:saat:jangan` (Klaster #417)
- **Kepadatan Simbol:** 18 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isGroupOpen`](file://apps/web/src/layouts/AppShell.tsx#L151-L151) (`apps/web/src/layouts/AppShell.tsx:151-151`) [Tipe: `function`]
    - *Signature:* `(label: string): boolean`
    - *Deskripsi:* // Accordion grup nav: default open semua, pilihan persist.
  - [`toggleGroup`](file://apps/web/src/layouts/AppShell.tsx#L152-L162) (`apps/web/src/layouts/AppShell.tsx:152-162`) [Tipe: `function`]
    - *Signature:* `(label: string)`
    - *Deskripsi:* // Accordion grup nav: default open semua, pilihan persist.
  - [`markNotifRead`](file://apps/web/src/layouts/AppShell.tsx#L188-L194) (`apps/web/src/layouts/AppShell.tsx:188-194`) [Tipe: `function`]
    - *Signature:* `(id: string)`
    - *Deskripsi:* // Jangan tarik semua WBS saat Finance/P&L dibuka; sync on-demand saat bell dibuka.
  - [`beat`](file://apps/web/src/layouts/AppShell.tsx#L110-L113) (`apps/web/src/layouts/AppShell.tsx:110-113`) [Tipe: `function`]
    - *Signature:* `()`
  - [`doChangePassword`](file://apps/web/src/layouts/AppShell.tsx#L315-L335) (`apps/web/src/layouts/AppShell.tsx:315-335`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Jangan tarik semua WBS saat Finance/P&L dibuka; sync on-demand saat bell dibuka.

### Sub-sistem: `absensi:pemakai:confirmmodal` (Klaster #704)
- **Kepadatan Simbol:** 18 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rejectOT`](file://apps/web/src/pages/absensi/Absensi.tsx#L409-L415) (`apps/web/src/pages/absensi/Absensi.tsx:409-415`) [Tipe: `function`]
    - *Signature:* `(a: StoreItem)`
    - *Deskripsi:* // Hapus baris absensi via ConfirmModal + daftar pemakai.
  - [`persist`](file://apps/web/src/pages/absensi/Absensi.tsx#L155-L196) (`apps/web/src/pages/absensi/Absensi.tsx:155-196`) [Tipe: `function`]
    - *Signature:* `(overwrite: boolean)`
    - *Deskripsi:* // Hapus baris absensi via ConfirmModal + daftar pemakai.
  - [`rowFor`](file://apps/web/src/pages/absensi/Absensi.tsx#L126-L126) (`apps/web/src/pages/absensi/Absensi.tsx:126-126`) [Tipe: `function`]
    - *Signature:* `(id: string): CatatRow`
    - *Deskripsi:* // Hapus baris absensi via ConfirmModal + daftar pemakai.
  - [`setRow`](file://apps/web/src/pages/absensi/Absensi.tsx#L127-L128) (`apps/web/src/pages/absensi/Absensi.tsx:127-128`) [Tipe: `function`]
    - *Signature:* `(id: string, patch: Partial<CatatRow>)`
    - *Deskripsi:* // Hapus baris absensi via ConfirmModal + daftar pemakai.
  - [`empNameOf`](file://apps/web/src/pages/absensi/Absensi.tsx#L398-L398) (`apps/web/src/pages/absensi/Absensi.tsx:398-398`) [Tipe: `function`]
    - *Signature:* `(id: string): string`
    - *Deskripsi:* // Hapus baris absensi via ConfirmModal + daftar pemakai.

### Sub-sistem: `draft:saja:harga` (Klaster #797)
- **Kepadatan Simbol:** 18 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`changeStatus`](file://apps/web/src/pages/proyek/BoQSection.tsx#L269-L279) (`apps/web/src/pages/proyek/BoQSection.tsx:269-279`) [Tipe: `function`]
    - *Signature:* `(id: string, newStatus: string)`
    - *Deskripsi:* // Ubah qty/harga (Draft/Pending saja) + hapus (Draft saja) via ConfirmModal.
  - [`logOf`](file://apps/web/src/pages/proyek/BoQSection.tsx#L180-L186) (`apps/web/src/pages/proyek/BoQSection.tsx:180-186`) [Tipe: `function`]
    - *Signature:* `(id: string): { time: string; text: string; target: string }[]`
    - *Deskripsi:* // Ubah qty/harga (Draft/Pending saja) + hapus (Draft saja) via ConfirmModal.
  - [`nextStatus`](file://apps/web/src/pages/proyek/BoQSection.tsx#L188-L188) (`apps/web/src/pages/proyek/BoQSection.tsx:188-188`) [Tipe: `function`]
    - *Signature:* `(current: string): string[]`
    - *Deskripsi:* // Ubah qty/harga (Draft/Pending saja) + hapus (Draft saja) via ConfirmModal.
  - [`pos`](file://apps/web/src/pages/proyek/BoQSection.tsx#L171-L171) (`apps/web/src/pages/proyek/BoQSection.tsx:171-171`) [Tipe: `function`]
    - *Signature:* `(s: string): number`
  - [`openEdit`](file://apps/web/src/pages/proyek/BoQSection.tsx#L306-L310) (`apps/web/src/pages/proyek/BoQSection.tsx:306-310`) [Tipe: `function`]
    - *Signature:* `(b: BoQExt)`
    - *Deskripsi:* // Ubah qty & harga satuan (Draft/Pending saja; Approved/Completed terkunci alur).

### Sub-sistem: `paginasi:fresh:limit` (Klaster #460)
- **Kepadatan Simbol:** 17 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rowToItem`](file://apps/web/src/services/repositories.ts#L66-L73) (`apps/web/src/services/repositories.ts:66-73`) [Tipe: `function`]
    - *Signature:* `(row: BackendRow): StoreItem`
    - *Deskripsi:* /** Query paginasi server-side (GET /api/<table>?limit=&offset=). */
  - [`isBackendPage`](file://apps/web/src/services/repositories.ts#L119-L121) (`apps/web/src/services/repositories.ts:119-121`) [Tipe: `function`]
    - *Signature:* `(v: unknown): v is BackendPage`
    - *Deskripsi:* /** Query paginasi server-side (GET /api/<table>?limit=&offset=). */
  - [`remove`](file://apps/web/src/services/repositories.ts#L249-L251) (`apps/web/src/services/repositories.ts:249-251`) [Tipe: `method`]
    - *Signature:* `(id)`
  - [`isBackendConfigured`](file://apps/web/src/services/http.ts#L99-L101) (`apps/web/src/services/http.ts:99-101`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`collect`](file://apps/web/src/services/repositories.ts#L143-L154) (`apps/web/src/services/repositories.ts:143-154`) [Tipe: `function`]
    - *Signature:* `(pages: StoreItem[], limit: number): StoreItem[]`

### Sub-sistem: `footer:ruang:bawah` (Klaster #629)
- **Kepadatan Simbol:** 17 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`bottom`](file://services/api/src/pdf/document.ts#L113-L115) (`services/api/src/pdf/document.ts:113-115`) [Tipe: `method`]
    - *Signature:* `(): number`
    - *Deskripsi:* /** Batas bawah area isi. Footer diberi ruang 8 mm. */
  - [`newPage`](file://services/api/src/pdf/document.ts#L128-L132) (`services/api/src/pdf/document.ts:128-132`) [Tipe: `method`]
    - *Signature:* `(): void`
    - *Deskripsi:* /** Batas bawah area isi. Footer diberi ruang 8 mm. */
  - [`ctx`](file://services/api/src/pdf/document.ts#L117-L126) (`services/api/src/pdf/document.ts:117-126`) [Tipe: `method`]
    - *Signature:* `(): Ctx`
    - *Deskripsi:* /** Batas bawah area isi. Footer diberi ruang 8 mm. */
  - [`cjkChars`](file://services/api/src/pdf/font.ts#L196-L203) (`services/api/src/pdf/font.ts:196-203`) [Tipe: `function`]
    - *Signature:* `(text: string): string[]`
  - [`fontName`](file://services/api/src/pdf/font.ts#L211-L213) (`services/api/src/pdf/font.ts:211-213`) [Tipe: `function`]
    - *Signature:* `(weight: FontName): string`

### Sub-sistem: `dashboard:attention:target` (Klaster #428)
- **Kepadatan Simbol:** 17 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`goAttentionItem`](file://apps/web/src/pages/Dashboard.tsx#L550-L553) (`apps/web/src/pages/Dashboard.tsx:550-553`) [Tipe: `function`]
    - *Signature:* `(key: ModuleAlertKey, rowId: string)`
  - [`toneFor`](file://apps/web/src/pages/Dashboard.tsx#L926-L927) (`apps/web/src/pages/Dashboard.tsx:926-927`) [Tipe: `function`]
    - *Signature:* `(s: string): "blue" | "amber" | "red" | "gray" | "green"`
  - [`toggleAttentionCategory`](file://apps/web/src/pages/Dashboard.tsx#L555-L564) (`apps/web/src/pages/Dashboard.tsx:555-564`) [Tipe: `function`]
    - *Signature:* `(key: ModuleAlertKey)`
  - [`highlightOf`](file://apps/web/src/pages/Dashboard.tsx#L286-L287) (`apps/web/src/pages/Dashboard.tsx:286-287`) [Tipe: `function`]
    - *Signature:* `(ids: string[]): string`
  - [`statusLabel`](file://apps/web/src/pages/Dashboard.tsx#L209-L213) (`apps/web/src/pages/Dashboard.tsx:209-213`) [Tipe: `function`]
    - *Signature:* `(s: string, locale: Locale): string`

### Sub-sistem: `survei:blokir:pemakai` (Klaster #736)
- **Kepadatan Simbol:** 17 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pickNotifIds`](file://apps/web/src/pages/kapal/Vessels.tsx#L238-L245) (`apps/web/src/pages/kapal/Vessels.tsx:238-245`) [Tipe: `function`]
    - *Signature:* `(ids: string[]): void`
    - *Deskripsi:* // Hapus kapal via ConfirmModal + daftar pemakai (blokir bila dipakai proyek/survei/dock/garansi).
  - [`openEdit`](file://apps/web/src/pages/kapal/Vessels.tsx#L278-L281) (`apps/web/src/pages/kapal/Vessels.tsx:278-281`) [Tipe: `function`]
    - *Signature:* `(v: StoreItem)`
    - *Deskripsi:* // Hapus kapal via ConfirmModal + daftar pemakai (blokir bila dipakai proyek/survei/dock/garansi).
  - [`slotCountFor`](file://apps/web/src/pages/kapal/Vessels.tsx#L257-L257) (`apps/web/src/pages/kapal/Vessels.tsx:257-257`) [Tipe: `function`]
    - *Signature:* `(name: string)`
    - *Deskripsi:* // Hapus kapal via ConfirmModal + daftar pemakai (blokir bila dipakai proyek/survei/dock/garansi).
  - [`clientOptionsFor`](file://apps/web/src/pages/kapal/Vessels.tsx#L152-L154) (`apps/web/src/pages/kapal/Vessels.tsx:152-154`) [Tipe: `function`]
    - *Signature:* `(currentValue: string)`
  - [`closeSurveyModal`](file://apps/web/src/pages/kapal/Vessels.tsx#L183-L186) (`apps/web/src/pages/kapal/Vessels.tsx:183-186`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Hapus kapal via ConfirmModal + daftar pemakai (blokir bila dipakai proyek/survei/dock/garansi).

### Sub-sistem: `peran:email:user` (Klaster #790)
- **Kepadatan Simbol:** 17 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`doLinkEmployee`](file://apps/web/src/pages/pengaturan/Peran.tsx#L479-L492) (`apps/web/src/pages/pengaturan/Peran.tsx:479-492`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Aktivitas terbaru per aktor (username).
  - [`loadAudit`](file://apps/web/src/pages/pengaturan/Peran.tsx#L453-L462) (`apps/web/src/pages/pengaturan/Peran.tsx:453-462`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // walau user sudah offline (audit tersimpan permanen di BE).
  - [`doToggleActive`](file://apps/web/src/pages/pengaturan/Peran.tsx#L494-L511) (`apps/web/src/pages/pengaturan/Peran.tsx:494-511`) [Tipe: `function`]
    - *Signature:* `(u: ManagedUser)`
    - *Deskripsi:* // Aktivitas terbaru per aktor (username).
  - [`empNameOf`](file://apps/web/src/pages/pengaturan/Peran.tsx#L334-L338) (`apps/web/src/pages/pengaturan/Peran.tsx:334-338`) [Tipe: `function`]
    - *Signature:* `(id: string | null | undefined): string`
    - *Deskripsi:* // Ubah user: nama + peran + email via PATCH.
  - [`loadSessions`](file://apps/web/src/pages/pengaturan/Peran.tsx#L438-L449) (`apps/web/src/pages/pengaturan/Peran.tsx:438-449`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Ubah user: nama + peran + email via PATCH.

### Sub-sistem: `income:analytics:point` (Klaster #425)
- **Kepadatan Simbol:** 16 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`q`](file://apps/web/src/pages/Analytics.tsx#L479-L479) (`apps/web/src/pages/Analytics.tsx:479-479`) [Tipe: `function`]
    - *Signature:* `(d: Date): number`
  - [`income`](file://apps/web/src/pages/Analytics.tsx#L313-L325) (`apps/web/src/pages/Analytics.tsx:313-325`) [Tipe: `function`]
    - *Signature:* `(codes: string[]): Record<string, number>`
  - [`delNote`](file://apps/web/src/pages/Analytics.tsx#L577-L583) (`apps/web/src/pages/Analytics.tsx:577-583`) [Tipe: `function`]
    - *Signature:* `(idx: number)`
  - [`annualFor`](file://apps/web/src/pages/Analytics.tsx#L556-L556) (`apps/web/src/pages/Analytics.tsx:556-556`) [Tipe: `function`]
    - *Signature:* `(s: Scenario): number`
  - [`numOf`](file://apps/web/src/utils/series.ts#L56-L59) (`apps/web/src/utils/series.ts:56-59`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`

### Sub-sistem: `dimemo:monitoringfeed:menghitung` (Klaster #801)
- **Kepadatan Simbol:** 15 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fmtMiliar`](file://apps/web/src/utils/format.ts#L89-L92) (`apps/web/src/utils/format.ts:89-92`) [Tipe: `function`]
    - *Signature:* `(n: number): string`
  - [`syncScroll`](file://apps/web/src/pages/proyek/Monitoring.tsx#L74-L81) (`apps/web/src/pages/proyek/Monitoring.tsx:74-81`) [Tipe: `function`]
    - *Signature:* `(src: HTMLDivElement | null, ...dsts: (HTMLDivElement | null)[])`
    - *Deskripsi:* // Dimemo supaya feed (MonitoringFeed) tidak menghitung ulang setiap render.
  - [`diajukanCo`](file://apps/web/src/pages/proyek/Monitoring.tsx#L138-L139) (`apps/web/src/pages/proyek/Monitoring.tsx:138-139`) [Tipe: `function`]
    - *Signature:* `(pid: string): StoreItem[]`
    - *Deskripsi:* // Dimemo supaya feed (MonitoringFeed) tidak menghitung ulang setiap render.
  - [`delayDaysOf`](file://apps/web/src/pages/proyek/Monitoring.tsx#L177-L178) (`apps/web/src/pages/proyek/Monitoring.tsx:177-178`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem): number | null`
    - *Deskripsi:* // Dimemo supaya feed (MonitoringFeed) tidak menghitung ulang setiap render.
  - [`isLate`](file://apps/web/src/pages/proyek/Monitoring.tsx#L147-L147) (`apps/web/src/pages/proyek/Monitoring.tsx:147-147`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem): boolean`
    - *Deskripsi:* // Dimemo supaya feed (MonitoringFeed) tidak menghitung ulang setiap render.

### Sub-sistem: `convert:send:move` (Klaster #710)
- **Kepadatan Simbol:** 15 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/pages/crm/QuotationDetail.tsx#L23-L23) (`apps/web/src/pages/crm/QuotationDetail.tsx:23-23`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`markTerminal`](file://apps/web/src/pages/crm/QuotationDetail.tsx#L127-L134) (`apps/web/src/pages/crm/QuotationDetail.tsx:127-134`) [Tipe: `function`]
    - *Signature:* `(stage: "Batal" | "Kalah")`
  - [`nextProjectCode`](file://apps/web/src/pages/crm/QuotationDetail.tsx#L136-L145) (`apps/web/src/pages/crm/QuotationDetail.tsx:136-145`) [Tipe: `function`]
    - *Signature:* `(type: string, start: string): string`
  - [`setLine`](file://apps/web/src/pages/crm/QuotationDetail.tsx#L90-L94) (`apps/web/src/pages/crm/QuotationDetail.tsx:90-94`) [Tipe: `function`]
    - *Signature:* `(idx: number, k: keyof QLine, v: string)`
  - [`move`](file://apps/web/src/pages/crm/QuotationDetail.tsx#L115-L125) (`apps/web/src/pages/crm/QuotationDetail.tsx:115-125`) [Tipe: `function`]
    - *Signature:* `(dir: 1 | -1)`

### Sub-sistem: `move:employee:save` (Klaster #737)
- **Kepadatan Simbol:** 14 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`openMoveEdit`](file://apps/web/src/pages/inventori/BomDetail.tsx#L129-L138) (`apps/web/src/pages/inventori/BomDetail.tsx:129-138`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem)`
  - [`employeeOptions`](file://apps/web/src/utils/employeeOptions.ts#L39-L56) (`apps/web/src/utils/employeeOptions.ts:39-56`) [Tipe: `function`]
    - *Signature:* `(
  employees: readonly StoreItem[],
  extra: EmployeeOptionExtra = {},
): PickerOption[]`
  - [`isKnownEmployee`](file://apps/web/src/utils/employeeOptions.ts#L68-L72) (`apps/web/src/utils/employeeOptions.ts:68-72`) [Tipe: `function`]
    - *Signature:* `(employees: readonly StoreItem[], name: unknown): boolean`
  - [`reservedQty`](file://apps/web/src/pages/inventori/BomDetail.tsx#L29-L32) (`apps/web/src/pages/inventori/BomDetail.tsx:29-32`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): number`
  - [`qrPayloadOf`](file://apps/web/src/pages/inventori/BomDetail.tsx#L38-L40) (`apps/web/src/pages/inventori/BomDetail.tsx:38-40`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): string`

### Sub-sistem: `group:mark:notif` (Klaster #769)
- **Kepadatan Simbol:** 14 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`markGroup`](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L167-L172) (`apps/web/src/pages/notifikasi/Notifikasi.tsx:167-172`) [Tipe: `function`]
    - *Signature:* `(ids: string[])`
  - [`markOne`](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L155-L160) (`apps/web/src/pages/notifikasi/Notifikasi.tsx:155-160`) [Tipe: `function`]
    - *Signature:* `(id: string)`
  - [`persist`](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L150-L153) (`apps/web/src/pages/notifikasi/Notifikasi.tsx:150-153`) [Tipe: `function`]
    - *Signature:* `(next: Set<string>)`
  - [`saveNotifRead`](file://apps/web/src/utils/notifRead.ts#L15-L21) (`apps/web/src/utils/notifRead.ts:15-21`) [Tipe: `function`]
    - *Signature:* `(ids: Set<string>): void`
  - [`loadNotifRead`](file://apps/web/src/utils/notifRead.ts#L5-L13) (`apps/web/src/utils/notifRead.ts:5-13`) [Tipe: `function`]
    - *Signature:* `(): Set<string>`

### Sub-sistem: `cabang:inspeksi:lingkup` (Klaster #819)
- **Kepadatan Simbol:** 13 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`patchItem`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L166-L168) (`apps/web/src/pages/qc/ChecklistTab.tsx:166-168`) [Tipe: `function`]
    - *Signature:* `(si: number, ii: number, patch: Partial<EditItem>)`
    - *Deskripsi:* // Lingkup cabang sesi: proyek & hasil inspeksi cabang lain tidak ikut tampil.
  - [`openEdit`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L138-L144) (`apps/web/src/pages/qc/ChecklistTab.tsx:138-144`) [Tipe: `function`]
    - *Signature:* `(t?: StoreItem)`
    - *Deskripsi:* // Lingkup cabang sesi: proyek & hasil inspeksi cabang lain tidak ikut tampil.
  - [`seg`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L170-L173) (`apps/web/src/pages/qc/ChecklistTab.tsx:170-173`) [Tipe: `function`]
    - *Signature:* `(v: typeof view, label: string)`
    - *Deskripsi:* // Lingkup cabang sesi: proyek & hasil inspeksi cabang lain tidak ikut tampil.
  - [`hseOf`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L57-L59) (`apps/web/src/pages/qc/ChecklistTab.tsx:57-59`) [Tipe: `function`]
    - *Signature:* `(empId: string)`
    - *Deskripsi:* // Lingkup cabang sesi: proyek & hasil inspeksi cabang lain tidak ikut tampil.
  - [`startInspection`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L72-L94) (`apps/web/src/pages/qc/ChecklistTab.tsx:72-94`) [Tipe: `function`]
    - *Signature:* `(target: { pid: string; task: string; empId?: string; assignee?: string })`
    - *Deskripsi:* // Lingkup cabang sesi: proyek & hasil inspeksi cabang lain tidak ikut tampil.

### Sub-sistem: `keluar:pengeluaran:alokasi` (Klaster #875)
- **Kepadatan Simbol:** 13 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`setPick`](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L75-L83) (`apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx:75-83`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem, patch: Partial<{
    on: boolean;
    qty: string;
    itemId: string;
    warehouse: string;
    rack: string;
    bin: string;
  }>)`
    - *Deskripsi:* // ---------- Terima dari PO ----------
  - [`stockOf`](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L173-L173) (`apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx:173-173`) [Tipe: `function`]
    - *Signature:* `(itemId: unknown)`
    - *Deskripsi:* // ---------- Keluar untuk permintaan (Checklist MR) ----------
  - [`stockLabel`](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L279-L280) (`apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx:279-280`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem)`
    - *Deskripsi:* // ---------- Additional keluar (eceran / potongan / biasa) ----------
  - [`onSelectProcPo`](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L216-L223) (`apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx:216-223`) [Tipe: `function`]
    - *Signature:* `(poId: string)`
    - *Deskripsi:* // ---------- Procurement: pengeluaran alokasi PO proyek ----------
  - [`onSelectAddInItem`](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L121-L130) (`apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx:121-130`) [Tipe: `function`]
    - *Signature:* `(itemId: string)`
    - *Deskripsi:* // ---------- Additional masuk ----------

### Sub-sistem: `ditunggu:terbatas:vendor` (Klaster #184)
- **Kepadatan Simbol:** 12 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parse`](file://services/api/src/poFulfillment.ts#L32-L34) (`services/api/src/poFulfillment.ts:32-34`) [Tipe: `function`]
    - *Signature:* `(row: Row): Data`
  - [`num`](file://services/api/src/poFulfillment.ts#L35-L35) (`services/api/src/poFulfillment.ts:35-35`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`savePo`](file://services/api/src/poFulfillment.ts#L43-L49) (`services/api/src/poFulfillment.ts:43-49`) [Tipe: `function`]
    - *Signature:* `(row: Row, data: Data, now: string): Promise<void>`
  - [`loadPo`](file://services/api/src/poFulfillment.ts#L37-L41) (`services/api/src/poFulfillment.ts:37-41`) [Tipe: `function`]
    - *Signature:* `(id: string): Promise<Row>`
  - [`multiItem`](file://services/api/src/poFulfillment.ts#L59-L64) (`services/api/src/poFulfillment.ts:59-64`) [Tipe: `function`]
    - *Signature:* `(po: Data): boolean`
    - *Deskripsi:* /** Sisa yang masih ditunggu dari vendor PO ini. PO lama tanpa qty → tak terbatas. */

### Sub-sistem: `revise:transition:remote` (Klaster #799)
- **Kepadatan Simbol:** 12 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`statusLabel`](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L84-L87) (`apps/web/src/pages/proyek/BoqDocsSection.tsx:84-87`) [Tipe: `function`]
    - *Signature:* `(s: DocStatus): string`
  - [`revise`](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L192-L237) (`apps/web/src/pages/proyek/BoqDocsSection.tsx:192-237`) [Tipe: `function`]
    - *Signature:* `(doc: DocRow)`
  - [`handleExportExcel`](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L322-L373) (`apps/web/src/pages/proyek/BoqDocsSection.tsx:322-373`) [Tipe: `function`]
    - *Signature:* `(openDoc: DocRow)`
  - [`handleEnterprisePrint`](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L289-L320) (`apps/web/src/pages/proyek/BoqDocsSection.tsx:289-320`) [Tipe: `function`]
    - *Signature:* `(openDoc: DocRow)`
  - [`totalOf`](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L81-L81) (`apps/web/src/pages/proyek/BoqDocsSection.tsx:81-81`) [Tipe: `function`]
    - *Signature:* `(docId: string)`

### Sub-sistem: `termasuk:menunggu:turunan` (Klaster #776)
- **Kepadatan Simbol:** 11 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`hasPermission`](file://apps/web/src/auth/auth.tsx#L38-L51) (`apps/web/src/auth/auth.tsx:38-51`) [Tipe: `function`]
    - *Signature:* `(
  permissions: PermissionsMap | undefined | null,
  collection: string,
  action: PermissionAction = "r",
): boolean`
  - [`doFulfill`](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L129-L138) (`apps/web/src/pages/procurement/MaterialRequestsTab.tsx:129-138`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem)`
    - *Deskripsi:* // Status tampilan (termasuk "Menunggu stok" turunan) ikut bisa dicari.
  - [`stockOf`](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L60-L63) (`apps/web/src/pages/procurement/MaterialRequestsTab.tsx:60-63`) [Tipe: `function`]
    - *Signature:* `(itemId: unknown)`
    - *Deskripsi:* // Status tampilan (termasuk "Menunggu stok" turunan) ikut bisa dicari.
  - [`doApprove`](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L109-L116) (`apps/web/src/pages/procurement/MaterialRequestsTab.tsx:109-116`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem)`
    - *Deskripsi:* // Status tampilan (termasuk "Menunggu stok" turunan) ikut bisa dicari.
  - [`stTone`](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L59-L59) (`apps/web/src/pages/procurement/MaterialRequestsTab.tsx:59-59`) [Tipe: `function`]
    - *Signature:* `(st: string)`
    - *Deskripsi:* // Status tampilan (termasuk "Menunggu stok" turunan) ikut bisa dicari.

### Sub-sistem: `clear:capture:write` (Klaster #381)
- **Kepadatan Simbol:** 11 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`clear`](file://apps/web/src/data/sideMapEpochs.ts#L93-L96) (`apps/web/src/data/sideMapEpochs.ts:93-96`) [Tipe: `method`]
    - *Signature:* `(): void`
  - [`key`](file://apps/web/src/data/sideMapEpochs.ts#L26-L28) (`apps/web/src/data/sideMapEpochs.ts:26-28`) [Tipe: `method`]
    - *Signature:* `(kind: SideMapKind, projectId: string): string`
  - [`bump`](file://apps/web/src/data/sideMapEpochs.ts#L30-L35) (`apps/web/src/data/sideMapEpochs.ts:30-35`) [Tipe: `method`]
    - *Signature:* `(kind: SideMapKind, projectId: string): number`
  - [`beginWrite`](file://apps/web/src/data/sideMapEpochs.ts#L37-L45) (`apps/web/src/data/sideMapEpochs.ts:37-45`) [Tipe: `method`]
    - *Signature:* `(kind: SideMapKind, projectId: string): number`
  - [`finishWrite`](file://apps/web/src/data/sideMapEpochs.ts#L47-L55) (`apps/web/src/data/sideMapEpochs.ts:47-55`) [Tipe: `method`]
    - *Signature:* `(kind: SideMapKind, projectId: string, token: number): void`

### Sub-sistem: `approve:create:auth` (Klaster #113)
- **Kepadatan Simbol:** 10 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`patch`](file://services/api/scripts/service-flow-probe.ts#L58-L58) (`services/api/scripts/service-flow-probe.ts:58-58`) [Tipe: `function`]
    - *Signature:* `(id: string, data: Record<string, unknown>)`
  - [`create`](file://services/api/scripts/service-flow-probe.ts#L49-L53) (`services/api/scripts/service-flow-probe.ts:49-53`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>)`
  - [`assert`](file://services/api/scripts/service-flow-probe.ts#L13-L16) (`services/api/scripts/service-flow-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`approve`](file://services/api/scripts/service-flow-probe.ts#L59-L61) (`services/api/scripts/service-flow-probe.ts:59-61`) [Tipe: `function`]
    - *Signature:* `(t: string, id: string, approval: string, note?: string)`
  - [`auth`](file://services/api/scripts/service-flow-probe.ts#L47-L47) (`services/api/scripts/service-flow-probe.ts:47-47`) [Tipe: `function`]
    - *Signature:* `(t: string)`

### Sub-sistem: `tempo:terlambat:risiko` (Klaster #808)
- **Kepadatan Simbol:** 10 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rowHighlightClass`](file://apps/web/src/components/rowHighlight.ts#L49-L61) (`apps/web/src/components/rowHighlight.ts:49-61`) [Tipe: `function`]
    - *Signature:* `({ id, flash, notified = false, base = "" }: RowHighlightInput): string`
  - [`flashPick`](file://apps/web/src/components/AlertBanner.tsx#L130-L141) (`apps/web/src/components/AlertBanner.tsx:130-141`) [Tipe: `function`]
    - *Signature:* `(
  flash: Pick<ReturnType<typeof useNotifFlash>, "pick" | "pickMany">,
  ids: string[],
  index: number,
  goToPage: (p: number) => void,
  size: number,
): void`
  - [`pickNotifIds`](file://apps/web/src/pages/proyek/Projects.tsx#L235-L239) (`apps/web/src/pages/proyek/Projects.tsx:235-239`) [Tipe: `function`]
    - *Signature:* `(ids: string[]): void`
    - *Deskripsi:* // tempo atau terlambat otomatis menjadi risiko aktif.
  - [`isBatal`](file://apps/web/src/pages/proyek/Projects.tsx#L206-L206) (`apps/web/src/pages/proyek/Projects.tsx:206-206`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem): boolean`
    - *Deskripsi:* // tempo atau terlambat otomatis menjadi risiko aktif.
  - [`shouldClearOverride`](file://apps/web/src/utils/projectDelay.ts#L124-L131) (`apps/web/src/utils/projectDelay.ts:124-131`) [Tipe: `function`]
    - *Signature:* `(
  project: Record<string, unknown>,
  today: string,
  isOverdueFn: (p: Record<string, unknown>, today: string) => boolean,
): boolean`

### Sub-sistem: `counts:get:invalidatetables` (Klaster #77)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`get`](file://services/api/scripts/files-privacy-probe.ts#L36-L36) (`services/api/scripts/files-privacy-probe.ts:36-36`) [Tipe: `function`]
    - *Signature:* `(role: string | null, url: string)`
  - [`useUrlParam`](file://apps/web/src/utils/urlParam.ts#L27-L49) (`apps/web/src/utils/urlParam.ts:27-49`) [Tipe: `function`]
    - *Signature:* `(key: string, codec: UrlParamCodec<T>): [T, (next: T) => void]`
  - [`cacheGet`](file://services/api/src/listCache.ts#L51-L60) (`services/api/src/listCache.ts:51-60`) [Tipe: `function`]
    - *Signature:* `(key: string): Entry | null`
  - [`mergeProjectRowsAfterPull`](file://apps/web/src/data/projectPullScope.ts#L27-L45) (`apps/web/src/data/projectPullScope.ts:27-45`) [Tipe: `function`]
    - *Signature:* `(
  serverRows: T[],
  localRows: T[] | undefined,
  changes: ReadonlyMap<string, ProjectExistenceChange<T>>,
  mutationEpochAtStart: number,
): T[]`
  - [`deadSummaryByReason`](file://apps/web/src/utils/deadStock.ts#L249-L260) (`apps/web/src/utils/deadStock.ts:249-260`) [Tipe: `function`]
    - *Signature:* `(rows: DeadStockRow[]): { reason: DeadReason; count: number; value: number }[]`

### Sub-sistem: `teruji:viewer:fixture` (Klaster #83)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fulfill`](file://services/api/scripts/material-flow-probe.ts#L95-L95) (`services/api/scripts/material-flow-probe.ts:95-95`) [Tipe: `function`]
    - *Signature:* `(token: string, id: string)`
    - *Deskripsi:* // Viewer wajib ada di seed (dicek sebelum fixture dibuat): tanpa itu aturan 403 tidak teruji.
  - [`stockOf`](file://services/api/scripts/material-flow-probe.ts#L35-L38) (`services/api/scripts/material-flow-probe.ts:35-38`) [Tipe: `function`]
    - *Signature:* `(): Promise<number>`
    - *Deskripsi:* // Viewer wajib ada di seed (dicek sebelum fixture dibuat): tanpa itu aturan 403 tidak teruji.
  - [`tokenFor`](file://services/api/scripts/material-flow-probe.ts#L17-L22) (`services/api/scripts/material-flow-probe.ts:17-22`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<string | null>`
  - [`assert`](file://services/api/scripts/material-flow-probe.ts#L13-L16) (`services/api/scripts/material-flow-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`decide`](file://services/api/scripts/material-flow-probe.ts#L45-L47) (`services/api/scripts/material-flow-probe.ts:45-47`) [Tipe: `function`]
    - *Signature:* `(token: string, id: string, payload: unknown)`
    - *Deskripsi:* // Viewer wajib ada di seed (dicek sebelum fixture dibuat): tanpa itu aturan 403 tidak teruji.

### Sub-sistem: `post:auth:stock` (Klaster #105)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`post`](file://services/api/scripts/po-partial-probe.ts#L64-L64) (`services/api/scripts/po-partial-probe.ts:64-64`) [Tipe: `function`]
    - *Signature:* `(t: string, url: string, payload: Record<string, unknown>)`
  - [`mrOf`](file://services/api/scripts/po-partial-probe.ts#L65-L65) (`services/api/scripts/po-partial-probe.ts:65-65`) [Tipe: `function`]
    - *Signature:* `()`
  - [`apOf`](file://services/api/scripts/po-partial-probe.ts#L126-L127) (`services/api/scripts/po-partial-probe.ts:126-127`) [Tipe: `function`]
    - *Signature:* `(poId: string)`
    - *Deskripsi:* // hutang belum dibayar berkurang bila vendor tidak sanggup sebagian.
  - [`auth`](file://services/api/scripts/po-partial-probe.ts#L63-L63) (`services/api/scripts/po-partial-probe.ts:63-63`) [Tipe: `function`]
    - *Signature:* `(t: string)`
  - [`poOf`](file://services/api/scripts/po-partial-probe.ts#L66-L66) (`services/api/scripts/po-partial-probe.ts:66-66`) [Tipe: `function`]
    - *Signature:* `(id: string)`

### Sub-sistem: `doc:boq:surat` (Klaster #140)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parse`](file://services/api/src/boqDocs.ts#L38-L41) (`services/api/src/boqDocs.ts:38-41`) [Tipe: `function`]
    - *Signature:* `(row: Row | undefined): Data | null`
  - [`loadDoc`](file://services/api/src/boqDocs.ts#L48-L52) (`services/api/src/boqDocs.ts:48-52`) [Tipe: `function`]
    - *Signature:* `(id: string): Promise<{ row: Row; data: Data } | null>`
  - [`docTotal`](file://services/api/src/boqDocs.ts#L59-L71) (`services/api/src/boqDocs.ts:59-71`) [Tipe: `function`]
    - *Signature:* `(docId: string): Promise<number>`
  - [`syncBoqDocToDocuments`](file://services/api/src/boqDocs.ts#L135-L206) (`services/api/src/boqDocs.ts:135-206`) [Tipe: `function`]
    - *Signature:* `(id: string, boqData: Data, branch: string, actor?: string): Promise<void>`
  - [`statusOf`](file://services/api/src/boqDocs.ts#L43-L46) (`services/api/src/boqDocs.ts:43-46`) [Tipe: `function`]
    - *Signature:* `(d: Data | null): BoqDocStatus`

### Sub-sistem: `409:project:klien` (Klaster #699)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`getDialect`](file://services/api/src/db.ts#L24-L27) (`services/api/src/db.ts:24-27`) [Tipe: `function`]
    - *Signature:* `(): Dialect`
  - [`q`](file://services/api/src/db.ts#L205-L208) (`services/api/src/db.ts:205-208`) [Tipe: `method`]
    - *Signature:* `(sql: string, params: unknown[] = []): Promise<T[]>`
  - [`q`](file://services/api/src/db.ts#L62-L75) (`services/api/src/db.ts:62-75`) [Tipe: `function`]
    - *Signature:* `(sql: string, params: unknown[] = []): Promise<T[]>`
  - [`pick`](file://services/api/src/routes/wbs.ts#L162-L179) (`services/api/src/routes/wbs.ts:162-179`) [Tipe: `function`]
    - *Signature:* `(tbl: string): Promise<Record<string, unknown>>`
  - [`exactBranchPredicate`](file://services/api/src/routes/crudSearch.ts#L18-L20) (`services/api/src/routes/crudSearch.ts:18-20`) [Tipe: `function`]
    - *Signature:* `(dialect: Dialect): string`

### Sub-sistem: `json:demo:writejson` (Klaster #274)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`hideButton`](file://apps/web/src/components/DemoGuide.tsx#L116-L120) (`apps/web/src/components/DemoGuide.tsx:116-120`) [Tipe: `function`]
    - *Signature:* `()`
  - [`doneOf`](file://apps/web/src/components/DemoGuide.tsx#L105-L105) (`apps/web/src/components/DemoGuide.tsx:105-105`) [Tipe: `function`]
    - *Signature:* `(id: string)`
  - [`writeJson`](file://apps/web/src/components/DemoGuide.tsx#L34-L36) (`apps/web/src/components/DemoGuide.tsx:34-36`) [Tipe: `function`]
    - *Signature:* `(key: string, value: unknown): void`
  - [`isTyping`](file://apps/web/src/components/DemoGuide.tsx#L39-L44) (`apps/web/src/components/DemoGuide.tsx:39-44`) [Tipe: `function`]
    - *Signature:* `(target: EventTarget | null): boolean`
    - *Deskripsi:* /** Pintasan tidak boleh mencuri huruf saat pengguna mengetik di form. */
  - [`readJson`](file://apps/web/src/components/DemoGuide.tsx#L25-L32) (`apps/web/src/components/DemoGuide.tsx:25-32`) [Tipe: `function`]
    - *Signature:* `(key: string, fallback: T): T`

### Sub-sistem: `spinner:detik:palsu` (Klaster #792)
- **Kepadatan Simbol:** 9 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rowsFor`](file://apps/web/src/pages/pengaturan/Settings.tsx#L82-L82) (`apps/web/src/pages/pengaturan/Settings.tsx:82-82`) [Tipe: `function`]
    - *Signature:* `(t: string)`
    - *Deskripsi:* // agar toast "disimpan" tidak berbohong.
  - [`saveToggle`](file://apps/web/src/pages/pengaturan/Settings.tsx#L112-L124) (`apps/web/src/pages/pengaturan/Settings.tsx:112-124`) [Tipe: `function`]
    - *Signature:* `(id: string, key: string, on: boolean)`
    - *Deskripsi:* // spinner + detik berjalan (BUKAN persen palsu).
  - [`save`](file://apps/web/src/pages/pengaturan/Settings.tsx#L135-L184) (`apps/web/src/pages/pengaturan/Settings.tsx:135-184`) [Tipe: `function`]
    - *Signature:* `(id: string, key: string)`
    - *Deskripsi:* // spinner + detik berjalan (BUKAN persen palsu).
  - [`tabFor`](file://apps/web/src/pages/pengaturan/Settings.tsx#L74-L80) (`apps/web/src/pages/pengaturan/Settings.tsx:74-80`) [Tipe: `function`]
    - *Signature:* `(key: string): string`
    - *Deskripsi:* // agar toast "disimpan" tidak berbohong.
  - [`isTextValue`](file://apps/web/src/pages/pengaturan/Settings.tsx#L130-L133) (`apps/web/src/pages/pengaturan/Settings.tsx:130-133`) [Tipe: `function`]
    - *Signature:* `(v: unknown): boolean`
    - *Deskripsi:* // spinner + detik berjalan (BUKAN persen palsu).

### Sub-sistem: `riil:rekening:email` (Klaster #79)
- **Kepadatan Simbol:** 8 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`randInt`](file://services/api/scripts/gen-seed-data.ts#L26-L28) (`services/api/scripts/gen-seed-data.ts:26-28`) [Tipe: `function`]
    - *Signature:* `(min: number, max: number): number`
    - *Deskripsi:* // tanpa memuat data riil (nama orang riil, rekening riil, email riil).
  - [`randChoice`](file://services/api/scripts/gen-seed-data.ts#L30-L32) (`services/api/scripts/gen-seed-data.ts:30-32`) [Tipe: `function`]
    - *Signature:* `(arr: T[]): T`
    - *Deskripsi:* // tanpa memuat data riil (nama orang riil, rekening riil, email riil).
  - [`genFinance`](file://services/api/scripts/gen-seed-data.ts#L318-L398) (`services/api/scripts/gen-seed-data.ts:318-398`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // tanpa memuat data riil (nama orang riil, rekening riil, email riil).
  - [`genHutang`](file://services/api/scripts/gen-seed-data.ts#L201-L227) (`services/api/scripts/gen-seed-data.ts:201-227`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // tanpa memuat data riil (nama orang riil, rekening riil, email riil).
  - [`genSubkon`](file://services/api/scripts/gen-seed-data.ts#L158-L199) (`services/api/scripts/gen-seed-data.ts:158-199`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // tanpa memuat data riil (nama orang riil, rekening riil, email riil).

### Sub-sistem: `nodes:count:has` (Klaster #141)
- **Kepadatan Simbol:** 8 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`has`](file://services/api/src/boqDocs.ts#L305-L305) (`services/api/src/boqDocs.ts:305-305`) [Tipe: `function`]
    - *Signature:* `(v: unknown): boolean`
  - [`canApproveService`](file://apps/web/src/data/useServiceApproval.ts#L17-L19) (`apps/web/src/data/useServiceApproval.ts:17-19`) [Tipe: `function`]
    - *Signature:* `(role: string | undefined): boolean`
  - [`withBoqLineTotal`](file://services/api/src/boqDocs.ts#L304-L309) (`services/api/src/boqDocs.ts:304-309`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>, sent: Record<string, unknown> = data): Record<string, unknown>`
  - [`shouldRetainSideProjectData`](file://apps/web/src/data/sideMapEpochs.ts#L4-L19) (`apps/web/src/data/sideMapEpochs.ts:4-19`) [Tipe: `function`]
    - *Signature:* `(
  kind: SideMapKind,
  projectId: string,
  liveProjects: Set<string>,
  dirty: Set<string>,
  conflictHolds: Set<string>,
  activeWriteKeys: ReadonlySet<string> = new Set<string>(),
): boolean`
  - [`requireRole`](file://services/api/src/auth.ts#L233-L251) (`services/api/src/auth.ts:233-251`) [Tipe: `function`]
    - *Signature:* `(...roles: string[])`

### Sub-sistem: `klik:cto:okt` (Klaster #429)
- **Kepadatan Simbol:** 8 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fail`](file://apps/web/src/pages/Login.tsx#L54-L57) (`apps/web/src/pages/Login.tsx:54-57`) [Tipe: `function`]
    - *Signature:* `(message: string)`
    - *Deskripsi:* // Satu klik pada tombol peran = langsung masuk (catatan CTO 14 Okt).
  - [`enterAsRole`](file://apps/web/src/pages/Login.tsx#L42-L52) (`apps/web/src/pages/Login.tsx:42-52`) [Tipe: `function`]
    - *Signature:* `(role: string)`
    - *Deskripsi:* // Satu klik pada tombol peran = langsung masuk (catatan CTO 14 Okt).
  - [`registerFail`](file://apps/web/src/pages/Login.tsx#L59-L68) (`apps/web/src/pages/Login.tsx:59-68`) [Tipe: `function`]
    - *Signature:* `(message: string)`
    - *Deskripsi:* // Satu klik pada tombol peran = langsung masuk (catatan CTO 14 Okt).
  - [`quickLogin`](file://apps/web/src/pages/Login.tsx#L99-L118) (`apps/web/src/pages/Login.tsx:99-118`) [Tipe: `function`]
    - *Signature:* `(u: string)`
    - *Deskripsi:* // Satu klik pada tombol peran = langsung masuk (catatan CTO 14 Okt).
  - [`takeSessionExpired`](file://apps/web/src/auth/sessionExpired.ts#L9-L17) (`apps/web/src/auth/sessionExpired.ts:9-17`) [Tipe: `function`]
    - *Signature:* `(): boolean`

### Sub-sistem: `file:download:url` (Klaster #434)
- **Kepadatan Simbol:** 8 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toast`](file://apps/web/src/components/Toast.tsx#L39-L76) (`apps/web/src/components/Toast.tsx:39-76`) [Tipe: `function`]
    - *Signature:* `(
  message: string,
  toneOrOptions?: ToastTone | ToastOptions,
  extraOptions?: ToastOptions,
): number | string`
  - [`toAbsoluteUrl`](file://apps/web/src/services/files.ts#L37-L48) (`apps/web/src/services/files.ts:37-48`) [Tipe: `function`]
    - *Signature:* `(url: unknown, base: string = BASE): string`
  - [`fetchFileBlob`](file://apps/web/src/services/files.ts#L97-L119) (`apps/web/src/services/files.ts:97-119`) [Tipe: `function`]
    - *Signature:* `(url: string): Promise<Blob>`
  - [`downloadFileUrl`](file://apps/web/src/services/files.ts#L190-L214) (`apps/web/src/services/files.ts:190-214`) [Tipe: `function`]
    - *Signature:* `(url: string, filename?: string): Promise<void>`
  - [`clickDownload`](file://apps/web/src/services/files.ts#L121-L129) (`apps/web/src/services/files.ts:121-129`) [Tipe: `function`]
    - *Signature:* `(href: string, name: string): void`
    - *Deskripsi:* /** Ambil berkas sebagai Blob; kirim JWT bila ada (file backend terproteksi). */

### Sub-sistem: `pager:muka:strip` (Klaster #413)
- **Kepadatan Simbol:** 8 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`useT`](file://apps/web/src/i18n/LanguageContext.tsx#L48-L50) (`apps/web/src/i18n/LanguageContext.tsx:48-50`) [Tipe: `function`]
    - *Signature:* `(): LangCtx`
  - [`statusLabel`](file://apps/web/src/i18n/status.ts#L30-L34) (`apps/web/src/i18n/status.ts:30-34`) [Tipe: `function`]
    - *Signature:* `(value: unknown, locale: string): string`
  - [`InvStageStrip`](file://apps/web/src/pages/keuangan/Finance.tsx#L255-L288) (`apps/web/src/pages/keuangan/Finance.tsx:255-288`) [Tipe: `function`]
    - *Signature:* `({ counts, active, onPick }: {
  counts: Record<string, number>;
  active: string;
  onPick: (s: string) => void;
})`
    - *Deskripsi:* /** DP = uang muka: tanpa retensi, dan menandai proyek punya uang muka. */
  - [`SearchBox`](file://apps/web/src/components/ui.tsx#L1019-L1064) (`apps/web/src/components/ui.tsx:1019-1064`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  id?: string;
})`
  - [`StageStrip`](file://apps/web/src/pages/payroll/Payroll.tsx#L54-L93) (`apps/web/src/pages/payroll/Payroll.tsx:54-93`) [Tipe: `function`]
    - *Signature:* `({ counts, active, onPick, prefix }: {
  counts: Record<string, number>;
  active: string;
  onPick: (s: string) => void;
  prefix: string;
})`

### Sub-sistem: `audit:anda:akun` (Klaster #714)
- **Kepadatan Simbol:** 8 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toggleSort`](file://apps/web/src/components/ui.tsx#L1286-L1289) (`apps/web/src/components/ui.tsx:1286-1289`) [Tipe: `function`]
    - *Signature:* `(prev: SortState, key: string): SortState`
  - [`auditParams`](file://apps/web/src/pages/audit/Audit.tsx#L105-L113) (`apps/web/src/pages/audit/Audit.tsx:105-113`) [Tipe: `function`]
    - *Signature:* `(page: number, size: number): string`
  - [`mapAuditRow`](file://apps/web/src/pages/audit/Audit.tsx#L91-L103) (`apps/web/src/pages/audit/Audit.tsx:91-103`) [Tipe: `function`]
    - *Signature:* `(r: ServerAuditRow): StoreItemLike`
  - [`actorOf`](file://apps/web/src/pages/audit/Audit.tsx#L28-L32) (`apps/web/src/pages/audit/Audit.tsx:28-32`) [Tipe: `function`]
    - *Signature:* `(a: Record<string, unknown>): string`
    - *Deskripsi:* /** Jejak lama di perangkat tercatat sebagai "Anda". Store aktivitas dipisah per
 *  akun (sessionScopeKey), jadi "Anda" di sini selalu akun yang sedang login. */
  - [`toISODateOrNull`](file://apps/web/src/pages/audit/Audit.tsx#L16-L24) (`apps/web/src/pages/audit/Audit.tsx:16-24`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string | null`
    - *Deskripsi:* /** Ambil YYYY-MM-DD dari string waktu bila bisa diparse; abaikan "baru saja" dan teks relatif. */

### Sub-sistem: `disconnect:heal:watermark` (Klaster #421)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseDevice`](file://apps/web/src/security/watermark.tsx#L11-L25) (`apps/web/src/security/watermark.tsx:11-25`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`fmtWita`](file://apps/web/src/security/watermark.tsx#L29-L40) (`apps/web/src/security/watermark.tsx:29-40`) [Tipe: `function`]
    - *Signature:* `(d: Date): string`
  - [`guardBroken`](file://apps/web/src/security/watermark.tsx#L126-L133) (`apps/web/src/security/watermark.tsx:126-133`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`fetchGeo`](file://apps/web/src/security/watermark.tsx#L53-L57) (`apps/web/src/security/watermark.tsx:53-57`) [Tipe: `function`]
    - *Signature:* `(signal: AbortSignal): Promise<Geo>`
  - [`disconnect`](file://apps/web/scripts/browser-shims.ts#L59-L59) (`apps/web/scripts/browser-shims.ts:59-59`) [Tipe: `method`]
    - *Signature:* `()`

### Sub-sistem: `equal:main:probe` (Klaster #109)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ok`](file://services/api/src/envelope.ts#L4-L6) (`services/api/src/envelope.ts:4-6`) [Tipe: `function`]
    - *Signature:* `(data: T): { ok: true; data: T }`
  - [`equal`](file://apps/web/scripts/drydock-dates-probe.ts#L24-L28) (`apps/web/scripts/drydock-dates-probe.ts:24-28`) [Tipe: `function`]
    - *Signature:* `(actual: unknown, expected: unknown, label: string): void`
  - [`runProbe`](file://services/api/scripts/security-probe-isolation-probe.ts#L41-L62) (`services/api/scripts/security-probe-isolation-probe.ts:41-62`) [Tipe: `function`]
    - *Signature:* `(args: string[], callerDb: string, callerUploads: string, tempRoot: string): ReturnType<typeof spawnSync>`
  - [`probeTempArtifacts`](file://services/api/scripts/security-probe-isolation-probe.ts#L33-L35) (`services/api/scripts/security-probe-isolation-probe.ts:33-35`) [Tipe: `function`]
    - *Signature:* `(root: string): string[]`
  - [`stripAnsi`](file://services/api/scripts/security-probe-isolation-probe.ts#L37-L39) (`services/api/scripts/security-probe-isolation-probe.ts:37-39`) [Tipe: `function`]
    - *Signature:* `(output: string): string`

### Sub-sistem: `env:set:sudo` (Klaster #219)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`load`](file://services/api/src/seedBulk.ts#L18-L20) (`services/api/src/seedBulk.ts:18-20`) [Tipe: `function`]
    - *Signature:* `(name: string): T`
    - *Deskripsi:* // Butuh .env produksi: set -a; source <(sudo cat .env); set +a
  - [`put`](file://services/api/src/seedBulk.ts#L29-L59) (`services/api/src/seedBulk.ts:29-59`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string, branch: string, data: Record<string, unknown>, now: string, ctr: { ins: number; skip: number; done: number; total: number }): Promise<void>`
    - *Deskripsi:* // Butuh .env produksi: set -a; source <(sudo cat .env); set +a
  - [`medianOf`](file://services/api/src/seedBulk.ts#L133-L137) (`services/api/src/seedBulk.ts:133-137`) [Tipe: `function`]
    - *Signature:* `(values: number[]): number`
    - *Deskripsi:* // nama yang sama; sisa terakhir memakai default per kategori kata kunci.
  - [`defaultPriceFor`](file://services/api/src/seedBulk.ts#L153-L158) (`services/api/src/seedBulk.ts:153-158`) [Tipe: `function`]
    - *Signature:* `(name: string, category: string): number`
    - *Deskripsi:* // data/index.ts yang sudah punya harga riil (Rp/kg baja, Rp/L cat, dll).
  - [`payDate`](file://services/api/src/seedBulk.ts#L22-L27) (`services/api/src/seedBulk.ts:22-27`) [Tipe: `function`]
    - *Signature:* `(note: string): string`
    - *Deskripsi:* // Butuh .env produksi: set -a; source <(sudo cat .env); set +a

### Sub-sistem: `withtx:atomisitas:rollback` (Klaster #151)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`exec`](file://services/api/src/db.ts#L209-L212) (`services/api/src/db.ts:209-212`) [Tipe: `method`]
    - *Signature:* `(sql: string, params: unknown[] = []): Promise<ExecResult>`
  - [`run`](file://services/api/scripts/backup-restore-probe.ts#L18-L21) (`services/api/scripts/backup-restore-probe.ts:18-21`) [Tipe: `function`]
    - *Signature:* `(script: string, args: string[], env: Record<string, string>): void`
  - [`withTx`](file://services/api/src/db.ts#L139-L234) (`services/api/src/db.ts:139-234`) [Tipe: `function`]
    - *Signature:* `(fn: TxFn<R>): Promise<R>`
  - [`acquireSqliteLock`](file://services/api/src/db.ts#L120-L129) (`services/api/src/db.ts:120-129`) [Tipe: `function`]
    - *Signature:* `(): Promise<() => void>`
  - [`assert`](file://services/api/scripts/tx-probe.ts#L12-L20) (`services/api/scripts/tx-probe.ts:12-20`) [Tipe: `function`]
    - *Signature:* `(condition: boolean, msg: string): void`
    - *Deskripsi:* /**
 * tx-probe.ts — Verifikasi atomisitas helper withTx(fn) (F4-02 / Audit S-06).
 * Menguji commit sukses, rollback saat error, nested savepoints,
 * konkurensi paralel, dan penjalaran konteks AsyncLocalStorage.
 */

### Sub-sistem: `tanggal:fin:sampai` (Klaster #752)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`test`](file://services/api/scripts/env-probe.ts#L23-L33) (`services/api/scripts/env-probe.ts:23-33`) [Tipe: `function`]
    - *Signature:* `(name: string, fn: () => void)`
    - *Deskripsi:* // Simpan process.env asli
  - [`hariValid`](file://apps/web/src/pages/keuangan/Finance.tsx#L126-L133) (`apps/web/src/pages/keuangan/Finance.tsx:126-133`) [Tipe: `function`]
    - *Signature:* `(v: string): boolean`
    - *Deskripsi:* /** Rentang tanggal (FIN: filter dari-sampai) sah bila kedua tanggal nyata dan berurutan. */
  - [`bulanValid`](file://apps/web/src/pages/keuangan/Finance.tsx#L121-L125) (`apps/web/src/pages/keuangan/Finance.tsx:121-125`) [Tipe: `function`]
    - *Signature:* `(v: string): boolean`
    - *Deskripsi:* /** Rentang tanggal (FIN: filter dari-sampai) sah bila kedua tanggal nyata dan berurutan. */
  - [`sheetNumber`](file://apps/web/src/utils/readSheet.ts#L127-L133) (`apps/web/src/utils/readSheet.ts:127-133`) [Tipe: `function`]
    - *Signature:* `(cell: string): number`
  - [`isSideMapConflictKey`](file://apps/web/src/data/sideMapConflictHolds.ts#L9-L12) (`apps/web/src/data/sideMapConflictHolds.ts:9-12`) [Tipe: `function`]
    - *Signature:* `(value: unknown): value is string`

### Sub-sistem: `seed:usernames:allow` (Klaster #119)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`buildApp`](file://services/api/src/app.ts#L103-L417) (`services/api/src/app.ts:103-417`) [Tipe: `function`]
    - *Signature:* `(): FastifyInstance`
  - [`resolveCorsOrigin`](file://services/api/src/app.ts#L140-L144) (`services/api/src/app.ts:140-144`) [Tipe: `function`]
    - *Signature:* `(req: { headers: { origin?: unknown } }): string | undefined`
    - *Deskripsi:* // Origin request dicocokkan terhadap allowlist; kredensial tidak dipakai (JWT header).
  - [`denyRateLimited`](file://services/api/src/app.ts#L81-L84) (`services/api/src/app.ts:81-84`) [Tipe: `function`]
    - *Signature:* `(reply: FastifyReply, retryAfterSec: number, message: string): unknown`
    - *Deskripsi:* // (ALLOW_SEED_LOGIN=true). Minimal guard: match the 4 seed usernames.
  - [`isSeedLoginDisabled`](file://services/api/src/app.ts#L70-L73) (`services/api/src/app.ts:70-73`) [Tipe: `function`]
    - *Signature:* `(): boolean`
    - *Deskripsi:* // (ALLOW_SEED_LOGIN=true). Minimal guard: match the 4 seed usernames.
  - [`getApiVersion`](file://services/api/src/app.ts#L90-L99) (`services/api/src/app.ts:90-99`) [Tipe: `function`]
    - *Signature:* `(): string`
    - *Deskripsi:* // (blocks sync on major mismatch only).

### Sub-sistem: `jalur:lain:user` (Klaster #133)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`invalidateUserCache`](file://services/api/src/auth.ts#L128-L134) (`services/api/src/auth.ts:128-134`) [Tipe: `function`]
    - *Signature:* `(userId?: string): void`
  - [`comparePassword`](file://services/api/src/auth.ts#L37-L39) (`services/api/src/auth.ts:37-39`) [Tipe: `function`]
    - *Signature:* `(plain: string, hash: string): Promise<boolean>`
  - [`bumpTokenVersion`](file://services/api/src/auth.ts#L136-L142) (`services/api/src/auth.ts:136-142`) [Tipe: `function`]
    - *Signature:* `(
  userId: string,
  options: { deferCacheInvalidation?: boolean } = {},
): Promise<void>`
  - [`persistUserChange`](file://services/api/src/routes/users.ts#L95-L100) (`services/api/src/routes/users.ts:95-100`) [Tipe: `function`]
    - *Signature:* `(mutate: () => Promise<unknown>, audit: AuditInput): Promise<void>`
    - *Deskripsi:* // di jalur lain).
  - [`assertEmployeeExists`](file://services/api/src/routes/users.ts#L53-L57) (`services/api/src/routes/users.ts:53-57`) [Tipe: `function`]
    - *Signature:* `(employeeId: string): Promise<boolean>`
    - *Deskripsi:* // di jalur lain).

### Sub-sistem: `order:diterapkan:change` (Klaster #145)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parse`](file://services/api/src/changeOrders.ts#L26-L26) (`services/api/src/changeOrders.ts:26-26`) [Tipe: `function`]
    - *Signature:* `(r: Row): Data`
  - [`num`](file://services/api/src/changeOrders.ts#L27-L27) (`services/api/src/changeOrders.ts:27-27`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`loadCo`](file://services/api/src/changeOrders.ts#L63-L67) (`services/api/src/changeOrders.ts:63-67`) [Tipe: `function`]
    - *Signature:* `(id: string): Promise<{ row: Row; data: Data }>`
    - *Deskripsi:* /** DELETE: CO yang sudah disetujui/diterapkan adalah bukti keputusan — tidak boleh dihapus. */
  - [`saveCo`](file://services/api/src/changeOrders.ts#L69-L74) (`services/api/src/changeOrders.ts:69-74`) [Tipe: `function`]
    - *Signature:* `(row: Row, data: Data, now: string): Promise<void>`
    - *Deskripsi:* /** DELETE: CO yang sudah disetujui/diterapkan adalah bukti keputusan — tidak boleh dihapus. */
  - [`decideChangeOrder`](file://services/api/src/changeOrders.ts#L77-L88) (`services/api/src/changeOrders.ts:77-88`) [Tipe: `function`]
    - *Signature:* `(id: string, decision: "Disetujui" | "Ditolak", role: unknown, actor: string, note: string): Promise<Data>`

### Sub-sistem: `level:banner:alert` (Klaster #517)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sortByLevel`](file://apps/web/src/utils/moduleAlerts.ts#L516-L526) (`apps/web/src/utils/moduleAlerts.ts:516-526`) [Tipe: `function`]
    - *Signature:* `(items: ModuleAlertItem[]): ModuleAlertItem[]`
  - [`isAlertLevel`](file://apps/web/src/utils/moduleAlerts.ts#L484-L486) (`apps/web/src/utils/moduleAlerts.ts:484-486`) [Tipe: `function`]
    - *Signature:* `(v: unknown): v is AlertLevel`
    - *Deskripsi:* /** Umur kondisi: dari field yang paling dekat ke "kapan ini muncul". */
  - [`countByLevel`](file://apps/web/src/utils/moduleAlerts.ts#L549-L553) (`apps/web/src/utils/moduleAlerts.ts:549-553`) [Tipe: `function`]
    - *Signature:* `(items: readonly ModuleAlertItem[]): Record<AlertLevel, number>`
  - [`groupByLevel`](file://apps/web/src/utils/moduleAlerts.ts#L567-L580) (`apps/web/src/utils/moduleAlerts.ts:567-580`) [Tipe: `function`]
    - *Signature:* `(
  items: readonly ModuleAlertItem[],
  cap = 5,
): Array<{ level: AlertLevel; items: ModuleAlertItem[]; total: number; hidden: number }>`
  - [`bannerDisplay`](file://apps/web/src/utils/moduleAlerts.ts#L536-L546) (`apps/web/src/utils/moduleAlerts.ts:536-546`) [Tipe: `function`]
    - *Signature:* `(
  items: ModuleAlertItem[],
  expanded: boolean,
): { items: ModuleAlertItem[]; remaining: number }`

### Sub-sistem: `file:preview:ondownload` (Klaster #432)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stripQuery`](file://apps/web/src/services/files.ts#L16-L18) (`apps/web/src/services/files.ts:16-18`) [Tipe: `function`]
    - *Signature:* `(url: string): string`
    - *Deskripsi:* /** Timeout unduh/pratinjau berkas (file lampiran bisa besar). */
  - [`fileNameOf`](file://apps/web/src/services/files.ts#L68-L78) (`apps/web/src/services/files.ts:68-78`) [Tipe: `function`]
    - *Signature:* `(url: string, fallback = "dokumen"): string`
  - [`fileKindOf`](file://apps/web/src/services/files.ts#L57-L64) (`apps/web/src/services/files.ts:57-64`) [Tipe: `function`]
    - *Signature:* `(url: string): FileKind`
  - [`fileExtOf`](file://apps/web/src/services/files.ts#L51-L54) (`apps/web/src/services/files.ts:51-54`) [Tipe: `function`]
    - *Signature:* `(url: string): string`
  - [`onDownload`](file://apps/web/src/components/DocumentPreview.tsx#L153-L166) (`apps/web/src/components/DocumentPreview.tsx:153-166`) [Tipe: `function`]
    - *Signature:* `(): void`

### Sub-sistem: `avatar:slice:smd` (Klaster #332)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`slice`](file://apps/web/src/components/ui.tsx#L1561-L1561) (`apps/web/src/components/ui.tsx:1561-1561`) [Tipe: `function`]
    - *Signature:* `(rows: T[]): T[]`
  - [`reset`](file://apps/web/src/components/ui.tsx#L1562-L1562) (`apps/web/src/components/ui.tsx:1562-1562`) [Tipe: `function`]
    - *Signature:* `()`
  - [`go`](file://apps/web/src/components/ui.tsx#L1563-L1563) (`apps/web/src/components/ui.tsx:1563-1563`) [Tipe: `function`]
    - *Signature:* `(p: number)`
  - [`usePager`](file://apps/web/src/components/ui.tsx#L1548-L1566) (`apps/web/src/components/ui.tsx:1548-1566`) [Tipe: `function`]
    - *Signature:* `(total: number, defaultSize = 25): {
  page: number;
  size: number;
  pages: number;
  slice: <T>(rows: T[]) => T[];
  reset: () => void;
  go: (p: number) => void;
  bar: ReactNode;
}`
  - [`Avatar`](file://apps/web/src/components/ui.tsx#L537-L557) (`apps/web/src/components/ui.tsx:537-557`) [Tipe: `function`]
    - *Signature:* `({
  name,
  className = "",
}: {
  name: string;
  className?: string;
})`

### Sub-sistem: `invalidate:sync:generation` (Klaster #347)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`invalidate`](file://apps/web/src/data/collectionSyncCache.ts#L81-L86) (`apps/web/src/data/collectionSyncCache.ts:81-86`) [Tipe: `method`]
    - *Signature:* `(collections: readonly string[]): void`
  - [`sync`](file://apps/web/src/data/collectionSyncCache.ts#L17-L79) (`apps/web/src/data/collectionSyncCache.ts:17-79`) [Tipe: `method`]
    - *Signature:* `(
    scope: string,
    collections: readonly string[],
    load: CollectionBatchLoader,
    force = false,
  ): Promise<string[]>`
  - [`useScope`](file://apps/web/src/data/collectionSyncCache.ts#L98-L106) (`apps/web/src/data/collectionSyncCache.ts:98-106`) [Tipe: `method`]
    - *Signature:* `(scope: string): void`
  - [`generation`](file://apps/web/src/data/collectionSyncCache.ts#L88-L90) (`apps/web/src/data/collectionSyncCache.ts:88-90`) [Tipe: `method`]
    - *Signature:* `(collection: string): number`
  - [`invalidateAll`](file://apps/web/src/data/collectionSyncCache.ts#L92-L96) (`apps/web/src/data/collectionSyncCache.ts:92-96`) [Tipe: `method`]
    - *Signature:* `(): void`

### Sub-sistem: `submit:handle:report` (Klaster #810)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pdfServerReady`](file://apps/web/src/services/pdfClient.ts#L57-L59) (`apps/web/src/services/pdfClient.ts:57-59`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`docApprovalLabel`](file://apps/web/src/pages/proyek/ReportSection.tsx#L66-L70) (`apps/web/src/pages/proyek/ReportSection.tsx:66-70`) [Tipe: `function`]
    - *Signature:* `(status: string): string`
  - [`submitReport`](file://apps/web/src/pages/proyek/ReportSection.tsx#L72-L88) (`apps/web/src/pages/proyek/ReportSection.tsx:72-88`) [Tipe: `function`]
    - *Signature:* `(docId: string, action: "submit" | "approve" | "reject")`
  - [`handleExportExcel`](file://apps/web/src/pages/proyek/ReportSection.tsx#L108-L130) (`apps/web/src/pages/proyek/ReportSection.tsx:108-130`) [Tipe: `function`]
    - *Signature:* `()`
  - [`handleExportPDF`](file://apps/web/src/pages/proyek/ReportSection.tsx#L95-L106) (`apps/web/src/pages/proyek/ReportSection.tsx:95-106`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `tagih:fee:del` (Klaster #916)
- **Kepadatan Simbol:** 7 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`add`](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L39-L46) (`apps/web/src/pages/proyek/FeeProjectCard.tsx:39-46`) [Tipe: `function`]
    - *Signature:* `()`
  - [`run`](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L35-L38) (`apps/web/src/pages/proyek/FeeProjectCard.tsx:35-38`) [Tipe: `function`]
    - *Signature:* `(fn: () => Promise<void>): Promise<void>`
  - [`tagih`](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L48-L53) (`apps/web/src/pages/proyek/FeeProjectCard.tsx:48-53`) [Tipe: `function`]
    - *Signature:* `(fee: ProjectFee)`
  - [`del`](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L47-L47) (`apps/web/src/pages/proyek/FeeProjectCard.tsx:47-47`) [Tipe: `function`]
    - *Signature:* `(id: string)`
  - [`feeAmount`](file://apps/web/src/utils/projectFee.ts#L32-L34) (`apps/web/src/utils/projectFee.ts:32-34`) [Tipe: `function`]
    - *Signature:* `(f: Pick<ProjectFee, "basis" | "nilai">, projectValue: number): number`

### Sub-sistem: `ins:post:main` (Klaster #66)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`post`](file://services/api/scripts/change-order-probe.ts#L29-L29) (`services/api/scripts/change-order-probe.ts:29-29`) [Tipe: `function`]
    - *Signature:* `(t: string, url: string, payload: Record<string, unknown> = {})`
  - [`tokenOf`](file://services/api/scripts/change-order-probe.ts#L16-L20) (`services/api/scripts/change-order-probe.ts:16-20`) [Tipe: `function`]
    - *Signature:* `(username: string): Promise<string>`
  - [`h`](file://services/api/scripts/change-order-probe.ts#L28-L28) (`services/api/scripts/change-order-probe.ts:28-28`) [Tipe: `function`]
    - *Signature:* `(t: string)`
  - [`ins`](file://services/api/scripts/change-order-probe.ts#L27-L27) (`services/api/scripts/change-order-probe.ts:27-27`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string, data: Record<string, unknown>)`
  - [`assert`](file://services/api/scripts/change-order-probe.ts#L12-L15) (`services/api/scripts/change-order-probe.ts:12-15`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`

### Sub-sistem: `boq:parsedata:tautkan` (Klaster #90)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`migrateBoqDocs`](file://services/api/scripts/migrate-boq-docs.ts#L158-L207) (`services/api/scripts/migrate-boq-docs.ts:158-207`) [Tipe: `function`]
    - *Signature:* `(apply = false): Promise<BoqMigrationSummary>`
  - [`parseData`](file://services/api/scripts/migrate-boq-docs.ts#L27-L38) (`services/api/scripts/migrate-boq-docs.ts:27-38`) [Tipe: `function`]
    - *Signature:* `(raw: string, id: string, table: string): Data`
  - [`buildPlan`](file://services/api/scripts/migrate-boq-docs.ts#L73-L152) (`services/api/scripts/migrate-boq-docs.ts:73-152`) [Tipe: `function`]
    - *Signature:* `(tx: TxContext, now: string): Promise<GroupPlan[]>`
  - [`stringField`](file://services/api/scripts/migrate-boq-docs.ts#L69-L71) (`services/api/scripts/migrate-boq-docs.ts:69-71`) [Tipe: `function`]
    - *Signature:* `(value: unknown): string | undefined`
  - [`stableDocId`](file://services/api/scripts/migrate-boq-docs.ts#L64-L67) (`services/api/scripts/migrate-boq-docs.ts:64-67`) [Tipe: `function`]
    - *Signature:* `(projectId: string): string`

### Sub-sistem: `byte:dibandingkan:identik` (Klaster #101)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ok`](file://services/api/scripts/pdf-db-probe.ts#L30-L38) (`services/api/scripts/pdf-db-probe.ts:30-38`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`ctxWith`](file://services/api/scripts/pdf-db-probe.ts#L47-L49) (`services/api/scripts/pdf-db-probe.ts:47-49`) [Tipe: `function`]
    - *Signature:* `(filters: Record<string, unknown>): Ctx`
  - [`probeDocuments`](file://services/api/scripts/pdf-db-probe.ts#L104-L231) (`services/api/scripts/pdf-db-probe.ts:104-231`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /**
 * Normalisasi byte PDF sebelum dibandingkan.
 *
 * Dua render dari input yang sama tidak pernah menghasilkan byte identik:
 * jsPDF menulis `/CreationDate` dan `/ID` yang mengandung waktu. Tanpa dua
 * field itu, "cetak ulang identik" akan selalu gagal dan probe ini akan
 * melatih orang untuk menolak assertion yang benar - lebih buruk daripada tidak
 * punya probe. Yang dibandingkan isi dokumennya, bukan stempel waktunya.
 */
  - [`probeReports`](file://services/api/scripts/pdf-db-probe.ts#L237-L298) (`services/api/scripts/pdf-db-probe.ts:237-298`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /**
 * Normalisasi byte PDF sebelum dibandingkan.
 *
 * Dua render dari input yang sama tidak pernah menghasilkan byte identik:
 * jsPDF menulis `/CreationDate` dan `/ID` yang mengandung waktu. Tanpa dua
 * field itu, "cetak ulang identik" akan selalu gagal dan probe ini akan
 * melatih orang untuk menolak assertion yang benar - lebih buruk daripada tidak
 * punya probe. Yang dibandingkan isi dokumennya, bukan stempel waktunya.
 */
  - [`samples`](file://services/api/scripts/pdf-db-probe.ts#L52-L77) (`services/api/scripts/pdf-db-probe.ts:52-77`) [Tipe: `function`]
    - *Signature:* `(): Promise<Sample[]>`
    - *Deskripsi:* /** Satu baris nyata per kind dokumen yang punya data di DB. */

### Sub-sistem: `runmysqldump:mysqldump:tablescount` (Klaster #135)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`runMysqldump`](file://services/api/src/backup.ts#L43-L82) (`services/api/src/backup.ts:43-82`) [Tipe: `function`]
    - *Signature:* `(mysqlUrl: string, outFile: string): Promise<void>`
  - [`tablesCount`](file://services/api/src/backup.ts#L26-L41) (`services/api/src/backup.ts:26-41`) [Tipe: `function`]
    - *Signature:* `(): Promise<{ count: number; tables: string[] }>`
  - [`argValue`](file://services/api/src/backup.ts#L9-L15) (`services/api/src/backup.ts:9-15`) [Tipe: `function`]
    - *Signature:* `(name: string): string | undefined`
  - [`sanitizeTimestamp`](file://services/api/src/backup.ts#L22-L24) (`services/api/src/backup.ts:22-24`) [Tipe: `function`]
    - *Signature:* `(iso: string): string`
  - [`resolveSqlitePath`](file://services/api/src/backup.ts#L17-L20) (`services/api/src/backup.ts:17-20`) [Tipe: `function`]
    - *Signature:* `(): string`

### Sub-sistem: `normalized:conversion:closeenough` (Klaster #164)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalized`](file://services/api/src/inventoryConversion.ts#L22-L24) (`services/api/src/inventoryConversion.ts:22-24`) [Tipe: `function`]
    - *Signature:* `(value: unknown): string`
  - [`inventoryConversionError`](file://services/api/src/inventoryConversion.ts#L90-L172) (`services/api/src/inventoryConversion.ts:90-172`) [Tipe: `function`]
    - *Signature:* `(
  data: Record<string, unknown>,
  previous?: Record<string, unknown>,
): string | null`
  - [`isEceran`](file://services/api/src/inventoryConversion.ts#L31-L33) (`services/api/src/inventoryConversion.ts:31-33`) [Tipe: `function`]
    - *Signature:* `(value: unknown): boolean`
  - [`closeEnough`](file://services/api/src/inventoryConversion.ts#L82-L84) (`services/api/src/inventoryConversion.ts:82-84`) [Tipe: `function`]
    - *Signature:* `(left: number, right: number): boolean`
  - [`conversionStateChanged`](file://services/api/src/inventoryConversion.ts#L75-L80) (`services/api/src/inventoryConversion.ts:75-80`) [Tipe: `function`]
    - *Signature:* `(previous: Record<string, unknown>, next: Record<string, unknown>): boolean`

### Sub-sistem: `material:request:parse` (Klaster #176)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parse`](file://services/api/src/materialRequests.ts#L67-L69) (`services/api/src/materialRequests.ts:67-69`) [Tipe: `function`]
    - *Signature:* `(row: Row): Data`
  - [`fulfillMaterialRequest`](file://services/api/src/materialRequests.ts#L196-L270) (`services/api/src/materialRequests.ts:196-270`) [Tipe: `function`]
    - *Signature:* `(id: string, actor: string): Promise<FulfillResult>`
  - [`mrStatus`](file://services/api/src/materialRequests.ts#L59-L62) (`services/api/src/materialRequests.ts:59-62`) [Tipe: `function`]
    - *Signature:* `(issued: number, shortage: number, hadShortage: boolean): MrStatus`
  - [`decideMaterialRequest`](file://services/api/src/materialRequests.ts#L276-L314) (`services/api/src/materialRequests.ts:276-314`) [Tipe: `function`]
    - *Signature:* `(id: string, decision: "approve" | "reject", actor: string, note: string): Promise<DecisionResult>`
  - [`registerMaterialRequestRoutes`](file://services/api/src/routes/materialRequests.ts#L27-L96) (`services/api/src/routes/materialRequests.ts:27-96`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `require:collection:write` (Klaster #207)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`requirePermission`](file://services/api/src/policy.ts#L389-L401) (`services/api/src/policy.ts:389-401`) [Tipe: `function`]
    - *Signature:* `(collection: string, action: Action)`
  - [`requireSettingsWrite`](file://services/api/src/policy.ts#L427-L429) (`services/api/src/policy.ts:427-429`) [Tipe: `function`]
    - *Signature:* `()`
  - [`requireCollectionWrite`](file://services/api/src/policy.ts#L404-L406) (`services/api/src/policy.ts:404-406`) [Tipe: `function`]
    - *Signature:* `(collection: string)`
  - [`requireAuditRead`](file://services/api/src/policy.ts#L431-L433) (`services/api/src/policy.ts:431-433`) [Tipe: `function`]
    - *Signature:* `()`
  - [`requireCollectionDelete`](file://services/api/src/policy.ts#L412-L414) (`services/api/src/policy.ts:412-414`) [Tipe: `function`]
    - *Signature:* `(collection: string)`

### Sub-sistem: `sinkronkan:dimuat:auth` (Klaster #251)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`initialsOf`](file://apps/web/src/auth/auth.tsx#L85-L91) (`apps/web/src/auth/auth.tsx:85-91`) [Tipe: `function`]
    - *Signature:* `(name: string): string`
    - *Deskripsi:* /**
 * Pengecekan izin modular berbasis matriks policy server (ADR-0004 & F2-05).
 */
  - [`logout`](file://apps/web/src/auth/auth.tsx#L222-L253) (`apps/web/src/auth/auth.tsx:222-253`) [Tipe: `function`]
    - *Signature:* `(force = false): boolean`
    - *Deskripsi:* // Sinkronkan permissions pengguna dari /api/auth/me saat aplikasi dimuat
  - [`login`](file://apps/web/src/auth/auth.tsx#L159-L220) (`apps/web/src/auth/auth.tsx:159-220`) [Tipe: `function`]
    - *Signature:* `(username: string, password: string): Promise<string | null>`
    - *Deskripsi:* // Sinkronkan permissions pengguna dari /api/auth/me saat aplikasi dimuat
  - [`forgetDeleteDates`](file://apps/web/src/utils/audit.ts#L32-L34) (`apps/web/src/utils/audit.ts:32-34`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`verifiedBranchScope`](file://apps/web/src/data/branchScope.ts#L19-L21) (`apps/web/src/data/branchScope.ts:19-21`) [Tipe: `function`]
    - *Signature:* `(serverBranch: unknown): string`

### Sub-sistem: `dismiss:storage:sessionstorage` (Klaster #265)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`serializeDismissed`](file://apps/web/src/utils/bannerDismiss.ts#L51-L58) (`apps/web/src/utils/bannerDismiss.ts:51-58`) [Tipe: `function`]
    - *Signature:* `(map: DismissMap): string`
  - [`parseDismissed`](file://apps/web/src/utils/bannerDismiss.ts#L32-L49) (`apps/web/src/utils/bannerDismiss.ts:32-49`) [Tipe: `function`]
    - *Signature:* `(raw: string | null | undefined): DismissMap`
  - [`readDismissMap`](file://apps/web/src/components/AlertBanner.tsx#L151-L157) (`apps/web/src/components/AlertBanner.tsx:151-157`) [Tipe: `function`]
    - *Signature:* `(): DismissMap`
    - *Deskripsi:* /** sessionStorage bisa menolak: mode privat, atau iframe tanpa storage. */
  - [`writeDismissMap`](file://apps/web/src/components/AlertBanner.tsx#L159-L165) (`apps/web/src/components/AlertBanner.tsx:159-165`) [Tipe: `function`]
    - *Signature:* `(map: DismissMap): void`
    - *Deskripsi:* /** sessionStorage bisa menolak: mode privat, atau iframe tanpa storage. */
  - [`onStorage`](file://apps/web/src/components/AlertBanner.tsx#L187-L190) (`apps/web/src/components/AlertBanner.tsx:187-190`) [Tipe: `function`]
    - *Signature:* `(e: StorageEvent): void`

### Sub-sistem: `close:projectaddmodal:tahaplabel` (Klaster #284)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`close`](file://apps/web/src/components/ProjectAddModal.tsx#L130-L134) (`apps/web/src/components/ProjectAddModal.tsx:130-134`) [Tipe: `function`]
    - *Signature:* `()`
  - [`setF`](file://apps/web/src/components/ProjectAddModal.tsx#L72-L72) (`apps/web/src/components/ProjectAddModal.tsx:72-72`) [Tipe: `function`]
    - *Signature:* `(k: string, v: string)`
  - [`nextProjectCode`](file://apps/web/src/components/ProjectAddModal.tsx#L117-L126) (`apps/web/src/components/ProjectAddModal.tsx:117-126`) [Tipe: `function`]
    - *Signature:* `(type: string, start: string): string`
  - [`tahapLabel`](file://apps/web/src/utils/projectStages.ts#L38-L45) (`apps/web/src/utils/projectStages.ts:38-45`) [Tipe: `function`]
    - *Signature:* `(tahap: string, locale: string): string`
  - [`save`](file://apps/web/src/components/ProjectAddModal.tsx#L136-L211) (`apps/web/src/components/ProjectAddModal.tsx:136-211`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `accordion:commit:setopen` (Klaster #326)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`setOpen`](file://apps/web/src/components/ui.tsx#L1105-L1111) (`apps/web/src/components/ui.tsx:1105-1111`) [Tipe: `function`]
    - *Signature:* `(val: boolean | ((prev: boolean) => boolean))`
  - [`onKeyDown`](file://apps/web/src/components/ui.tsx#L1151-L1189) (`apps/web/src/components/ui.tsx:1151-1189`) [Tipe: `function`]
    - *Signature:* `(e: ReactKeyboardEvent<HTMLInputElement>)`
  - [`commit`](file://apps/web/src/components/ui.tsx#L1144-L1149) (`apps/web/src/components/ui.tsx:1144-1149`) [Tipe: `function`]
    - *Signature:* `(v: string)`
  - [`onDoc`](file://apps/web/src/components/ui.tsx#L1130-L1139) (`apps/web/src/components/ui.tsx:1130-1139`) [Tipe: `function`]
    - *Signature:* `(e: MouseEvent)`
  - [`Accordion`](file://apps/web/src/components/ui.tsx#L1369-L1404) (`apps/web/src/components/ui.tsx:1369-1404`) [Tipe: `function`]
    - *Signature:* `({
  title,
  subtitle,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
})`

### Sub-sistem: `upload:timeout:ocr` (Klaster #462)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`text`](file://services/api/src/pdf/documents/shared.ts#L262-L265) (`services/api/src/pdf/documents/shared.ts:262-265`) [Tipe: `function`]
    - *Signature:* `(v: unknown, fallback = "-"): string`
  - [`errMsg`](file://apps/web/src/services/upload.ts#L19-L26) (`apps/web/src/services/upload.ts:19-26`) [Tipe: `function`]
    - *Signature:* `(json: unknown, text: string, fallback: string): string`
    - *Deskripsi:* /** Timeout 60 dtk (upload/OCR file bisa besar) + pesan error baca .message. */
  - [`fetchTimeout`](file://apps/web/src/services/upload.ts#L28-L41) (`apps/web/src/services/upload.ts:28-41`) [Tipe: `function`]
    - *Signature:* `(input: string, init: RequestInit, ms = UPLOAD_TIMEOUT_MS): Promise<Response>`
    - *Deskripsi:* /** Timeout 60 dtk (upload/OCR file bisa besar) + pesan error baca .message. */
  - [`uploadFile`](file://apps/web/src/services/upload.ts#L43-L72) (`apps/web/src/services/upload.ts:43-72`) [Tipe: `function`]
    - *Signature:* `(file: File): Promise<string>`
  - [`ocrImageUrl`](file://apps/web/src/services/upload.ts#L77-L117) (`apps/web/src/services/upload.ts:77-117`) [Tipe: `function`]
    - *Signature:* `(url: string): Promise<string>`

### Sub-sistem: `price:vendor:qty` (Klaster #402)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/data/usePoActions.ts#L11-L11) (`apps/web/src/data/usePoActions.ts:11-11`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`poPendingReassign`](file://apps/web/src/data/usePoActions.ts#L28-L30) (`apps/web/src/data/usePoActions.ts:28-30`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): number`
  - [`poOpenQty`](file://apps/web/src/data/usePoActions.ts#L15-L18) (`apps/web/src/data/usePoActions.ts:15-18`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): number`
  - [`statusAfter`](file://apps/web/src/data/usePoActions.ts#L32-L37) (`apps/web/src/data/usePoActions.ts:32-37`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem, current: string): string`
    - *Deskripsi:* /** Qty yang dinyatakan vendor tidak sanggup dan belum dialihkan. */
  - [`itemPriceTrack`](file://apps/web/src/data/usePoActions.ts#L321-L331) (`apps/web/src/data/usePoActions.ts:321-331`) [Tipe: `function`]
    - *Signature:* `(pos: StoreItem[], item: string): { po: string; vendor: string; unitPrice: number; qty: number; date: string }[]`

### Sub-sistem: `month:key:posummarycharts` (Klaster #519)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`monthAxis`](file://apps/web/src/utils/monthAxis.ts#L103-L131) (`apps/web/src/utils/monthAxis.ts:103-131`) [Tipe: `function`]
    - *Signature:* `(opts: MonthAxisOptions = {}): MonthPoint[]`
  - [`monthKeyOfDate`](file://apps/web/src/utils/monthAxis.ts#L47-L49) (`apps/web/src/utils/monthAxis.ts:47-49`) [Tipe: `function`]
    - *Signature:* `(d: Date): string`
  - [`shiftMonthKey`](file://apps/web/src/utils/monthAxis.ts#L55-L60) (`apps/web/src/utils/monthAxis.ts:55-60`) [Tipe: `function`]
    - *Signature:* `(key: string, delta: number): string`
  - [`rebindLegacyMonthSeries`](file://apps/web/src/utils/monthAxis.ts#L212-L242) (`apps/web/src/utils/monthAxis.ts:212-242`) [Tipe: `function`]
    - *Signature:* `(
  rows: T[],
  opts: MonthAxisOptions = {},
): (T & { bln: string; key: string; isCurrent: boolean })[]`
  - [`fmtMonthRange`](file://apps/web/src/utils/monthAxis.ts#L253-L259) (`apps/web/src/utils/monthAxis.ts:253-259`) [Tipe: `function`]
    - *Signature:* `(axis: MonthPoint[]): string`

### Sub-sistem: `warehouses:kecuali:name` (Klaster #590)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sameName`](file://apps/web/src/utils/names.ts#L5-L7) (`apps/web/src/utils/names.ts:5-7`) [Tipe: `function`]
    - *Signature:* `(a: unknown, b: unknown): boolean`
  - [`num`](file://apps/web/src/utils/warehouse.ts#L43-L46) (`apps/web/src/utils/warehouse.ts:43-46`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
    - *Deskripsi:* /** Bentuk baris `warehouses`. Semua field opsional kecuali name. */
  - [`parseLegacyCap`](file://apps/web/src/utils/warehouse.ts#L48-L64) (`apps/web/src/utils/warehouse.ts:48-64`) [Tipe: `function`]
    - *Signature:* `(settings: StoreItem[] | undefined): Record<string, number>`
    - *Deskripsi:* /** Bentuk baris `warehouses`. Semua field opsional kecuali name. */
  - [`capacityOf`](file://apps/web/src/utils/warehouse.ts#L79-L97) (`apps/web/src/utils/warehouse.ts:79-97`) [Tipe: `function`]
    - *Signature:* `(
  name: string,
  warehouses: (StoreItem | Warehouse)[],
  settings?: StoreItem[],
): number`
  - [`vesselMatch`](file://apps/web/src/utils/names.ts#L10-L15) (`apps/web/src/utils/names.ts:10-15`) [Tipe: `function`]
    - *Signature:* `(slotVessel: unknown, vesselName: unknown): boolean`

### Sub-sistem: `unit:material:catalogmaterialform` (Klaster #585)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sackKgOf`](file://apps/web/src/utils/unitConversion.ts#L54-L58) (`apps/web/src/utils/unitConversion.ts:54-58`) [Tipe: `function`]
    - *Signature:* `(unit: unknown): number | null`
  - [`suggestedBaseUnit`](file://apps/web/src/utils/unitConversion.ts#L62-L67) (`apps/web/src/utils/unitConversion.ts:62-67`) [Tipe: `function`]
    - *Signature:* `(purchaseUnit: unknown): string`
  - [`numericField`](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L76-L82) (`apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx:76-82`) [Tipe: `function`]
    - *Signature:* `(value: string, onChange: (value: string) => void, label: string, step = "any")`
  - [`materialTypeLabel`](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L70-L74) (`apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx:70-74`) [Tipe: `function`]
    - *Signature:* `(value: string, strings: typeof n_inv.id): string`
  - [`buildUnitConversion`](file://apps/web/src/utils/unitConversion.ts#L162-L203) (`apps/web/src/utils/unitConversion.ts:162-203`) [Tipe: `function`]
    - *Signature:* `(
  category: unknown,
  purchaseUnit: string,
  draft: UnitConversionDraft,
): UnitConversion | null`

### Sub-sistem: `kop:setting:filter` (Klaster #685)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`setKopOverride`](file://services/api/src/pdf/documents/shared.ts#L55-L66) (`services/api/src/pdf/documents/shared.ts:55-66`) [Tipe: `function`]
    - *Signature:* `(raw: unknown): void`
  - [`loadRenderModel`](file://services/api/src/pdf/renderStore.ts#L130-L160) (`services/api/src/pdf/renderStore.ts:130-160`) [Tipe: `function`]
    - *Signature:* `(id: string): Promise<RenderModelRow | null>`
  - [`readFilters`](file://services/api/src/routes/pdf.ts#L277-L286) (`services/api/src/routes/pdf.ts:277-286`) [Tipe: `function`]
    - *Signature:* `(raw: unknown): Record<string, unknown>`
    - *Deskripsi:* /**
 * Filter yang diterima server.
 *
 * Hanya daftar putih. Tanpa itu, klien bisa mengirim filter bertingkat
 * bebas (deep object, array besar) yang nanti ikut disimpan ke snapshot dan
 * membuat baris pdfDocs membengkak tanpa batas.
 */
  - [`applyKopSetting`](file://services/api/src/routes/pdf.ts#L38-L43) (`services/api/src/routes/pdf.ts:38-43`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /** Muat kop dari setting COMPANY_KOP; gagal baca = kop bawaan. */
  - [`entityBranch`](file://services/api/src/pdf/documents/shared.ts#L177-L181) (`services/api/src/pdf/documents/shared.ts:177-181`) [Tipe: `function`]
    - *Signature:* `(field: string, id: string): Promise<string | null>`

### Sub-sistem: `file:saveattachment:pendukung` (Klaster #681)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`uploadsRoot`](file://services/api/src/routes/files.ts#L102-L105) (`services/api/src/routes/files.ts:102-105`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`hasMagic`](file://services/api/src/routes/files.ts#L16-L46) (`services/api/src/routes/files.ts:16-46`) [Tipe: `function`]
    - *Signature:* `(buf: Buffer, ext: string): boolean`
  - [`scanContent`](file://services/api/src/routes/files.ts#L50-L100) (`services/api/src/routes/files.ts:50-100`) [Tipe: `function`]
    - *Signature:* `(buf: Buffer, ext: string): string | null`
  - [`isPrivateFile`](file://services/api/src/routes/files.ts#L109-L126) (`services/api/src/routes/files.ts:109-126`) [Tipe: `function`]
    - *Signature:* `(url: string): Promise<boolean>`
  - [`saveAttachment`](file://services/api/src/routes/publicLeave.ts#L97-L112) (`services/api/src/routes/publicLeave.ts:97-112`) [Tipe: `function`]
    - *Signature:* `(att: { name: string; data: string }): { url: string; file: string } | { error: string }`
    - *Deskripsi:* /** Simpan dokumen pendukung; mengembalikan URL atau pesan penolakan. */

### Sub-sistem: `loan:pinjaman:terjadwal` (Klaster #721)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`cancelLoan`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L83-L88) (`apps/web/src/pages/equipment/DelegationPanel.tsx:83-88`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem)`
    - *Deskripsi:* // Pinjaman terjadwal yang belum dimulai dibatalkan (bukan "dikembalikan").
  - [`finishMaint`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L89-L94) (`apps/web/src/pages/equipment/DelegationPanel.tsx:89-94`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem)`
    - *Deskripsi:* // Pinjaman terjadwal yang belum dimulai dibatalkan (bukan "dikembalikan").
  - [`returnLoan`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L76-L81) (`apps/web/src/pages/equipment/DelegationPanel.tsx:76-81`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem)`
  - [`saveMaint`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L62-L75) (`apps/web/src/pages/equipment/DelegationPanel.tsx:62-75`) [Tipe: `function`]
    - *Signature:* `()`
  - [`saveLoan`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L50-L61) (`apps/web/src/pages/equipment/DelegationPanel.tsx:50-61`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `amt:txt:set` (Klaster #762)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`set`](file://apps/web/src/pages/keuangan/Finance.tsx#L671-L674) (`apps/web/src/pages/keuangan/Finance.tsx:671-674`) [Tipe: `function`]
    - *Signature:* `(f: SptNumField, v: string): void`
  - [`amt`](file://apps/web/src/pages/keuangan/Finance.tsx#L696-L708) (`apps/web/src/pages/keuangan/Finance.tsx:696-708`) [Tipe: `function`]
    - *Signature:* `(f: SptNumField, label: string): ReactElement`
  - [`txt`](file://apps/web/src/pages/keuangan/Finance.tsx#L684-L695) (`apps/web/src/pages/keuangan/Finance.tsx:684-695`) [Tipe: `function`]
    - *Signature:* `(f: SptNumField, label: string, ph = ""): ReactElement`
  - [`save`](file://apps/web/src/pages/keuangan/Finance.tsx#L676-L682) (`apps/web/src/pages/keuangan/Finance.tsx:676-682`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`leaveUsedByEmployee`](file://apps/web/src/utils/leaveBalance.ts#L6-L14) (`apps/web/src/utils/leaveBalance.ts:6-14`) [Tipe: `function`]
    - *Signature:* `(leaves: readonly Record<string, unknown>[]): Map<string, number>`

### Sub-sistem: `gabungkan:expandedkeys:expanded` (Klaster #879)
- **Kepadatan Simbol:** 6 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`visit`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L228-L233) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:228-233`) [Tipe: `function`]
    - *Signature:* `(nodes: CoaTreeNode[])`
  - [`filterNode`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L164-L193) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:164-193`) [Tipe: `function`]
    - *Signature:* `(node: CoaTreeNode): { keep: boolean; clone: CoaTreeNode | null }`
  - [`expandAll`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L226-L236) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:226-236`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Gabungkan expandedKeys pengguna dengan auto-expanded jika sedang mencari
  - [`collapseAll`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L238-L240) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:238-240`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Gabungkan expandedKeys pengguna dengan auto-expanded jika sedang mencari
  - [`toggleExpand`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L214-L224) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:214-224`) [Tipe: `function`]
    - *Signature:* `(kode: string)`
    - *Deskripsi:* // Gabungkan expandedKeys pengguna dengan auto-expanded jika sedang mencari

### Sub-sistem: `simulasi:moneyinput:sanitasi` (Klaster #24)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseRupiah`](file://apps/web/src/utils/format.ts#L83-L87) (`apps/web/src/utils/format.ts:83-87`) [Tipe: `function`]
    - *Signature:* `(input: string): number`
  - [`sanitizeMoneyInput`](file://apps/web/scripts/money-probe.ts#L26-L28) (`apps/web/scripts/money-probe.ts:26-28`) [Tipe: `function`]
    - *Signature:* `(raw: string): string`
    - *Deskripsi:* // Simulasi sanitasi onChange MoneyInput
  - [`assert`](file://apps/web/scripts/money-probe.ts#L9-L16) (`apps/web/scripts/money-probe.ts:9-16`) [Tipe: `function`]
    - *Signature:* `(name: string, ok: boolean, details?: string)`
    - *Deskripsi:* // Probe verifikasi format input uang dan parser rupiah (F3-A-02)
  - [`formatMoneyDisplay`](file://apps/web/scripts/money-probe.ts#L19-L23) (`apps/web/scripts/money-probe.ts:19-23`) [Tipe: `function`]
    - *Signature:* `(raw: string): string`
    - *Deskripsi:* // Simulasi logika formatting MoneyInput
  - [`run`](file://apps/web/scripts/money-probe.ts#L30-L74) (`apps/web/scripts/money-probe.ts:30-74`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Simulasi sanitasi onChange MoneyInput

### Sub-sistem: `cache:cachestats:cacheclear` (Klaster #65)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/cache-probe.ts#L13-L16) (`services/api/scripts/cache-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`headersFor`](file://services/api/scripts/cache-probe.ts#L17-L20) (`services/api/scripts/cache-probe.ts:17-20`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<{ authorization: string }>`
  - [`cacheStats`](file://services/api/src/listCache.ts#L79-L81) (`services/api/src/listCache.ts:79-81`) [Tipe: `function`]
    - *Signature:* `(): { entries: number; hits: number; misses: number }`
  - [`cacheClear`](file://services/api/src/listCache.ts#L84-L89) (`services/api/src/listCache.ts:84-89`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`main`](file://services/api/scripts/cache-probe.ts#L8-L64) (`services/api/scripts/cache-probe.ts:8-64`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `login:demo:saklar` (Klaster #69)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`login`](file://services/api/scripts/demo-roles-probe.ts#L74-L74) (`services/api/scripts/demo-roles-probe.ts:74-74`) [Tipe: `function`]
    - *Signature:* `(role: string)`
    - *Deskripsi:* // Login demo dari halaman login: butuh saklar ketiga DEMO_LOGIN_PAGE.
  - [`sw`](file://services/api/scripts/demo-roles-probe.ts#L29-L29) (`services/api/scripts/demo-roles-probe.ts:29-29`) [Tipe: `function`]
    - *Signature:* `(t: string, role: string)`
  - [`assert`](file://services/api/scripts/demo-roles-probe.ts#L16-L19) (`services/api/scripts/demo-roles-probe.ts:16-19`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`tokenOf`](file://services/api/scripts/demo-roles-probe.ts#L20-L26) (`services/api/scripts/demo-roles-probe.ts:20-26`) [Tipe: `function`]
    - *Signature:* `(username: string): Promise<string>`
  - [`main`](file://services/api/scripts/demo-roles-probe.ts#L11-L98) (`services/api/scripts/demo-roles-probe.ts:11-98`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `alloc:call:jumlah` (Klaster #70)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`alloc`](file://services/api/scripts/domain-guards-probe.ts#L109-L109) (`services/api/scripts/domain-guards-probe.ts:109-109`) [Tipe: `function`]
    - *Signature:* `(alokasi: unknown)`
  - [`call`](file://services/api/scripts/domain-guards-probe.ts#L20-L23) (`services/api/scripts/domain-guards-probe.ts:20-23`) [Tipe: `function`]
    - *Signature:* `(method: "POST" | "PUT" | "PATCH", url: string, payload: unknown)`
  - [`assert`](file://services/api/scripts/domain-guards-probe.ts#L14-L17) (`services/api/scripts/domain-guards-probe.ts:14-17`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`jumlah`](file://services/api/scripts/domain-guards-probe.ts#L137-L137) (`services/api/scripts/domain-guards-probe.ts:137-137`) [Tipe: `function`]
    - *Signature:* `(): Promise<number>`
    - *Deskripsi:* // Hanya baris bertanda probe ini yang dihitung, agar tidak terganggu penulis lain.
  - [`main`](file://services/api/scripts/domain-guards-probe.ts#L9-L177) (`services/api/scripts/domain-guards-probe.ts:9-177`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `listen:stream:jalankan` (Klaster #75)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`write`](file://services/api/scripts/events-probe.ts#L48-L48) (`services/api/scripts/events-probe.ts:48-48`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /** Buka stream, jalankan aksi, kumpulkan nama tabel selama `ms`. */
  - [`listen`](file://services/api/scripts/events-probe.ts#L24-L46) (`services/api/scripts/events-probe.ts:24-46`) [Tipe: `function`]
    - *Signature:* `(tok: string, act: () => Promise<void>, ms = 1200): Promise<string[]>`
    - *Deskripsi:* /** Buka stream, jalankan aksi, kumpulkan nama tabel selama `ms`. */
  - [`assert`](file://services/api/scripts/events-probe.ts#L15-L18) (`services/api/scripts/events-probe.ts:15-18`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`tokenFor`](file://services/api/scripts/events-probe.ts#L19-L22) (`services/api/scripts/events-probe.ts:19-22`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<string>`
  - [`main`](file://services/api/scripts/events-probe.ts#L7-L68) (`services/api/scripts/events-probe.ts:7-68`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `geometry:benar:check` (Klaster #104)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`checkGeometry`](file://services/api/src/pdf/document.ts#L304-L328) (`services/api/src/pdf/document.ts:304-328`) [Tipe: `function`]
    - *Signature:* `(
  res: RenderResult,
  margin: number,
  page: { width: number; height: number },
  opts: { footerZoneMm?: number } = {},
): GeometryProblem[]`
  - [`ok`](file://services/api/scripts/pdf-probe.ts#L58-L66) (`services/api/scripts/pdf-probe.ts:58-66`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`knownTables`](file://services/api/scripts/pdf-probe.ts#L361-L371) (`services/api/scripts/pdf-probe.ts:361-371`) [Tipe: `function`]
    - *Signature:* `(): Set<string>`
    - *Deskripsi:* /** Tabel yang benar-benar ada, dibaca dari berkas migrasi (sumber kebenaran). */
  - [`registryIntegrity`](file://services/api/scripts/pdf-probe.ts#L906-L950) (`services/api/scripts/pdf-probe.ts:906-950`) [Tipe: `function`]
    - *Signature:* `(): void`
    - *Deskripsi:* /** Model minimal per kind - cukup panjang untuk menguji pagination. */
  - [`geometryCheck`](file://services/api/scripts/pdf-probe.ts#L72-L81) (`services/api/scripts/pdf-probe.ts:72-81`) [Tipe: `function`]
    - *Signature:* `(name: string, d: ReturnType<typeof doc>, orientation: "portrait" | "landscape" = "portrait"): void`

### Sub-sistem: `submit:check:main` (Klaster #106)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/public-leave-probe.ts#L17-L20) (`services/api/scripts/public-leave-probe.ts:17-20`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`tokenFor`](file://services/api/scripts/public-leave-probe.ts#L21-L24) (`services/api/scripts/public-leave-probe.ts:21-24`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<string>`
  - [`submit`](file://services/api/scripts/public-leave-probe.ts#L29-L32) (`services/api/scripts/public-leave-probe.ts:29-32`) [Tipe: `function`]
    - *Signature:* `(over: Record<string, unknown>, ip: string)`
  - [`check`](file://services/api/scripts/public-leave-probe.ts#L50-L50) (`services/api/scripts/public-leave-probe.ts:50-50`) [Tipe: `function`]
    - *Signature:* `(payload: Record<string, unknown>, ip = "10.8.0.1")`
  - [`main`](file://services/api/scripts/public-leave-probe.ts#L12-L108) (`services/api/scripts/public-leave-probe.ts:12-108`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `probe:keamanan:fase` (Klaster #112)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`login`](file://services/api/scripts/security-probe.ts#L162-L176) (`services/api/scripts/security-probe.ts:162-176`) [Tipe: `function`]
    - *Signature:* `(username: string, password: string): Promise<{ status: number; body: any }>`
    - *Deskripsi:* // Migrasikan dan seed database probe sementara yang terisolasi
  - [`measureLogin`](file://services/api/scripts/security-probe.ts#L483-L487) (`services/api/scripts/security-probe.ts:483-487`) [Tipe: `function`]
    - *Signature:* `(uname: string): Promise<number>`
    - *Deskripsi:* // 24. T20: Timing attack: user tak ada vs ada
  - [`record`](file://services/api/scripts/security-probe.ts#L47-L70) (`services/api/scripts/security-probe.ts:47-70`) [Tipe: `function`]
    - *Signature:* `(
  id: string,
  test: string,
  expected: string,
  observed: string,
  vulnerable: boolean,
  severity: SecuritySeverity = "T",
  notApplicableReason?: string,
): void`
    - *Deskripsi:* /**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */
  - [`isSingleActiveBranchConfig`](file://services/api/scripts/security-probe.ts#L72-L93) (`services/api/scripts/security-probe.ts:72-93`) [Tipe: `function`]
    - *Signature:* `(): Promise<boolean>`
    - *Deskripsi:* /**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */
  - [`main`](file://services/api/scripts/security-probe.ts#L95-L912) (`services/api/scripts/security-probe.ts:95-912`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */

### Sub-sistem: `auth:ids:main` (Klaster #114)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`auth`](file://services/api/scripts/team-scope-probe.ts#L16-L16) (`services/api/scripts/team-scope-probe.ts:16-16`) [Tipe: `function`]
    - *Signature:* `(u: { id: string; username: string; role: string; token_version: number })`
  - [`assert`](file://services/api/scripts/team-scope-probe.ts#L11-L14) (`services/api/scripts/team-scope-probe.ts:11-14`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`userOf`](file://services/api/scripts/team-scope-probe.ts#L15-L15) (`services/api/scripts/team-scope-probe.ts:15-15`) [Tipe: `function`]
    - *Signature:* `(role: string)`
  - [`ids`](file://services/api/scripts/team-scope-probe.ts#L23-L24) (`services/api/scripts/team-scope-probe.ts:23-24`) [Tipe: `function`]
    - *Signature:* `(h: { authorization: string }): Promise<string[]>`
  - [`main`](file://services/api/scripts/team-scope-probe.ts#L6-L40) (`services/api/scripts/team-scope-probe.ts:6-40`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `token:getsecret:secret` (Klaster #131)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`getSecret`](file://services/api/src/auth.ts#L28-L31) (`services/api/src/auth.ts:28-31`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`signToken`](file://services/api/src/auth.ts#L41-L54) (`services/api/src/auth.ts:41-54`) [Tipe: `function`]
    - *Signature:* `(payload: AuthUser): string`
  - [`verifyToken`](file://services/api/src/auth.ts#L56-L70) (`services/api/src/auth.ts:56-70`) [Tipe: `function`]
    - *Signature:* `(token: string): AuthUser`
  - [`branchOfUser`](file://services/api/src/auth.ts#L97-L112) (`services/api/src/auth.ts:97-112`) [Tipe: `function`]
    - *Signature:* `(user: { employee_id?: string | null }): Promise<string>`
  - [`requireAuth`](file://services/api/src/auth.ts#L144-L231) (`services/api/src/auth.ts:144-231`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest, reply: FastifyReply): Promise<void>`

### Sub-sistem: `manager:str:project` (Klaster #156)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`str`](file://services/api/src/domainGuards.ts#L10-L10) (`services/api/src/domainGuards.ts:10-10`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string`
  - [`isProjectManagerTitle`](file://services/api/src/domainGuards.ts#L94-L97) (`services/api/src/domainGuards.ts:94-97`) [Tipe: `function`]
    - *Signature:* `(title: unknown): boolean`
  - [`projectManagerError`](file://services/api/src/domainGuards.ts#L101-L112) (`services/api/src/domainGuards.ts:101-112`) [Tipe: `function`]
    - *Signature:* `(table: string, before: Data | null, after: Data): Promise<string | null>`
  - [`projectFeeError`](file://services/api/src/domainGuards.ts#L175-L197) (`services/api/src/domainGuards.ts:175-197`) [Tipe: `function`]
    - *Signature:* `(table: string, before: Data | null, after: Data): string | null`
  - [`transferError`](file://services/api/src/domainGuards.ts#L115-L121) (`services/api/src/domainGuards.ts:115-121`) [Tipe: `function`]
    - *Signature:* `(table: string, data: Data): string | null`

### Sub-sistem: `resolve:runmysqlrestore:main` (Klaster #215)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`resolve`](file://services/api/src/pdf/reports.ts#L423-L429) (`services/api/src/pdf/reports.ts:423-429`) [Tipe: `function`]
    - *Signature:* `(row: Row): Record<string, unknown>`
  - [`resolveSqlitePath`](file://services/api/src/restore.ts#L23-L26) (`services/api/src/restore.ts:23-26`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`runMysqlRestore`](file://services/api/src/restore.ts#L28-L58) (`services/api/src/restore.ts:28-58`) [Tipe: `function`]
    - *Signature:* `(mysqlUrl: string, dumpFile: string): Promise<void>`
  - [`argValue`](file://services/api/src/restore.ts#L15-L21) (`services/api/src/restore.ts:15-21`) [Tipe: `function`]
    - *Signature:* `(name: string): string | undefined`
  - [`main`](file://services/api/src/restore.ts#L60-L100) (`services/api/src/restore.ts:60-100`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `akun:demo:switchtorole` (Klaster #255)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`readOrigin`](file://apps/web/src/auth/demoSwitch.ts#L18-L23) (`apps/web/src/auth/demoSwitch.ts:18-23`) [Tipe: `function`]
    - *Signature:* `(): Origin | null`
  - [`authHeader`](file://apps/web/src/auth/demoSwitch.ts#L30-L33) (`apps/web/src/auth/demoSwitch.ts:30-33`) [Tipe: `function`]
    - *Signature:* `(): Record<string, string>`
    - *Deskripsi:* /** Sedang memakai akun peran demo (bukan akun asal). */
  - [`switchToRole`](file://apps/web/src/auth/demoSwitch.ts#L57-L75) (`apps/web/src/auth/demoSwitch.ts:57-75`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<void>`
  - [`isImpersonating`](file://apps/web/src/auth/demoSwitch.ts#L26-L28) (`apps/web/src/auth/demoSwitch.ts:26-28`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`fetchDemoRoles`](file://apps/web/src/auth/demoSwitch.ts#L36-L39) (`apps/web/src/auth/demoSwitch.ts:36-39`) [Tipe: `function`]
    - *Signature:* `(): Promise<DemoRole[]>`

### Sub-sistem: `proyek:galat:render` (Klaster #318)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`render`](file://apps/web/src/components/ui.tsx#L739-L776) (`apps/web/src/components/ui.tsx:739-776`) [Tipe: `method`]
    - *Signature:* `()`
    - *Deskripsi:* /**
   * Reset error saat `resetKey` berubah.
   *
   * BUG YANG DIPERBAIKI: tanpa ini, satu galat mengunci SELURUH pola rute
   * berikutnya. React Router memakai instance React yang SAMA untuk
   * /proyek/A dan /proyek/B (elemen `<Route path="/proyek/:id">` cuma berubah
   * param), jadi boundary-nya tidak pernah di-unmount dan `state.error`
   * tetap tidak null. Hasilnya proyek kedua yang benar-benar sehat ikut
   * menampilkan layar galat - persis gejala "satu modul rusak, modul lain
   * ikut crash". Tombol "Coba lagi" ada, tapi pengguna seharusnya perlu
   * menemukannya.
   *
   * `componentDidUpdate` (bukan render) dipakai supaya tidak memanggil
   * setState saat render.
   */
  - [`componentDidUpdate`](file://apps/web/src/components/ui.tsx#L733-L737) (`apps/web/src/components/ui.tsx:733-737`) [Tipe: `method`]
    - *Signature:* `(prev: { resetKey?: string })`
    - *Deskripsi:* /**
   * Reset error saat `resetKey` berubah.
   *
   * BUG YANG DIPERBAIKI: tanpa ini, satu galat mengunci SELURUH pola rute
   * berikutnya. React Router memakai instance React yang SAMA untuk
   * /proyek/A dan /proyek/B (elemen `<Route path="/proyek/:id">` cuma berubah
   * param), jadi boundary-nya tidak pernah di-unmount dan `state.error`
   * tetap tidak null. Hasilnya proyek kedua yang benar-benar sehat ikut
   * menampilkan layar galat - persis gejala "satu modul rusak, modul lain
   * ikut crash". Tombol "Coba lagi" ada, tapi pengguna seharusnya perlu
   * menemukannya.
   *
   * `componentDidUpdate` (bukan render) dipakai supaya tidak memanggil
   * setState saat render.
   */
  - [`componentDidCatch`](file://apps/web/src/components/ui.tsx#L714-L716) (`apps/web/src/components/ui.tsx:714-716`) [Tipe: `method`]
    - *Signature:* `(error: Error, info: ErrorInfo)`
  - [`getDerivedStateFromError`](file://apps/web/src/components/ui.tsx#L710-L712) (`apps/web/src/components/ui.tsx:710-712`) [Tipe: `method`]
    - *Signature:* `(error: Error): ErrorBoundaryState`
  - [`ErrorBoundary`](file://apps/web/src/components/ui.tsx#L697-L777) (`apps/web/src/components/ui.tsx:697-777`) [Tipe: `class`]
    - *Signature:* `class ErrorBoundary`

### Sub-sistem: `fmtjumlah:usestore:wbsmaterialmodal` (Klaster #919)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`useStore`](file://apps/web/src/data/store.tsx#L2797-L2801) (`apps/web/src/data/store.tsx:2797-2801`) [Tipe: `function`]
    - *Signature:* `(): StoreCtx`
  - [`fmtJumlah`](file://apps/web/src/utils/format.ts#L94-L97) (`apps/web/src/utils/format.ts:94-97`) [Tipe: `function`]
    - *Signature:* `(n: number): string`
  - [`removeRow`](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L77-L85) (`apps/web/src/pages/proyek/WbsMaterialModal.tsx:77-85`) [Tipe: `function`]
    - *Signature:* `(bom: StoreItem): Promise<void>`
  - [`save`](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L46-L75) (`apps/web/src/pages/proyek/WbsMaterialModal.tsx:46-75`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`WbsMaterialModal`](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L30-L136) (`apps/web/src/pages/proyek/WbsMaterialModal.tsx:30-136`) [Tipe: `function`]
    - *Signature:* `({ projectId, task, onClose }: { projectId: string; task: string | null; onClose: () => void })`

### Sub-sistem: `base:issue:totalbase` (Klaster #565)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`round3`](file://apps/web/src/utils/stockIssue.ts#L14-L14) (`apps/web/src/utils/stockIssue.ts:14-14`) [Tipe: `function`]
    - *Signature:* `(n: number): number`
  - [`totalBase`](file://apps/web/src/utils/stockIssue.ts#L16-L18) (`apps/web/src/utils/stockIssue.ts:16-18`) [Tipe: `function`]
    - *Signature:* `(s: StockState, perUnit: number): number`
  - [`issueBase`](file://apps/web/src/utils/stockIssue.ts#L23-L34) (`apps/web/src/utils/stockIssue.ts:23-34`) [Tipe: `function`]
    - *Signature:* `(s: StockState, perUnit: number, qty: number): IssueResult`
  - [`plateCutKg`](file://apps/web/src/utils/stockIssue.ts#L37-L44) (`apps/web/src/utils/stockIssue.ts:37-44`) [Tipe: `function`]
    - *Signature:* `(conv: UnitConversion, lengthMm: number, widthMm: number): number | null`
  - [`useStockIssue`](file://apps/web/src/data/useStockIssue.ts#L19-L46) (`apps/web/src/data/useStockIssue.ts:19-46`) [Tipe: `function`]
    - *Signature:* `(): (a: StockIssueArgs) => Promise<{ baseQty: number; baseUnit: string }>`

### Sub-sistem: `envelope:bearer:dikirim` (Klaster #443)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isEnvelope`](file://apps/web/src/services/http.ts#L126-L128) (`apps/web/src/services/http.ts:126-128`) [Tipe: `function`]
    - *Signature:* `(v: unknown): v is OkEnvelope<unknown> | FailEnvelope`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.
  - [`apiFetchRaw`](file://apps/web/src/services/http.ts#L200-L256) (`apps/web/src/services/http.ts:200-256`) [Tipe: `function`]
    - *Signature:* `(path: string, init?: ApiFetchInit): Promise<T>`
    - *Deskripsi:* /** Timeout default 20 dtk: jaringan mati total tidak boleh diam selamanya. */
  - [`envelopeCode`](file://apps/web/src/services/http.ts#L114-L119) (`apps/web/src/services/http.ts:114-119`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string | undefined`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.
  - [`envelopeMessage`](file://apps/web/src/services/http.ts#L130-L136) (`apps/web/src/services/http.ts:130-136`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string | null`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.
  - [`envelopeData`](file://apps/web/src/services/http.ts#L121-L124) (`apps/web/src/services/http.ts:121-124`) [Tipe: `function`]
    - *Signature:* `(v: unknown): unknown`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.

### Sub-sistem: `doc:url:name` (Klaster #480)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`docAttachment`](file://apps/web/src/utils/docAttachment.ts#L62-L82) (`apps/web/src/utils/docAttachment.ts:62-82`) [Tipe: `function`]
    - *Signature:* `(row: unknown): Attachment`
  - [`read`](file://apps/web/src/utils/docAttachment.ts#L66-L71) (`apps/web/src/utils/docAttachment.ts:66-71`) [Tipe: `function`]
    - *Signature:* `(k: string): string`
  - [`nameFromUrl`](file://apps/web/src/utils/docAttachment.ts#L95-L99) (`apps/web/src/utils/docAttachment.ts:95-99`) [Tipe: `function`]
    - *Signature:* `(url: string, fallback = "dokumen"): string`
  - [`docFileNameOf`](file://apps/web/src/utils/docAttachment.ts#L90-L92) (`apps/web/src/utils/docAttachment.ts:90-92`) [Tipe: `function`]
    - *Signature:* `(row: unknown): string`
  - [`docUrlOf`](file://apps/web/src/utils/docAttachment.ts#L85-L87) (`apps/web/src/utils/docAttachment.ts:85-87`) [Tipe: `function`]
    - *Signature:* `(row: unknown): string`

### Sub-sistem: `excel:berbahaya:injeksi` (Klaster #489)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sanitizeCell`](file://apps/web/src/utils/export.ts#L8-L11) (`apps/web/src/utils/export.ts:8-11`) [Tipe: `function`]
    - *Signature:* `(v: string): string`
    - *Deskripsi:* /** Awalan sel berbahaya untuk injeksi formula Excel saat dibuka. */
  - [`cleanSheetName`](file://apps/web/src/utils/export.ts#L50-L52) (`apps/web/src/utils/export.ts:50-52`) [Tipe: `function`]
    - *Signature:* `(name: string): string`
    - *Deskripsi:* /** Awalan sel berbahaya untuk injeksi formula Excel saat dibuka. */
  - [`normalizeCell`](file://apps/web/src/utils/export.ts#L15-L19) (`apps/web/src/utils/export.ts:15-19`) [Tipe: `function`]
    - *Signature:* `(c: unknown): CellRaw`
    - *Deskripsi:* /** Awalan sel berbahaya untuk injeksi formula Excel saat dibuka. */
  - [`exportExcel`](file://apps/web/src/utils/export.ts#L21-L39) (`apps/web/src/utils/export.ts:21-39`) [Tipe: `function`]
    - *Signature:* `(data: unknown[][], filename: string, sheetName = "Export"): Promise<void>`
  - [`exportExcelSheets`](file://apps/web/src/utils/export.ts#L56-L82) (`apps/web/src/utils/export.ts:56-82`) [Tipe: `function`]
    - *Signature:* `(sheets: ExcelSheet[], filename: string): Promise<void>`

### Sub-sistem: `muncul:banner:lupa` (Klaster #516)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`todayISO`](file://apps/web/src/utils/moduleAlerts.ts#L93-L96) (`apps/web/src/utils/moduleAlerts.ts:93-96`) [Tipe: `function`]
    - *Signature:* `(): string`
    - *Deskripsi:* /** Warna banner/ikon per level. Satu sumber, dipakai banner + dashboard. */
  - [`isStamp`](file://apps/web/src/utils/moduleAlerts.ts#L488-L490) (`apps/web/src/utils/moduleAlerts.ts:488-490`) [Tipe: `function`]
    - *Signature:* `(v: unknown): boolean`
    - *Deskripsi:* /** Umur kondisi: dari field yang paling dekat ke "kapan ini muncul". */
  - [`normalizeItems`](file://apps/web/src/utils/moduleAlerts.ts#L502-L513) (`apps/web/src/utils/moduleAlerts.ts:502-513`) [Tipe: `function`]
    - *Signature:* `(items: ModuleAlertItem[]): ModuleAlertItem[]`
    - *Deskripsi:* /**
 * Jaring pengaman. Builder baru akan lupa mengeset `level` - dan `undefined`
 * diam-diam hilang dari group Dashboard (filter tidak cocok) tapi TETAP
 * terhitung di badge (sum berjalan). Dua tempat itu jadi berbeda jumlahnya,
 * dan itu jauh lebih sulit noticed daripada alert yang hilang.
 *
 * Default-nya "perhatian", bukan "kritis": kalau builder lupa, lebih baik
 * satu alert penting muncul di kelompoknya daripada angka badge yang tidak
 * yang tidak cocok dengan banner.
 */
  - [`makeCtx`](file://apps/web/src/utils/moduleAlerts.ts#L475-L482) (`apps/web/src/utils/moduleAlerts.ts:475-482`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape): Ctx`
    - *Deskripsi:* /** Umur kondisi: dari field yang paling dekat ke "kapan ini muncul". */
  - [`buildModuleAlertItemsFor`](file://apps/web/src/utils/moduleAlerts.ts#L583-L585) (`apps/web/src/utils/moduleAlerts.ts:583-585`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape, key: ModuleAlertKey): ModuleAlertItem[]`

### Sub-sistem: `2026:tanggal:utc` (Klaster #574)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseStamp`](file://apps/web/src/utils/timestamps.ts#L48-L55) (`apps/web/src/utils/timestamps.ts:48-55`) [Tipe: `function`]
    - *Signature:* `(v: string): number`
    - *Deskripsi:* /**
 * Parse tanggal harus bebas zona waktu.
 *
 * `Date.parse` tidak konsisten untuk tanggal tanpa jam: "2026-01-05" dibaca
 * sebagai UTC, tapi "2026-1-5" (tanpa nol di depan) dibaca sebagai waktu
 * LOKAL. Di mesin UTC-8 hasilnya berbeda 8 jam - cukup untuk menggeser tanggal
 * ke hari sebelumnya, jadi "2026-1-5" menjadi 4 Januari. Forma non-ISO
 * diparse eksplisit sebagai UTC supaya semua bentuk tanggal bebas zona.
 */
  - [`asComparable`](file://apps/web/src/utils/timestamps.ts#L33-L37) (`apps/web/src/utils/timestamps.ts:33-37`) [Tipe: `function`]
    - *Signature:* `(v: string | null): string | null`
    - *Deskripsi:* /**
 * Menyeragamkan bentuk tanggal supaya bisa diurutkan dengan perbandingan
 * leksikografis.
 *
 * Tanpa ini, kolom tanggal yang bisa disortir diam-diam menampilkan urutan
 * terbalik: `updated_at` dari server adalah ISO penuh
 * ("2026-10-04T08:00:00.000Z") sementara `createdAt` bisa "2026-10-04" atau
 * "2026-1-5". Dibandingkan sebagai teks, "2026-1-5" lebih kecil dari
 * "2026-10-2" padahal Januari lebih dulu - jadi tanggal paling awal justru
 * turun paling bawah. Semua bentuk yang bisa diparse diubah ke ISO penuh
 * supaya urutannya benar.
 */
  - [`lastTouchedAt`](file://apps/web/src/utils/timestamps.ts#L102-L109) (`apps/web/src/utils/timestamps.ts:102-109`) [Tipe: `function`]
    - *Signature:* `(row: Record<string, unknown> | null | undefined): string | null`
  - [`updatedAtOf`](file://apps/web/src/utils/timestamps.ts#L69-L71) (`apps/web/src/utils/timestamps.ts:69-71`) [Tipe: `function`]
    - *Signature:* `(row: Record<string, unknown> | null | undefined): string | null`
  - [`updatedAtRaw`](file://apps/web/src/utils/timestamps.ts#L74-L77) (`apps/web/src/utils/timestamps.ts:74-77`) [Tipe: `function`]
    - *Signature:* `(row: Record<string, unknown> | null | undefined): string | null`

### Sub-sistem: `chartblock:dimensiplanned:blok` (Klaster #626)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`chartHeight`](file://services/api/src/pdf/chart.ts#L262-L276) (`services/api/src/pdf/chart.ts:262-276`) [Tipe: `function`]
    - *Signature:* `(spec: ChartSpec, width: number): number`
    - *Deskripsi:* /** Dimensiplanned untuk blok (dipanggil oleh blocks.chartBlock). */
  - [`isHbar`](file://services/api/src/pdf/chart.ts#L281-L283) (`services/api/src/pdf/chart.ts:281-283`) [Tipe: `function`]
    - *Signature:* `(spec: ChartSpec): spec is HbarSpec`
    - *Deskripsi:* /** Dimensiplanned untuk blok (dipanggil oleh blocks.chartBlock). */
  - [`isDonut`](file://services/api/src/pdf/chart.ts#L278-L280) (`services/api/src/pdf/chart.ts:278-280`) [Tipe: `function`]
    - *Signature:* `(spec: ChartSpec): spec is DonutSpec`
    - *Deskripsi:* /** Dimensiplanned untuk blok (dipanggil oleh blocks.chartBlock). */
  - [`planChartHeight`](file://services/api/src/pdf/chart.ts#L238-L240) (`services/api/src/pdf/chart.ts:238-240`) [Tipe: `function`]
    - *Signature:* `(spec: ChartSpec, width: number): { height: number }`
  - [`chartBlock`](file://services/api/src/pdf/blocks.ts#L884-L904) (`services/api/src/pdf/blocks.ts:884-904`) [Tipe: `function`]
    - *Signature:* `(spec: ChartSpec): Block`

### Sub-sistem: `riwayat:termasuk:dianggap` (Klaster #784)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`approve`](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L44-L49) (`apps/web/src/pages/procurement/ServiceApprovalsTab.tsx:44-49`) [Tipe: `function`]
    - *Signature:* `(s: StoreItem)`
    - *Deskripsi:* // Riwayat termasuk service lama tanpa field approval (dianggap disetujui).
  - [`boqName`](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L39-L42) (`apps/web/src/pages/procurement/ServiceApprovalsTab.tsx:39-42`) [Tipe: `function`]
    - *Signature:* `(id: unknown)`
    - *Deskripsi:* // Riwayat termasuk service lama tanpa field approval (dianggap disetujui).
  - [`apvTone`](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L60-L60) (`apps/web/src/pages/procurement/ServiceApprovalsTab.tsx:60-60`) [Tipe: `function`]
    - *Signature:* `(a: string)`
    - *Deskripsi:* // Riwayat termasuk service lama tanpa field approval (dianggap disetujui).
  - [`confirmReject`](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L50-L59) (`apps/web/src/pages/procurement/ServiceApprovalsTab.tsx:50-59`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Riwayat termasuk service lama tanpa field approval (dianggap disetujui).
  - [`ServiceApprovalsTab`](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L16-L154) (`apps/web/src/pages/procurement/ServiceApprovalsTab.tsx:16-154`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `belum:dikenali:jabatan` (Klaster #794)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`post`](file://apps/web/src/pages/publik/CutiQr.tsx#L15-L16) (`apps/web/src/pages/publik/CutiQr.tsx:15-16`) [Tipe: `function`]
    - *Signature:* `(path: string, body: unknown): Promise<Response>`
    - *Deskripsi:* // mengembalikan nama, jabatan, dan departemen untuk verifikasi sebelum kirim.
  - [`lookup`](file://apps/web/src/pages/publik/CutiQr.tsx#L50-L61) (`apps/web/src/pages/publik/CutiQr.tsx:50-61`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* // undefined = belum dicek, null = NIK belum dikenali.
  - [`toBase64`](file://apps/web/src/pages/publik/CutiQr.tsx#L18-L23) (`apps/web/src/pages/publik/CutiQr.tsx:18-23`) [Tipe: `function`]
    - *Signature:* `(file: File): Promise<string>`
    - *Deskripsi:* // mengembalikan nama, jabatan, dan departemen untuk verifikasi sebelum kirim.
  - [`submit`](file://apps/web/src/pages/publik/CutiQr.tsx#L63-L81) (`apps/web/src/pages/publik/CutiQr.tsx:63-81`) [Tipe: `function`]
    - *Signature:* `(e: React.FormEvent): Promise<void>`
    - *Deskripsi:* // undefined = belum dicek, null = NIK belum dikenali.
  - [`CutiQr`](file://apps/web/src/pages/publik/CutiQr.tsx#L25-L146) (`apps/web/src/pages/publik/CutiQr.tsx:25-146`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `docs:csp:khusus` (Klaster #907)
- **Kepadatan Simbol:** 5 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`tagOf`](file://services/api/src/routes/apiDocs.ts#L54-L58) (`services/api/src/routes/apiDocs.ts:54-58`) [Tipe: `function`]
    - *Signature:* `(path: string): string`
    - *Deskripsi:* /** CSP khusus halaman docs: skrip hanya dari server sendiri + jsDelivr. */
  - [`buildOpenApi`](file://services/api/src/routes/apiDocs.ts#L107-L135) (`services/api/src/routes/apiDocs.ts:107-135`) [Tipe: `function`]
    - *Signature:* `(routes: RouteEntry[]): Json`
  - [`operation`](file://services/api/src/routes/apiDocs.ts#L60-L105) (`services/api/src/routes/apiDocs.ts:60-105`) [Tipe: `function`]
    - *Signature:* `(r: RouteEntry, collections: Set<string>): Json`
    - *Deskripsi:* /** CSP khusus halaman docs: skrip hanya dari server sendiri + jsDelivr. */
  - [`ok`](file://services/api/src/routes/apiDocs.ts#L49-L49) (`services/api/src/routes/apiDocs.ts:49-49`) [Tipe: `function`]
    - *Signature:* `(data: Json): Json`
    - *Deskripsi:* /** CSP khusus halaman docs: skrip hanya dari server sendiri + jsDelivr. */
  - [`registerApiDocs`](file://services/api/src/routes/apiDocs.ts#L137-L142) (`services/api/src/routes/apiDocs.ts:137-142`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `offline:pengujian:isolasi` (Klaster #356)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`run`](file://apps/web/scripts/auth-cache-probe.ts#L18-L57) (`apps/web/scripts/auth-cache-probe.ts:18-57`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Probe pengujian isolasi cache dan pembersihan offline (F2-07)
  - [`clearIsmsLocalStorage`](file://apps/web/src/data/idb.ts#L165-L180) (`apps/web/src/data/idb.ts:165-180`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`purgeOfflineCache`](file://apps/web/src/data/idb.ts#L185-L188) (`apps/web/src/data/idb.ts:185-188`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`assert`](file://apps/web/scripts/auth-cache-probe.ts#L9-L16) (`apps/web/scripts/auth-cache-probe.ts:9-16`) [Tipe: `function`]
    - *Signature:* `(name: string, ok: boolean, details?: string)`
    - *Deskripsi:* // Probe pengujian isolasi cache dan pembersihan offline (F2-07)

### Sub-sistem: `call:main:assert` (Klaster #63)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`docRow`](file://services/api/scripts/boq-docs-probe.ts#L43-L46) (`services/api/scripts/boq-docs-probe.ts:43-46`) [Tipe: `function`]
    - *Signature:* `(id: string)`
  - [`assert`](file://services/api/scripts/boq-docs-probe.ts#L13-L16) (`services/api/scripts/boq-docs-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`call`](file://services/api/scripts/boq-docs-probe.ts#L26-L27) (`services/api/scripts/boq-docs-probe.ts:26-27`) [Tipe: `function`]
    - *Signature:* `(method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown)`
  - [`main`](file://services/api/scripts/boq-docs-probe.ts#L8-L95) (`services/api/scripts/boq-docs-probe.ts:8-95`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `create:witadate:main` (Klaster #72)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`create`](file://services/api/scripts/drydock-booking-probe.ts#L46-L61) (`services/api/scripts/drydock-booking-probe.ts:46-61`) [Tipe: `function`]
    - *Signature:* `(dockId: string, startDate: string, endDate: string, branch?: string)`
  - [`assert`](file://services/api/scripts/drydock-booking-probe.ts#L29-L33) (`services/api/scripts/drydock-booking-probe.ts:29-33`) [Tipe: `function`]
    - *Signature:* `(name: string, condition: boolean, detail = ""): void`
  - [`witaDate`](file://services/api/scripts/drydock-booking-probe.ts#L8-L14) (`services/api/scripts/drydock-booking-probe.ts:8-14`) [Tipe: `function`]
    - *Signature:* `(offset: number): string`
  - [`main`](file://services/api/scripts/drydock-booking-probe.ts#L16-L160) (`services/api/scripts/drydock-booking-probe.ts:16-160`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `issue:stateof:main` (Klaster #82)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`issue`](file://services/api/scripts/inventory-issue-probe.ts#L24-L24) (`services/api/scripts/inventory-issue-probe.ts:24-24`) [Tipe: `function`]
    - *Signature:* `(id: string, body: Record<string, unknown>)`
  - [`assert`](file://services/api/scripts/inventory-issue-probe.ts#L12-L15) (`services/api/scripts/inventory-issue-probe.ts:12-15`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`stateOf`](file://services/api/scripts/inventory-issue-probe.ts#L25-L25) (`services/api/scripts/inventory-issue-probe.ts:25-25`) [Tipe: `function`]
    - *Signature:* `(id: string)`
  - [`main`](file://services/api/scripts/inventory-issue-probe.ts#L7-L47) (`services/api/scripts/inventory-issue-probe.ts:7-47`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `patch:main:assert` (Klaster #117)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`patch`](file://services/api/scripts/wo-spk-probe.ts#L30-L30) (`services/api/scripts/wo-spk-probe.ts:30-30`) [Tipe: `function`]
    - *Signature:* `(t: string, data: Record<string, unknown>)`
  - [`assert`](file://services/api/scripts/wo-spk-probe.ts#L12-L15) (`services/api/scripts/wo-spk-probe.ts:12-15`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`tokenOf`](file://services/api/scripts/wo-spk-probe.ts#L16-L20) (`services/api/scripts/wo-spk-probe.ts:16-20`) [Tipe: `function`]
    - *Signature:* `(username: string): Promise<string>`
  - [`main`](file://services/api/scripts/wo-spk-probe.ts#L7-L47) (`services/api/scripts/wo-spk-probe.ts:7-47`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `inventory:issue:issueinventory` (Klaster #169)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`requestIp`](file://services/api/src/audit.ts#L52-L60) (`services/api/src/audit.ts:52-60`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest): string`
  - [`round3`](file://services/api/src/inventoryIssue.ts#L15-L15) (`services/api/src/inventoryIssue.ts:15-15`) [Tipe: `function`]
    - *Signature:* `(n: number): number`
  - [`issueInventory`](file://services/api/src/inventoryIssue.ts#L28-L87) (`services/api/src/inventoryIssue.ts:28-87`) [Tipe: `function`]
    - *Signature:* `(id: string, input: IssueInput, actor: string): Promise<IssueOutput>`
  - [`registerInventoryIssueRoutes`](file://services/api/src/routes/inventoryIssue.ts#L17-L32) (`services/api/src/routes/inventoryIssue.ts:17-32`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `pickstring:closedb:findduplicates` (Klaster #125)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`closeDb`](file://services/api/src/db.ts#L236-L245) (`services/api/src/db.ts:236-245`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`findDuplicates`](file://services/api/src/auditDuplicates.ts#L48-L72) (`services/api/src/auditDuplicates.ts:48-72`) [Tipe: `function`]
    - *Signature:* `(table: string, field: string): Promise<DupRow[]>`
  - [`pickString`](file://services/api/src/auditDuplicates.ts#L43-L46) (`services/api/src/auditDuplicates.ts:43-46`) [Tipe: `function`]
    - *Signature:* `(data: unknown, field: string): string`
  - [`main`](file://services/api/src/auditDuplicates.ts#L74-L114) (`services/api/src/auditDuplicates.ts:74-114`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `exec:notewrite:execraw` (Klaster #150)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`exec`](file://services/api/src/db.ts#L95-L97) (`services/api/src/db.ts:95-97`) [Tipe: `function`]
    - *Signature:* `(sql: string, params: unknown[] = []): Promise<ExecResult>`
  - [`noteWrite`](file://services/api/src/db.ts#L84-L93) (`services/api/src/db.ts:84-93`) [Tipe: `function`]
    - *Signature:* `(sql: string, res: ExecResult): ExecResult`
  - [`execRaw`](file://services/api/src/db.ts#L99-L115) (`services/api/src/db.ts:99-115`) [Tipe: `function`]
    - *Signature:* `(sql: string, params: unknown[] = []): Promise<ExecResult>`
  - [`ensureMysql`](file://services/api/src/db.ts#L54-L60) (`services/api/src/db.ts:54-60`) [Tipe: `function`]
    - *Signature:* `(): mysql.Pool`

### Sub-sistem: `keepsrecord:keeps:foto` (Klaster #154)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`photoUrls`](file://services/api/src/domainGuards.ts#L24-L25) (`services/api/src/domainGuards.ts:24-25`) [Tipe: `function`]
    - *Signature:* `(stage: Data): string[]`
    - *Deskripsi:* // Schema rute menerima anggota array apa pun; yang bukan objek dianggap tahapan kosong.
  - [`withoutRole`](file://services/api/src/domainGuards.ts#L20-L20) (`services/api/src/domainGuards.ts:20-20`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string`
  - [`keepsRecord`](file://services/api/src/domainGuards.ts#L27-L34) (`services/api/src/domainGuards.ts:27-34`) [Tipe: `function`]
    - *Signature:* `(old: Data, next: Data): boolean`
    - *Deskripsi:* /** Riwayat lama harus utuh sebagai awalan dan foto lama tidak boleh hilang. */
  - [`wbsRuleError`](file://services/api/src/domainGuards.ts#L42-L65) (`services/api/src/domainGuards.ts:42-65`) [Tipe: `function`]
    - *Signature:* `(before: unknown, after: unknown): { code: "STAGE_IN_USE" | "PHOTO_REQUIRED"; message: string } | null`

### Sub-sistem: `stablejson:asrecord:effectiveconversionfingerprint` (Klaster #163)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`asRecord`](file://services/api/src/inventoryConversion.ts#L41-L45) (`services/api/src/inventoryConversion.ts:41-45`) [Tipe: `function`]
    - *Signature:* `(value: unknown): Record<string, unknown> | null`
  - [`positiveNumber`](file://services/api/src/inventoryConversion.ts#L26-L29) (`services/api/src/inventoryConversion.ts:26-29`) [Tipe: `function`]
    - *Signature:* `(value: unknown): number | null`
  - [`effectiveConversionFingerprint`](file://services/api/src/inventoryConversion.ts#L56-L73) (`services/api/src/inventoryConversion.ts:56-73`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>): string`
  - [`stableJson`](file://services/api/src/inventoryConversion.ts#L47-L54) (`services/api/src/inventoryConversion.ts:47-54`) [Tipe: `function`]
    - *Signature:* `(value: unknown): string`

### Sub-sistem: `insert:stok:requestmaterial` (Klaster #178)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`newId`](file://services/api/src/materialRequests.ts#L71-L73) (`services/api/src/materialRequests.ts:71-73`) [Tipe: `function`]
    - *Signature:* `(prefix: string): string`
  - [`insert`](file://services/api/src/materialRequests.ts#L75-L79) (`services/api/src/materialRequests.ts:75-79`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string, data: Data, now: string): Promise<void>`
  - [`issueFromStock`](file://services/api/src/materialRequests.ts#L82-L99) (`services/api/src/materialRequests.ts:82-99`) [Tipe: `function`]
    - *Signature:* `(
  row: Row, item: Data, stock: number, give: number, now: string,
  movement: { itemName: string; unit: string; by: string; ref: Data; note: string },
): Promise<string>`
    - *Deskripsi:* /** Kurangi stok + catat movement OUT. Gagal 409 bila stok berubah sejak dibaca. */
  - [`requestMaterial`](file://services/api/src/materialRequests.ts#L101-L181) (`services/api/src/materialRequests.ts:101-181`) [Tipe: `function`]
    - *Signature:* `(input: MaterialRequestInput): Promise<MaterialRequestResult>`

### Sub-sistem: `mysql:json:migrate` (Klaster #181)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`migrate`](file://services/api/src/migrate.ts#L29-L124) (`services/api/src/migrate.ts:29-124`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`checksumOf`](file://services/api/src/migrate.ts#L7-L9) (`services/api/src/migrate.ts:7-9`) [Tipe: `function`]
    - *Signature:* `(raw: string): string`
  - [`ensureWideJsonColumns`](file://services/api/src/migrate.ts#L153-L173) (`services/api/src/migrate.ts:153-173`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /**
 * Kolom yang menyimpan JSON besar -> MEDIUMTEXT di MySQL.
 *
 * Kenapa perlu: MySQL `TEXT` batasnya 64 KB, sementara SQLite tidak punya
 * batas panjang sama sekali. Skema yang sama jadi sedikit lebih lega di
 * SQLite dan bisa gagal di MySQL tanpa terlihat.
 *
 * Yang terdampak nyata bukan hypothetis:
 *   - `pdfDocs.model` = JSON hasil factory. Laporan analitik 12 bulan +
 *     profit per tipe + per cabang + Pareto + fishbone easily melewati 64 KB.
 *   - `audit_log.diff` = jejak render/reprint yang ikut menyimpan ringkasan.
 *   - `documents.data` = payload transmittal/bukti.
 *
 * Dan kegagalannya SENGAJA tersembunyi: saveRenderModel() menangkap error
 * tulis lalu hanya memberi tahu lewat console.warn, supaya snapshot yang
 * gagal tidak membatalkan cetakan. Di MySQL itu artinya "cetak ulang" mati
 * tanpa jejak di UI - penyebabnya cuma baris warning di log server.
 *
 * Idempoten: lebar kolom dibaca dari information_schema lebih dulu, jadi
 * migrasi kedua tidak melakukan ALTER yang sama.
 */
  - [`isIgnorableMigrationError`](file://services/api/src/migrate.ts#L11-L27) (`services/api/src/migrate.ts:11-27`) [Tipe: `function`]
    - *Signature:* `(sql: string, err: unknown): boolean`

### Sub-sistem: `peran:role:demo` (Klaster #191)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalizeRole`](file://services/api/src/policy.ts#L48-L67) (`services/api/src/policy.ts:48-67`) [Tipe: `function`]
    - *Signature:* `(raw: unknown): Role`
  - [`permissionsFor`](file://services/api/src/policy.ts#L381-L384) (`services/api/src/policy.ts:381-384`) [Tipe: `function`]
    - *Signature:* `(role: unknown): Record<string, Action[]>`
  - [`issueDemoToken`](file://services/api/src/routes/demoSwitch.ts#L50-L76) (`services/api/src/routes/demoSwitch.ts:50-76`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<DemoIssue>`
    - *Deskripsi:* /** Token untuk akun seed sebuah peran. Dipakai "lihat sebagai peran" dan login demo. */
  - [`roleRank`](file://services/api/src/policy.ts#L69-L72) (`services/api/src/policy.ts:69-72`) [Tipe: `function`]
    - *Signature:* `(role: unknown): number`

### Sub-sistem: `mulai:sumber:selesai` (Klaster #234)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`write`](file://services/api/src/seedReprice.ts#L138-L144) (`services/api/src/seedReprice.ts:138-144`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string, data: unknown, branch: string | null, prevUpdated: string | null): Promise<void>`
    - *Deskripsi:* /**
 * Jumlah hari kerja maintenance, diturunkan dari sumber yang paling kuat.
 *
 * Urutannya penting: `laborDays` eksplisit > `laborCost / tarif lama` >
 * tanggal selesai - mulai. Yang terakhir dipakai inklusif, jadi pekerjaan
 * yang mulai dan selesai di tanggal yang sama tetap dihitung 1 hari.
 *
 * Kalau tidak ada satu pun sumber, dikembalikan null - pemanggil lalu
 * MELEWATI baris itu. Durasi yang dikarang akan membuat HPP salah dan tidak
 * ada yang bisa mengetahuinya, jadi lebih baik baris itu dilaporkan.
 */
  - [`n`](file://services/api/src/seedReprice.ts#L96-L100) (`services/api/src/seedReprice.ts:96-100`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number | null`
  - [`deriveDays`](file://services/api/src/seedReprice.ts#L113-L136) (`services/api/src/seedReprice.ts:113-136`) [Tipe: `function`]
    - *Signature:* `(
  data: Record<string, unknown>,
  oldLabor: number | null,
  oldRate: number | null,
): { days: number | null; from: string }`
    - *Deskripsi:* /**
 * Jumlah hari kerja maintenance, diturunkan dari sumber yang paling kuat.
 *
 * Urutannya penting: `laborDays` eksplisit > `laborCost / tarif lama` >
 * tanggal selesai - mulai. Yang terakhir dipakai inklusif, jadi pekerjaan
 * yang mulai dan selesai di tanggal yang sama tetap dihitung 1 hari.
 *
 * Kalau tidak ada satu pun sumber, dikembalikan null - pemanggil lalu
 * MELEWATI baris itu. Durasi yang dikarang akan membuat HPP salah dan tidak
 * ada yang bisa mengetahuinya, jadi lebih baik baris itu dilaporkan.
 */
  - [`main`](file://services/api/src/seedReprice.ts#L146-L358) (`services/api/src/seedReprice.ts:146-358`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /**
 * Jumlah hari kerja maintenance, diturunkan dari sumber yang paling kuat.
 *
 * Urutannya penting: `laborDays` eksplisit > `laborCost / tarif lama` >
 * tanggal selesai - mulai. Yang terakhir dipakai inklusif, jadi pekerjaan
 * yang mulai dan selesai di tanggal yang sama tetap dihitung 1 hari.
 *
 * Kalau tidak ada satu pun sumber, dikembalikan null - pemanggil lalu
 * MELEWATI baris itu. Durasi yang dikarang akan membuat HPP salah dan tidak
 * ada yang bisa mengetahuinya, jadi lebih baik baris itu dilaporkan.
 */

### Sub-sistem: `prng:stabil:antar` (Klaster #237)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pick`](file://services/api/src/seedWhatIf.ts#L22-L22) (`services/api/src/seedWhatIf.ts:22-22`) [Tipe: `function`]
    - *Signature:* `(arr: T[]): T`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.
  - [`put`](file://services/api/src/seedWhatIf.ts#L41-L43) (`services/api/src/seedWhatIf.ts:41-43`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string, data: Record<string, unknown>, branch = ""): void`
  - [`pad`](file://services/api/src/seedWhatIf.ts#L24-L24) (`services/api/src/seedWhatIf.ts:24-24`) [Tipe: `function`]
    - *Signature:* `(n: number, w = 3): string`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.
  - [`build`](file://services/api/src/seedWhatIf.ts#L39-L417) (`services/api/src/seedWhatIf.ts:39-417`) [Tipe: `function`]
    - *Signature:* `(): { rows: Row[]; wbsRows: Array<{ projectId: string; wbs: unknown }>; teamRows: Array<{ projectId: string; memberIds: string[] }> }`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.

### Sub-sistem: `prng:stabil:antar` (Klaster #238)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`int`](file://services/api/src/seedWhatIf.ts#L23-L23) (`services/api/src/seedWhatIf.ts:23-23`) [Tipe: `function`]
    - *Signature:* `(a: number, b: number): number`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.
  - [`iso`](file://services/api/src/seedWhatIf.ts#L25-L26) (`services/api/src/seedWhatIf.ts:25-26`) [Tipe: `function`]
    - *Signature:* `(y: number, m: number, d: number): string`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.
  - [`bump`](file://services/api/src/seedWhatIf.ts#L441-L446) (`services/api/src/seedWhatIf.ts:441-446`) [Tipe: `function`]
    - *Signature:* `(): void`
    - *Deskripsi:* // Guard: tolak bila DB tidak kosong (kecuali --force).
  - [`main`](file://services/api/src/seedWhatIf.ts#L419-L504) (`services/api/src/seedWhatIf.ts:419-504`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.

### Sub-sistem: `persetujuan:service:proyek` (Klaster #242)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`approvalOf`](file://services/api/src/serviceApproval.ts#L33-L36) (`services/api/src/serviceApproval.ts:33-36`) [Tipe: `function`]
    - *Signature:* `(d: Data): ServiceApproval`
  - [`wbsTaskError`](file://services/api/src/serviceApproval.ts#L58-L65) (`services/api/src/serviceApproval.ts:58-65`) [Tipe: `function`]
    - *Signature:* `(projectId: string, task: string): Promise<string | null>`
    - *Deskripsi:* /** Service proyek baru dari CRUD: selalu menunggu persetujuan. Service kapal
 *  (tanpa proyek) tidak memakai alur persetujuan procurement. */
  - [`boqPrice`](file://services/api/src/serviceApproval.ts#L67-L74) (`services/api/src/serviceApproval.ts:67-74`) [Tipe: `function`]
    - *Signature:* `(boqRef: string): Promise<number | null>`
    - *Deskripsi:* /** Service proyek baru dari CRUD: selalu menunggu persetujuan. Service kapal
 *  (tanpa proyek) tidak memakai alur persetujuan procurement. */
  - [`serviceGuardError`](file://services/api/src/serviceApproval.ts#L77-L109) (`services/api/src/serviceApproval.ts:77-109`) [Tipe: `function`]
    - *Signature:* `(table: string, before: Data | null, after: Data | null): Promise<string | null>`

### Sub-sistem: `benar:notif:firstpresent` (Klaster #263)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`notifRowId`](file://apps/web/src/components/AlertBanner.tsx#L33-L35) (`apps/web/src/components/AlertBanner.tsx:33-35`) [Tipe: `function`]
    - *Signature:* `(id: string): string`
  - [`firstPresent`](file://apps/web/src/components/AlertBanner.tsx#L72-L78) (`apps/web/src/components/AlertBanner.tsx:72-78`) [Tipe: `function`]
    - *Signature:* `(ids: string[]): HTMLElement | null`
    - *Deskripsi:* /** Ambil elemen baris pertama yang benar-benar ada di DOM. */
  - [`clearTimers`](file://apps/web/src/components/AlertBanner.tsx#L66-L69) (`apps/web/src/components/AlertBanner.tsx:66-69`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`useNotifFlash`](file://apps/web/src/components/AlertBanner.tsx#L52-L118) (`apps/web/src/components/AlertBanner.tsx:52-118`) [Tipe: `function`]
    - *Signature:* `(): {
  flashId: string | null;
  flashIds: ReadonlySet<string>;
  pick: (rowId: string, index: number, goToPage: (p: number) => void, size: number) => void;
  pickMany: (rowIds: string[], index: number, goToPage: (p: number) => void, size: number) => void;
}`

### Sub-sistem: `mod:seen:savemodseen` (Klaster #523)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadModSeen`](file://apps/web/src/utils/notifRead.ts#L31-L46) (`apps/web/src/utils/notifRead.ts:31-46`) [Tipe: `function`]
    - *Signature:* `(): Record<string, string[]>`
  - [`saveModSeen`](file://apps/web/src/utils/notifRead.ts#L48-L56) (`apps/web/src/utils/notifRead.ts:48-56`) [Tipe: `function`]
    - *Signature:* `(key: string, ids: string[]): void`
  - [`notifyModSeen`](file://apps/web/src/utils/notifRead.ts#L58-L60) (`apps/web/src/utils/notifRead.ts:58-60`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`useModuleAlert`](file://apps/web/src/components/AlertBanner.tsx#L413-L438) (`apps/web/src/components/AlertBanner.tsx:413-438`) [Tipe: `function`]
    - *Signature:* `(key: ModuleAlertKey): {
  active: boolean;
  items: ModuleAlertItem[];
  dismiss: BannerDismiss;
}`

### Sub-sistem: `formattime:displayvalue:changehistory` (Klaster #271)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`formatTime`](file://apps/web/src/components/ChangeHistory.tsx#L39-L48) (`apps/web/src/components/ChangeHistory.tsx:39-48`) [Tipe: `function`]
    - *Signature:* `(value: unknown, locale: "id" | "en"): string`
  - [`displayValue`](file://apps/web/src/components/ChangeHistory.tsx#L28-L37) (`apps/web/src/components/ChangeHistory.tsx:28-37`) [Tipe: `function`]
    - *Signature:* `(field: string, value: unknown, redactedLabel: string): string`
  - [`changesOf`](file://apps/web/src/components/ChangeHistory.tsx#L19-L26) (`apps/web/src/components/ChangeHistory.tsx:19-26`) [Tipe: `function`]
    - *Signature:* `(diff: unknown): AuditChange[]`
  - [`ChangeHistory`](file://apps/web/src/components/ChangeHistory.tsx#L62-L204) (`apps/web/src/components/ChangeHistory.tsx:62-204`) [Tipe: `function`]
    - *Signature:* `({
  table,
  rowId,
  locale = "id",
  labels,
  entries,
}: {
  table?: string;
  rowId?: string;
  locale?: "id" | "en";
  labels: {
    title: string;
    loading: string;
    empty: string;
    error: string;
    serverUnavailable: string;
    before: string;
    after: string;
    redacted: string;
  };
  entries?: HistoryEntryItem[];
})`

### Sub-sistem: `num:clientmodal:save` (Klaster #272)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/components/ClientModal.tsx#L40-L40) (`apps/web/src/components/ClientModal.tsx:40-40`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`setF`](file://apps/web/src/components/ClientModal.tsx#L33-L33) (`apps/web/src/components/ClientModal.tsx:33-33`) [Tipe: `function`]
    - *Signature:* `(k: string, v: string)`
  - [`save`](file://apps/web/src/components/ClientModal.tsx#L35-L65) (`apps/web/src/components/ClientModal.tsx:35-65`) [Tipe: `function`]
    - *Signature:* `()`
  - [`ClientModal`](file://apps/web/src/components/ClientModal.tsx#L13-L117) (`apps/web/src/components/ClientModal.tsx:13-117`) [Tipe: `function`]
    - *Signature:* `({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (name: string) => void;
})`

### Sub-sistem: `toggle:branch:allids` (Klaster #279)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toggle`](file://apps/web/src/components/FlowTree.tsx#L96-L96) (`apps/web/src/components/FlowTree.tsx:96-96`) [Tipe: `function`]
    - *Signature:* `(id: string): void`
  - [`allIds`](file://apps/web/src/components/FlowTree.tsx#L97-L97) (`apps/web/src/components/FlowTree.tsx:97-97`) [Tipe: `function`]
    - *Signature:* `(list: FlowNode[]): string[]`
  - [`Branch`](file://apps/web/src/components/FlowTree.tsx#L27-L89) (`apps/web/src/components/FlowTree.tsx:27-89`) [Tipe: `function`]
    - *Signature:* `({ nodes, depth, open, toggle, labels }: {
  nodes: FlowNode[]; depth: number; open: Set<string>; toggle: (id: string) => void;
  labels: { expand: string; collapse: string };
})`
    - *Deskripsi:* // px dari atas simpul ke garis siku
  - [`FlowTree`](file://apps/web/src/components/FlowTree.tsx#L92-L107) (`apps/web/src/components/FlowTree.tsx:92-107`) [Tipe: `function`]
    - *Signature:* `({ nodes, defaultOpen, labels }: {
  nodes: FlowNode[]; defaultOpen?: string[]; labels: { expand: string; collapse: string; expandAll: string; collapseAll: string };
})`

### Sub-sistem: `form:unggahan:menempel` (Klaster #283)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`updateCaption`](file://apps/web/src/components/PhotoUploader.tsx#L119-L123) (`apps/web/src/components/PhotoUploader.tsx:119-123`) [Tipe: `function`]
    - *Signature:* `(index: number, caption: string)`
    - *Deskripsi:* // Unggahan yang selesai setelah form ditutup tidak boleh menempel ke form berikutnya.
  - [`addFiles`](file://apps/web/src/components/PhotoUploader.tsx#L71-L117) (`apps/web/src/components/PhotoUploader.tsx:71-117`) [Tipe: `function`]
    - *Signature:* `(files: FileList | null)`
    - *Deskripsi:* // Unggahan yang selesai setelah form ditutup tidak boleh menempel ke form berikutnya.
  - [`removePhoto`](file://apps/web/src/components/PhotoUploader.tsx#L125-L129) (`apps/web/src/components/PhotoUploader.tsx:125-129`) [Tipe: `function`]
    - *Signature:* `(index: number)`
    - *Deskripsi:* // Unggahan yang selesai setelah form ditutup tidak boleh menempel ke form berikutnya.
  - [`PhotoUploader`](file://apps/web/src/components/PhotoUploader.tsx#L28-L196) (`apps/web/src/components/PhotoUploader.tsx:28-196`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  labels,
  disabled = false,
  onUploadError,
  onBusyChange,
}: {
  value: readonly PhotoUploadItem[];
  onChange: (photos: PhotoUploadItem[]) => void;
  labels: PhotoUploaderLabels;
  disabled?: boolean;
  onUploadError?: (error: Error) => void;
  /** Dipanggil saat unggahan mulai/selesai, supaya form induk menahan tombol simpan. */
  onBusyChange?: (busy: boolean) => void;
})`

### Sub-sistem: `clean:block:numinput` (Klaster #335)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stripLeadingZero`](file://apps/web/src/components/ui.tsx#L1659-L1664) (`apps/web/src/components/ui.tsx:1659-1664`) [Tipe: `function`]
    - *Signature:* `(v: string): string`
    - *Deskripsi:* /** Buang nol di depan agar tidak nyangkut: "0" → "" (user ketik ulang bersih),
 *  "007" → "7". Desimal ("0.5") tetap utuh. */
  - [`clean`](file://apps/web/src/components/ui.tsx#L1680-L1685) (`apps/web/src/components/ui.tsx:1680-1685`) [Tipe: `function`]
    - *Signature:* `(e: React.ChangeEvent<HTMLInputElement>)`
  - [`block`](file://apps/web/src/components/ui.tsx#L1669-L1679) (`apps/web/src/components/ui.tsx:1669-1679`) [Tipe: `function`]
    - *Signature:* `(e: ReactKeyboardEvent<HTMLInputElement>)`
  - [`NumInput`](file://apps/web/src/components/ui.tsx#L1668-L1695) (`apps/web/src/components/ui.tsx:1668-1695`) [Tipe: `function`]
    - *Signature:* `({ integer = false, allowNegative = false, onKeyDown, onChange, inputMode, ...rest }: InputHTMLAttributes<HTMLInputElement> & { integer?: boolean; allowNegative?: boolean })`

### Sub-sistem: `url:secure:absolut` (Klaster #338)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isBackendUrl`](file://apps/web/src/services/files.ts#L22-L24) (`apps/web/src/services/files.ts:22-24`) [Tipe: `function`]
    - *Signature:* `(url: string, base: string = BASE): boolean`
  - [`absUrl`](file://apps/web/src/components/ui.tsx#L1846-L1848) (`apps/web/src/components/ui.tsx:1846-1848`) [Tipe: `function`]
    - *Signature:* `(url: unknown): string`
  - [`loadSecureBlob`](file://apps/web/src/components/ui.tsx#L1856-L1874) (`apps/web/src/components/ui.tsx:1856-1874`) [Tipe: `function`]
    - *Signature:* `(raw: string): Promise<string>`
    - *Deskripsi:* /** Normalisasi URL lama relatif (/files/...) → absolut terhadap BASE backend.
 *  URL absolut / blob: / object-URL dikembalikan apa adanya. */
  - [`SecureImg`](file://apps/web/src/components/ui.tsx#L1878-L1932) (`apps/web/src/components/ui.tsx:1878-1932`) [Tipe: `function`]
    - *Signature:* `({
  src,
  alt,
  name,
  className = "",
}: {
  src?: unknown;
  alt: string;
  name?: string;
  className?: string;
})`

### Sub-sistem: `koleksi:replace:epoch` (Klaster #392)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`majorOf`](file://apps/web/src/data/store.tsx#L960-L966) (`apps/web/src/data/store.tsx:960-966`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number | null`
    - *Deskripsi:* /**
 * Koleksi mana yang tidak boleh di-replace apa adanya.
 *
 * True bila ada mutasi lokal selama request berjalan (epoch berubah) atau
 * koleksi menjadi dirty di tengah jalan (tulis offline belum terkirim).
 */
  - [`notifyVersionBlocked`](file://apps/web/src/data/store.tsx#L976-L989) (`apps/web/src/data/store.tsx:976-989`) [Tipe: `function`]
    - *Signature:* `(serverApi: string): void`
    - *Deskripsi:* /**
 * Koleksi mana yang tidak boleh di-replace apa adanya.
 *
 * True bila ada mutasi lokal selama request berjalan (epoch berubah) atau
 * koleksi menjadi dirty di tengah jalan (tulis offline belum terkirim).
 */
  - [`minorOf`](file://apps/web/src/data/store.tsx#L968-L974) (`apps/web/src/data/store.tsx:968-974`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number | null`
    - *Deskripsi:* /**
 * Koleksi mana yang tidak boleh di-replace apa adanya.
 *
 * True bila ada mutasi lokal selama request berjalan (epoch berubah) atau
 * koleksi menjadi dirty di tengah jalan (tulis offline belum terkirim).
 */
  - [`isApiCompatible`](file://apps/web/src/data/store.tsx#L1000-L1022) (`apps/web/src/data/store.tsx:1000-1022`) [Tipe: `function`]
    - *Signature:* `(): Promise<boolean>`
    - *Deskripsi:* /**
 * Koleksi mana yang tidak boleh di-replace apa adanya.
 *
 * True bila ada mutasi lokal selama request berjalan (epoch berubah) atau
 * koleksi menjadi dirty di tengah jalan (tulis offline belum terkirim).
 */

### Sub-sistem: `remote:poismultiitem:usepoactions` (Klaster #407)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`remote`](file://apps/web/src/data/usePoActions.ts#L49-L49) (`apps/web/src/data/usePoActions.ts:49-49`) [Tipe: `function`]
    - *Signature:* `()`
  - [`poIsMultiItem`](file://apps/web/src/data/usePoActions.ts#L21-L25) (`apps/web/src/data/usePoActions.ts:21-25`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): boolean`
  - [`prIdsOf`](file://apps/web/src/data/usePoActions.ts#L39-L40) (`apps/web/src/data/usePoActions.ts:39-40`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): string[]`
    - *Deskripsi:* /** Qty yang dinyatakan vendor tidak sanggup dan belum dialihkan. */
  - [`usePoActions`](file://apps/web/src/data/usePoActions.ts#L47-L302) (`apps/web/src/data/usePoActions.ts:47-302`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `delete:hapus:cache` (Klaster #466)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`deleteDateOf`](file://apps/web/src/utils/audit.ts#L58-L71) (`apps/web/src/utils/audit.ts:58-71`) [Tipe: `function`]
    - *Signature:* `(table: string, rowId: string): Promise<string | null>`
  - [`cacheKey`](file://apps/web/src/utils/audit.ts#L24-L24) (`apps/web/src/utils/audit.ts:24-24`) [Tipe: `function`]
    - *Signature:* `(table: string, rowId: string): string`
    - *Deskripsi:* /**
 * Reader "kapan baris ini dihapus" dari audit log.
 *
 * Penghapusan di sistem ini TETAP hard delete (keputusan client), jadi tanggal
 * hapus tidak ada di tabel utama - barisnya sudah hilang. Satu-satunya sumber
 * yang benar adalah `audit_log`, yang menyimpan `action=delete`, `table_name`,
 * `row_id`, dan payload pra-hapus.
 *
 * Endpoint `GET /api/audit` sudah ada sejak awal; yang ditambahkan di F0.5
 * hanya `?action=` dan `?rowId=` tepat, karena `?q=` yang substring akan salah
 * cocok: "INV-001" ikut cocok "INV-0012".
 */
  - [`fetchDeleteDate`](file://apps/web/src/utils/audit.ts#L36-L51) (`apps/web/src/utils/audit.ts:36-51`) [Tipe: `function`]
    - *Signature:* `(table: string, rowId: string): Promise<string | null>`
    - *Deskripsi:* /**
 * Kosongkan cache. WAJIB dipanggil setelah logout/ganti akun: cache bersifat
 * per-tab dan tidak tahu batas sesi, jadi tanpa ini user berikutnya di tab
 * yang sama bisa membaca tanggal hapus milik user sebelumnya.
 */
  - [`deleteDatesOf`](file://apps/web/src/utils/audit.ts#L77-L88) (`apps/web/src/utils/audit.ts:77-88`) [Tipe: `function`]
    - *Signature:* `(
  table: string,
  rowIds: readonly string[],
): Promise<Record<string, string | null>>`

### Sub-sistem: `dead:legacynoteof:penjelasan` (Klaster #478)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`legacyNoteOf`](file://apps/web/src/utils/deadStock.ts#L228-L234) (`apps/web/src/utils/deadStock.ts:228-234`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem): string`
    - *Deskripsi:* /** Field `deadReason` versi lama mungkin sudah berisi kalimat penjelasan. */
  - [`deadReasonOf`](file://apps/web/src/utils/deadStock.ts#L138-L141) (`apps/web/src/utils/deadStock.ts:138-141`) [Tipe: `function`]
    - *Signature:* `(code: string | null | undefined): DeadReason`
  - [`deadCodeOf`](file://apps/web/src/utils/deadStock.ts#L147-L158) (`apps/web/src/utils/deadStock.ts:147-158`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem, derived: string): string`
  - [`deadStockRows`](file://apps/web/src/utils/deadStock.ts#L202-L225) (`apps/web/src/utils/deadStock.ts:202-225`) [Tipe: `function`]
    - *Signature:* `(
  inventory: StoreItem[],
  ctx: { hasOut: (item: StoreItem) => boolean; daysSinceLastOut: (item: StoreItem) => number },
): DeadStockRow[]`

### Sub-sistem: `fmt:yyyy:iso` (Klaster #491)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseISO`](file://apps/web/src/utils/format.ts#L8-L13) (`apps/web/src/utils/format.ts:8-13`) [Tipe: `function`]
    - *Signature:* `(v: string | null | undefined): { y: string; m: string; d: string } | null`
    - *Deskripsi:* // Data mentah tetap ISO (YYYY-MM-DD / YYYY-MM / "-"), UI selalu lokal id-ID.
  - [`fmtTanggal`](file://apps/web/src/utils/format.ts#L16-L23) (`apps/web/src/utils/format.ts:16-23`) [Tipe: `function`]
    - *Signature:* `(v: string | null | undefined): string`
  - [`fmtBulan`](file://apps/web/src/utils/format.ts#L42-L46) (`apps/web/src/utils/format.ts:42-46`) [Tipe: `function`]
    - *Signature:* `(v: string | null | undefined): string`
  - [`fmtRentang`](file://apps/web/src/utils/format.ts#L49-L59) (`apps/web/src/utils/format.ts:49-59`) [Tipe: `function`]
    - *Signature:* `(a: string | null | undefined, b: string | null | undefined): string`

### Sub-sistem: `warn:warnrankof:warnlevelof` (Klaster #498)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`warnLevelOf`](file://apps/web/src/utils/inventoryWarn.ts#L153-L179) (`apps/web/src/utils/inventoryWarn.ts:153-179`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem, warehouse?: string): WarnTone`
  - [`warnRankOf`](file://apps/web/src/utils/inventoryWarn.ts#L303-L312) (`apps/web/src/utils/inventoryWarn.ts:303-312`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem, warehouse?: string): number`
  - [`katalogBadge`](file://apps/web/src/utils/inventoryWarn.ts#L292-L295) (`apps/web/src/utils/inventoryWarn.ts:292-295`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem): { tone: WarnTone["tone"]; text: string; textEn: string }`
  - [`needsAction`](file://apps/web/src/utils/inventoryWarn.ts#L182-L185) (`apps/web/src/utils/inventoryWarn.ts:182-185`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem, warehouse?: string): boolean`

### Sub-sistem: `blank:stable:comparestabletiebreaker` (Klaster #502)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stableSortRows`](file://apps/web/src/utils/listPersistence.ts#L41-L64) (`apps/web/src/utils/listPersistence.ts:41-64`) [Tipe: `function`]
    - *Signature:* `(
  rows: T[],
  sort: SortState,
  get: (row: T, key: string) => string | number | null | undefined,
): T[]`
  - [`blank`](file://apps/web/src/utils/listPersistence.ts#L49-L49) (`apps/web/src/utils/listPersistence.ts:49-49`) [Tipe: `function`]
    - *Signature:* `(v: string | number | null | undefined): boolean`
  - [`compareStableTieBreaker`](file://apps/web/src/utils/listPersistence.ts#L27-L35) (`apps/web/src/utils/listPersistence.ts:27-35`) [Tipe: `function`]
    - *Signature:* `(a: T, b: T): number`
  - [`reconcileListAfterEdit`](file://apps/web/src/utils/listPersistence.ts#L78-L128) (`apps/web/src/utils/listPersistence.ts:78-128`) [Tipe: `function`]
    - *Signature:* `(params: {
  prevList: T[];
  updatedItem: T;
  currentPage: number;
  pageSize: number;
  sort: SortState;
  getSortValue: (row: T, key: string) => string | number | null | undefined;
  filterPredicate?: (row: T) => boolean;
}): ReconcileResult`

### Sub-sistem: `boq:task:progress` (Klaster #543)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`calcProjectProgress`](file://apps/web/src/utils/projectProgress.ts#L38-L78) (`apps/web/src/utils/projectProgress.ts:38-78`) [Tipe: `function`]
    - *Signature:* `(
  wbs: readonly WbsItem[] | undefined | null,
  options?: CalcProgressOptions | StoreItem[],
): number`
  - [`matchBoqToTask`](file://apps/web/src/utils/projectProgress.ts#L13-L20) (`apps/web/src/utils/projectProgress.ts:13-20`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem, taskName: string): boolean`
    - *Deskripsi:* /**
 * Mencocokkan item BoQ dengan task WBS berdasarkan kesamaan nama atau referensi task.
 */
  - [`boqItemValue`](file://apps/web/src/utils/projectProgress.ts#L25-L30) (`apps/web/src/utils/projectProgress.ts:25-30`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem): number`
    - *Deskripsi:* /**
 * Menghitung nilai rupiah item BoQ.
 */
  - [`projectProgressOf`](file://apps/web/src/utils/projectProgress.ts#L84-L96) (`apps/web/src/utils/projectProgress.ts:84-96`) [Tipe: `function`]
    - *Signature:* `(
  project: StoreItem,
  wbsByProject?: Record<string, WbsItem[]>,
  boqList?: StoreItem[],
): number`

### Sub-sistem: `impact:hari:wbs` (Klaster #550)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`existingId`](file://apps/web/src/utils/riskAuto.ts#L88-L97) (`apps/web/src/utils/riskAuto.ts:88-97`) [Tipe: `function`]
    - *Signature:* `(
  existing: readonly StoreItem[],
  source: "WBS" | "WO",
  wbsTask: string,
): string | null`
    - *Deskripsi:* /** ID risiko yang terkait dengan source+wbsTask tertentu. */
  - [`impactFromWeight`](file://apps/web/src/utils/riskAuto.ts#L70-L74) (`apps/web/src/utils/riskAuto.ts:70-74`) [Tipe: `function`]
    - *Signature:* `(weight: number): "Rendah" | "Sedang" | "Tinggi"`
    - *Deskripsi:* /** Impact berdasarkan bobot WBS atau persentase milestone WO. */
  - [`daysUntilMonthEnd`](file://apps/web/src/utils/riskAuto.ts#L43-L49) (`apps/web/src/utils/riskAuto.ts:43-49`) [Tipe: `function`]
    - *Signature:* `(month: string, today: string): number | null`
    - *Deskripsi:* /** Selisih hari dari hari ini ke akhir bulan `YYYY-MM`; negatif = lewat. */
  - [`generateRisksFromWbs`](file://apps/web/src/utils/riskAuto.ts#L119-L190) (`apps/web/src/utils/riskAuto.ts:119-190`) [Tipe: `function`]
    - *Signature:* `(
  projectId: string,
  wbs: readonly WbsTaskLike[],
  existingRisks: readonly StoreItem[],
  today: string,
  milestoneDays: number,
): RiskAutoResult`

### Sub-sistem: `likelihood:hari:selisih` (Klaster #551)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`likelihoodFromDays`](file://apps/web/src/utils/riskAuto.ts#L63-L67) (`apps/web/src/utils/riskAuto.ts:63-67`) [Tipe: `function`]
    - *Signature:* `(days: number): "Rendah" | "Sedang" | "Tinggi"`
    - *Deskripsi:* /** Likelihood berdasarkan selisih hari ke jatuh tempo. */
  - [`hasExisting`](file://apps/web/src/utils/riskAuto.ts#L77-L85) (`apps/web/src/utils/riskAuto.ts:77-85`) [Tipe: `function`]
    - *Signature:* `(
  existing: readonly StoreItem[],
  source: "WBS" | "WO",
  wbsTask: string,
): boolean`
    - *Deskripsi:* /** Deduplikasi: apakah risiko dengan source+wbsTask yang sama sudah ada? */
  - [`daysUntilDate`](file://apps/web/src/utils/riskAuto.ts#L52-L60) (`apps/web/src/utils/riskAuto.ts:52-60`) [Tipe: `function`]
    - *Signature:* `(date: string, today: string): number | null`
    - *Deskripsi:* /** Selisih hari dari hari ini ke tanggal `YYYY-MM-DD`; negatif = lewat. */
  - [`generateRisksFromWo`](file://apps/web/src/utils/riskAuto.ts#L202-L271) (`apps/web/src/utils/riskAuto.ts:202-271`) [Tipe: `function`]
    - *Signature:* `(
  projectId: string,
  wos: readonly StoreItem[],
  existingRisks: readonly StoreItem[],
  today: string,
  milestoneDays: number,
): RiskAutoResult`

### Sub-sistem: `jam:cmpjam:jamof` (Klaster #572)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toMinutes`](file://apps/web/src/utils/time24.ts#L49-L53) (`apps/web/src/utils/time24.ts:49-53`) [Tipe: `function`]
    - *Signature:* `(t: unknown): number | null`
  - [`cmpJam`](file://apps/web/src/utils/time24.ts#L56-L61) (`apps/web/src/utils/time24.ts:56-61`) [Tipe: `function`]
    - *Signature:* `(a: unknown, b: unknown): number | null`
  - [`durasiJam`](file://apps/web/src/utils/time24.ts#L94-L100) (`apps/web/src/utils/time24.ts:94-100`) [Tipe: `function`]
    - *Signature:* `(mulai: unknown, selesai: unknown): number`
  - [`jamOf`](file://apps/web/src/utils/time24.ts#L103-L106) (`apps/web/src/utils/time24.ts:103-106`) [Tipe: `function`]
    - *Signature:* `(t: unknown): number | null`

### Sub-sistem: `created:rekam:tabel` (Klaster #575)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isStamp`](file://apps/web/src/utils/timestamps.ts#L17-L19) (`apps/web/src/utils/timestamps.ts:17-19`) [Tipe: `function`]
    - *Signature:* `(v: unknown): v is string`
    - *Deskripsi:* /**
 * Satu-satunya sumber nama field tanggal rekam. Dipakai store saat menulis,
 * tabel saat menampilkan, dan probe saat memverifikasi.
 *
 * Kenapa BUKAN kolom `created_at` di SQL: setiap tabel hanya punya
 * `id, branch, data, updated_at`, dan seluruh isi rekam disimpan sebagai JSON
 * di kolom `data`. Menambah kolom berarti ALTER di ~25 tabel untuk data yang
 * sebenarnya sudah muat di dalam `data` - dan `updated_at` yang ada sekarang
 * tidak bisa dipakai karena nilainya ditimpa setiap PATCH (hanya concurrency
 * token, bukan "terakhir diubah").
 */
  - [`createdAtOf`](file://apps/web/src/utils/timestamps.ts#L58-L60) (`apps/web/src/utils/timestamps.ts:58-60`) [Tipe: `function`]
    - *Signature:* `(row: Record<string, unknown> | null | undefined): string | null`
  - [`createdAtRaw`](file://apps/web/src/utils/timestamps.ts#L63-L66) (`apps/web/src/utils/timestamps.ts:63-66`) [Tipe: `function`]
    - *Signature:* `(row: Record<string, unknown> | null | undefined): string | null`
  - [`stampCreated`](file://apps/web/src/utils/timestamps.ts#L84-L88) (`apps/web/src/utils/timestamps.ts:84-88`) [Tipe: `function`]
    - *Signature:* `(row: T): T`

### Sub-sistem: `category:purchase:per` (Klaster #582)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalizedCategory`](file://apps/web/src/utils/unitConversion.ts#L69-L71) (`apps/web/src/utils/unitConversion.ts:69-71`) [Tipe: `function`]
    - *Signature:* `(value: unknown): string`
    - *Deskripsi:* /** Satuan dasar yang lazim untuk kemasan tanpa aturan kategori: roll dikeluarkan
 *  per meter, drum/galon/kaleng per liter. Dipakai sebagai isian awal. */
  - [`conversionRuleForCategory`](file://apps/web/src/utils/unitConversion.ts#L83-L85) (`apps/web/src/utils/unitConversion.ts:83-85`) [Tipe: `function`]
    - *Signature:* `(category: unknown): UnitConversionRule | null`
  - [`purchaseUnitsForCategory`](file://apps/web/src/utils/unitConversion.ts#L87-L95) (`apps/web/src/utils/unitConversion.ts:87-95`) [Tipe: `function`]
    - *Signature:* `(category: unknown, currentUnit = ""): string[]`
  - [`defaultPurchaseUnitForCategory`](file://apps/web/src/utils/unitConversion.ts#L97-L102) (`apps/web/src/utils/unitConversion.ts:97-102`) [Tipe: `function`]
    - *Signature:* `(category: unknown, currentUnit: string): string`

### Sub-sistem: `required:unit:conversion` (Klaster #583)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`hasUnitConversionDraft`](file://apps/web/src/utils/unitConversion.ts#L104-L113) (`apps/web/src/utils/unitConversion.ts:104-113`) [Tipe: `function`]
    - *Signature:* `(draft: UnitConversionDraft): boolean`
  - [`eceranEnabled`](file://apps/web/src/utils/unitConversion.ts#L132-L134) (`apps/web/src/utils/unitConversion.ts:132-134`) [Tipe: `function`]
    - *Signature:* `(value: unknown): boolean`
    - *Deskripsi:* /** Satuan dasar yang lazim untuk kemasan tanpa aturan kategori: roll dikeluarkan
 *  per meter, drum/galon/kaleng per liter. Dipakai sebagai isian awal. */
  - [`unitConversionRequired`](file://apps/web/src/utils/unitConversion.ts#L115-L121) (`apps/web/src/utils/unitConversion.ts:115-121`) [Tipe: `function`]
    - *Signature:* `(
  category: unknown,
  eceran: boolean,
  draft: UnitConversionDraft,
): boolean`
  - [`unitConversionRequiredForEdit`](file://apps/web/src/utils/unitConversion.ts#L137-L159) (`apps/web/src/utils/unitConversion.ts:137-159`) [Tipe: `function`]
    - *Signature:* `(
  category: unknown,
  purchaseUnit: string,
  eceran: boolean,
  draft: UnitConversionDraft,
  existing?: ExistingUnitConversionState | null,
): boolean`

### Sub-sistem: `movement:movementfromwh:movementflow` (Klaster #595)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`movementFlow`](file://apps/web/src/utils/warehouse.ts#L214-L262) (`apps/web/src/utils/warehouse.ts:214-262`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem): MovementWarehouseFlow`
  - [`movementTouchesWh`](file://apps/web/src/utils/warehouse.ts#L274-L278) (`apps/web/src/utils/warehouse.ts:274-278`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem, wh: string): boolean`
  - [`movementFromWh`](file://apps/web/src/utils/warehouse.ts#L265-L267) (`apps/web/src/utils/warehouse.ts:265-267`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem): string`
  - [`movementToWh`](file://apps/web/src/utils/warehouse.ts#L269-L271) (`apps/web/src/utils/warehouse.ts:269-271`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem): string`

### Sub-sistem: `push:milestone:womilestonebytitle` (Klaster #598)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`push`](file://apps/web/src/utils/woMilestones.ts#L120-L125) (`apps/web/src/utils/woMilestones.ts:120-125`) [Tipe: `function`]
    - *Signature:* `(m: WoMilestone): void`
  - [`woMilestonesOf`](file://apps/web/src/utils/woMilestones.ts#L32-L53) (`apps/web/src/utils/woMilestones.ts:32-53`) [Tipe: `function`]
    - *Signature:* `(wo: StoreItem | null | undefined): WoMilestone[]`
  - [`terminMilestoneOptions`](file://apps/web/src/utils/woMilestones.ts#L114-L136) (`apps/web/src/utils/woMilestones.ts:114-136`) [Tipe: `function`]
    - *Signature:* `(
  sub: StoreItem | null | undefined,
  wo: StoreItem | null | undefined,
): WoMilestone[]`
  - [`woMilestoneByTitle`](file://apps/web/src/utils/woMilestones.ts#L102-L104) (`apps/web/src/utils/woMilestones.ts:102-104`) [Tipe: `function`]
    - *Signature:* `(wo: StoreItem | null | undefined, title: string): WoMilestone | undefined`

### Sub-sistem: `cabang:load:laporan` (Klaster #642)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadMany`](file://services/api/src/pdf/documents/shared.ts#L223-L241) (`services/api/src/pdf/documents/shared.ts:223-241`) [Tipe: `function`]
    - *Signature:* `(
  spec: RowSpec,
  opts: { ids?: string[]; branch?: string } = {},
): Promise<Record<string, unknown>[]>`
  - [`inCtx`](file://services/api/src/pdf/registry.ts#L77-L83) (`services/api/src/pdf/registry.ts:77-83`) [Tipe: `function`]
    - *Signature:* `(ctx: RenderContext, rows: Record<string, unknown>[]): Record<string, unknown>[]`
    - *Deskripsi:* /** Batasi baris ke cabang; "SEMUA" berarti seluruh cabang. */
  - [`loadAll`](file://services/api/src/pdf/registry.ts#L976-L978) (`services/api/src/pdf/registry.ts:976-978`) [Tipe: `function`]
    - *Signature:* `(field: string): Promise<Record<string, unknown>[]>`
    - *Deskripsi:* /** Muat satu koleksi penuh untuk agregasi laporan. */
  - [`loadReportCols`](file://services/api/src/pdf/registry.ts#L981-L987) (`services/api/src/pdf/registry.ts:981-987`) [Tipe: `function`]
    - *Signature:* `(ctx: RenderContext, fields: string[]): Promise<Collections>`
    - *Deskripsi:* /** Koleksi laporan + penyaring cabang. */

### Sub-sistem: `parse:registerauditroutes:parsediff` (Klaster #668)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseLimit`](file://services/api/src/routes/audit.ts#L18-L22) (`services/api/src/routes/audit.ts:18-22`) [Tipe: `function`]
    - *Signature:* `(raw: unknown): number`
  - [`parseDiff`](file://services/api/src/routes/audit.ts#L30-L36) (`services/api/src/routes/audit.ts:30-36`) [Tipe: `function`]
    - *Signature:* `(raw: string): unknown`
  - [`parseOffset`](file://services/api/src/routes/audit.ts#L24-L28) (`services/api/src/routes/audit.ts:24-28`) [Tipe: `function`]
    - *Signature:* `(raw: unknown): number`
  - [`registerAuditRoutes`](file://services/api/src/routes/audit.ts#L38-L92) (`services/api/src/routes/audit.ts:38-92`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `parsial:divalidasi:sengaja` (Klaster #673)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`drydockDay`](file://services/api/src/routes/crud.ts#L263-L268) (`services/api/src/routes/crud.ts:263-268`) [Tipe: `function`]
    - *Signature:* `(value: unknown): number | null`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).
  - [`witaTodayDay`](file://services/api/src/routes/crud.ts#L270-L275) (`services/api/src/routes/crud.ts:270-275`) [Tipe: `function`]
    - *Signature:* `(): number`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).
  - [`drydockDateError`](file://services/api/src/routes/crud.ts#L277-L287) (`services/api/src/routes/crud.ts:277-287`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>): string | null`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).
  - [`normalizeDrydockOffsets`](file://services/api/src/routes/crud.ts#L301-L307) (`services/api/src/routes/crud.ts:301-307`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>): Record<string, unknown>`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).

### Sub-sistem: `demo:switch:enabled` (Klaster #679)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`flagOn`](file://services/api/src/routes/demoSwitch.ts#L25-L28) (`services/api/src/routes/demoSwitch.ts:25-28`) [Tipe: `function`]
    - *Signature:* `(name: string): boolean`
  - [`demoSwitchEnabled`](file://services/api/src/routes/demoSwitch.ts#L29-L31) (`services/api/src/routes/demoSwitch.ts:29-31`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`demoLoginEnabled`](file://services/api/src/routes/demoSwitch.ts#L83-L85) (`services/api/src/routes/demoSwitch.ts:83-85`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`registerDemoSwitchRoutes`](file://services/api/src/routes/demoSwitch.ts#L88-L136) (`services/api/src/routes/demoSwitch.ts:88-136`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `menyentuh:command:temp` (Klaster #682)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`runOcr`](file://services/api/src/routes/ocr.ts#L41-L56) (`services/api/src/routes/ocr.ts:41-56`) [Tipe: `function`]
    - *Signature:* `(png: Buffer, ext: string): Promise<string>`
    - *Deskripsi:* // tak pernah menyentuh command line; file temp selalu dihapus.
  - [`tesseractAvailable`](file://services/api/src/routes/ocr.ts#L35-L39) (`services/api/src/routes/ocr.ts:35-39`) [Tipe: `function`]
    - *Signature:* `(): Promise<boolean>`
    - *Deskripsi:* // tak pernah menyentuh command line; file temp selalu dihapus.
  - [`extOf`](file://services/api/src/routes/ocr.ts#L30-L33) (`services/api/src/routes/ocr.ts:30-33`) [Tipe: `function`]
    - *Signature:* `(name: string): string`
    - *Deskripsi:* // tak pernah menyentuh command line; file temp selalu dihapus.
  - [`registerOcrRoutes`](file://services/api/src/routes/ocr.ts#L58-L114) (`services/api/src/routes/ocr.ts:58-114`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `token:0019:berisi` (Klaster #689)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`setValue`](file://services/api/src/routes/publicLeave.ts#L54-L58) (`services/api/src/routes/publicLeave.ts:54-58`) [Tipe: `function`]
    - *Signature:* `(key: string, value: string): Promise<void>`
    - *Deskripsi:* // Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.
  - [`activeEmployee`](file://services/api/src/routes/publicLeave.ts#L85-L95) (`services/api/src/routes/publicLeave.ts:85-95`) [Tipe: `function`]
    - *Signature:* `(nik: string): Promise<{ id: string; branch: string; d: Record<string, unknown> } | null>`
    - *Deskripsi:* /** Baris `qr:token`: JSON berisi hash (baru) atau token polos (sebelum ADR-0019). */
  - [`issueQr`](file://services/api/src/routes/publicLeave.ts#L79-L84) (`services/api/src/routes/publicLeave.ts:79-84`) [Tipe: `function`]
    - *Signature:* `(actor: string): Promise<{ token: string; meta: Omit<QrRecord, "hash"> }>`
    - *Deskripsi:* /** Baris `qr:token`: JSON berisi hash (baru) atau token polos (sebelum ADR-0019). */
  - [`registerPublicLeaveRoutes`](file://services/api/src/routes/publicLeave.ts#L114-L203) (`services/api/src/routes/publicLeave.ts:114-203`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `csv:register:deviceimport` (Klaster #706)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`register`](file://apps/web/src/pages/absensi/DeviceImport.tsx#L51-L57) (`apps/web/src/pages/absensi/DeviceImport.tsx:51-57`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`importCsv`](file://apps/web/src/pages/absensi/DeviceImport.tsx#L35-L49) (`apps/web/src/pages/absensi/DeviceImport.tsx:35-49`) [Tipe: `function`]
    - *Signature:* `(file: File): Promise<void>`
  - [`parsePunchCsv`](file://apps/web/src/pages/absensi/DeviceImport.tsx#L15-L25) (`apps/web/src/pages/absensi/DeviceImport.tsx:15-25`) [Tipe: `function`]
    - *Signature:* `(text: string): Punch[]`
  - [`DeviceImport`](file://apps/web/src/pages/absensi/DeviceImport.tsx#L27-L72) (`apps/web/src/pages/absensi/DeviceImport.tsx:27-72`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `tick:start:scanmodal` (Klaster #742)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`start`](file://apps/web/src/pages/inventori/Inventory.tsx#L204-L243) (`apps/web/src/pages/inventori/Inventory.tsx:204-243`) [Tipe: `function`]
    - *Signature:* `()`
  - [`tick`](file://apps/web/src/pages/inventori/Inventory.tsx#L222-L238) (`apps/web/src/pages/inventori/Inventory.tsx:222-238`) [Tipe: `function`]
    - *Signature:* `()`
  - [`getBarcodeDetector`](file://apps/web/src/pages/inventori/Inventory.tsx#L183-L185) (`apps/web/src/pages/inventori/Inventory.tsx:183-185`) [Tipe: `function`]
    - *Signature:* `(): BarcodeDetectorCtor | undefined`
  - [`ScanModal`](file://apps/web/src/pages/inventori/Inventory.tsx#L188-L266) (`apps/web/src/pages/inventori/Inventory.tsx:188-266`) [Tipe: `function`]
    - *Signature:* `({ onDetect, onClose }: { onDetect: (value: string) => void; onClose: () => void })`

### Sub-sistem: `thumbs:wbstree:phaseof` (Klaster #814)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`thumbs`](file://apps/web/src/pages/proyek/WbsTree.tsx#L43-L52) (`apps/web/src/pages/proyek/WbsTree.tsx:43-52`) [Tipe: `function`]
    - *Signature:* `(photos: Photo[], label: string)`
  - [`taskNode`](file://apps/web/src/pages/proyek/WbsTree.tsx#L61-L96) (`apps/web/src/pages/proyek/WbsTree.tsx:61-96`) [Tipe: `function`]
    - *Signature:* `(w: WbsItem): FlowNode`
  - [`phaseOf`](file://apps/web/src/pages/proyek/WbsTree.tsx#L33-L36) (`apps/web/src/pages/proyek/WbsTree.tsx:33-36`) [Tipe: `function`]
    - *Signature:* `(task: string): string`
    - *Deskripsi:* /** Fase = bagian nama sebelum " — " / " - "; pekerjaan tanpa pemisah jadi fasenya sendiri. */
  - [`WbsTree`](file://apps/web/src/pages/proyek/WbsTree.tsx#L38-L121) (`apps/web/src/pages/proyek/WbsTree.tsx:38-121`) [Tipe: `function`]
    - *Signature:* `({ wbs }: { wbs: WbsItem[] })`

### Sub-sistem: `coa:buildcoatree:setlevels` (Klaster #878)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`setLevels`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L134-L139) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:134-139`) [Tipe: `function`]
    - *Signature:* `(node: CoaTreeNode, lvl: number)`
  - [`resolveParentKode`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L47-L95) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:47-95`) [Tipe: `function`]
    - *Signature:* `(kode: string, allKodes: Set<string>): string | null`
  - [`determineCoaType`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L31-L44) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:31-44`) [Tipe: `function`]
    - *Signature:* `(kode: string, dk: string, nrlr: string): string`
  - [`buildCoaTree`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L98-L144) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:98-144`) [Tipe: `function`]
    - *Signature:* `(rows: StoreItem[]): CoaTreeNode[]`

### Sub-sistem: `walk:mark:envvars` (Klaster #887)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mark`](file://services/api/scripts/gen-bruno.ts#L77-L77) (`services/api/scripts/gen-bruno.ts:77-77`) [Tipe: `function`]
    - *Signature:* `(method: string, path: string): void`
  - [`walk`](file://services/api/scripts/gen-bruno.ts#L137-L146) (`services/api/scripts/gen-bruno.ts:137-146`) [Tipe: `function`]
    - *Signature:* `(d: string, rel = ""): void`
  - [`envVars`](file://services/api/scripts/gen-bruno.ts#L72-L72) (`services/api/scripts/gen-bruno.ts:72-72`) [Tipe: `function`]
    - *Signature:* `(base: string): string`
  - [`main`](file://services/api/scripts/gen-bruno.ts#L51-L164) (`services/api/scripts/gen-bruno.ts:51-164`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `call:parse:main` (Klaster #889)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parse`](file://services/api/scripts/relations-probe.ts#L32-L32) (`services/api/scripts/relations-probe.ts:32-32`) [Tipe: `function`]
    - *Signature:* `(d: string): Record<string, unknown>`
  - [`assert`](file://services/api/scripts/relations-probe.ts#L16-L19) (`services/api/scripts/relations-probe.ts:16-19`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`call`](file://services/api/scripts/relations-probe.ts#L25-L26) (`services/api/scripts/relations-probe.ts:25-26`) [Tipe: `function`]
    - *Signature:* `(method: "GET" | "POST" | "DELETE", url: string, payload?: unknown)`
  - [`main`](file://services/api/scripts/relations-probe.ts#L11-L96) (`services/api/scripts/relations-probe.ts:11-96`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `payable:ensurepayableonapproval:pokeyof` (Klaster #891)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`poKeyOf`](file://services/api/src/poPayable.ts#L21-L24) (`services/api/src/poPayable.ts:21-24`) [Tipe: `function`]
    - *Signature:* `(id: string, po: Data): string`
  - [`payableOf`](file://services/api/src/poPayable.ts#L26-L33) (`services/api/src/poPayable.ts:26-33`) [Tipe: `function`]
    - *Signature:* `(id: string, po: Data): Promise<{ id: string; data: Data; updated_at: string } | null>`
  - [`addDays`](file://services/api/src/poPayable.ts#L35-L38) (`services/api/src/poPayable.ts:35-38`) [Tipe: `function`]
    - *Signature:* `(iso: string, days: number): string`
  - [`ensurePayableOnApproval`](file://services/api/src/poPayable.ts#L41-L59) (`services/api/src/poPayable.ts:41-59`) [Tipe: `function`]
    - *Signature:* `(id: string, before: Data, after: Data, actor: string, ip?: string): Promise<string | null>`

### Sub-sistem: `xml:text:readxlsxrows` (Klaster #905)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`readXlsxRows`](file://apps/web/src/utils/readSheet.ts#L64-L91) (`apps/web/src/utils/readSheet.ts:64-91`) [Tipe: `function`]
    - *Signature:* `(buf: ArrayBuffer): Promise<string[][]>`
  - [`decodeXml`](file://apps/web/src/utils/readSheet.ts#L46-L50) (`apps/web/src/utils/readSheet.ts:46-50`) [Tipe: `function`]
    - *Signature:* `(s: string): string`
    - *Deskripsi:* /** Isi file di dalam zip, berdasarkan nama. */
  - [`colIndex`](file://apps/web/src/utils/readSheet.ts#L57-L62) (`apps/web/src/utils/readSheet.ts:57-62`) [Tipe: `function`]
    - *Signature:* `(ref: string): number`
    - *Deskripsi:* /** "B12" → 1 (indeks kolom 0-based). */
  - [`textOf`](file://apps/web/src/utils/readSheet.ts#L53-L54) (`apps/web/src/utils/readSheet.ts:53-54`) [Tipe: `function`]
    - *Signature:* `(xml: string): string`
    - *Deskripsi:* /** Teks dari semua <t> di dalam potongan XML (rich text dipecah per run). */

### Sub-sistem: `related:listwhere:getrow` (Klaster #910)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`listWhere`](file://services/api/src/routes/relations.ts#L68-L69) (`services/api/src/routes/relations.ts:68-69`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest, table: string, field: string, value: string)`
  - [`getRow`](file://services/api/src/routes/relations.ts#L66-L67) (`services/api/src/routes/relations.ts:66-67`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest, table: string, id: string)`
  - [`authOf`](file://services/api/src/routes/relations.ts#L62-L63) (`services/api/src/routes/relations.ts:62-63`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest): Record<string, string>`
    - *Deskripsi:* /** Relasi yang merujuk `table` (dipakai /related dan POST related). */
  - [`registerRelations`](file://services/api/src/routes/relations.ts#L65-L156) (`services/api/src/routes/relations.ts:65-156`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `dirname:normalize:resolve` (Klaster #911)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalize`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L19-L27) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:19-27`) [Tipe: `function`]
    - *Signature:* `(path: string): string`
  - [`existsSync`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L31-L31) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:31-31`) [Tipe: `function`]
    - *Signature:* `(p: string): boolean`
  - [`dirname`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L30-L30) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:30-30`) [Tipe: `function`]
    - *Signature:* `(p: string): string`
  - [`resolve`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L44-L49) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:44-49`) [Tipe: `function`]
    - *Signature:* `(from: string, spec: string): string | null`

### Sub-sistem: `literal:impor:fungsi` (Klaster #912)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`read`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L29-L29) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:29-29`) [Tipe: `function`]
    - *Signature:* `(p: string): string`
  - [`listIn`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L37-L40) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:37-40`) [Tipe: `function`]
    - *Signature:* `(src: string, name: string): string[] | null`
  - [`usedBy`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L65-L85) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:65-85`) [Tipe: `function`]
    - *Signature:* `(page: string): Map<string, Set<string>>`
    - *Deskripsi:* /** Daftar koleksi yang di-sync halaman (literal lokal, impor, atau fungsi per-tab Keuangan). */
  - [`syncedBy`](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L52-L63) (`apps/web/src/data/__tests__/moduleSyncCoverage.test.ts:52-63`) [Tipe: `function`]
    - *Signature:* `(page: string, src: string): Set<string>`
    - *Deskripsi:* /** Daftar koleksi yang di-sync halaman (literal lokal, impor, atau fungsi per-tab Keuangan). */

### Sub-sistem: `init:iso:dockplancard` (Klaster #914)
- **Kepadatan Simbol:** 4 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`init`](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L24-L24) (`apps/web/src/pages/proyek/DockPlanCard.tsx:24-24`) [Tipe: `function`]
    - *Signature:* `()`
  - [`save`](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L32-L43) (`apps/web/src/pages/proyek/DockPlanCard.tsx:32-43`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* // eslint-disable-line react-hooks/exhaustive-deps
  - [`iso`](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L19-L19) (`apps/web/src/pages/proyek/DockPlanCard.tsx:19-19`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string`
  - [`DockPlanCard`](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L21-L80) (`apps/web/src/pages/proyek/DockPlanCard.tsx:21-80`) [Tipe: `function`]
    - *Signature:* `({ project, drydocks, canEdit, onSave }: Props)`

### Sub-sistem: `observe:apply:installicontooltips` (Klaster #885)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`apply`](file://apps/web/src/utils/iconTooltips.ts#L12-L18) (`apps/web/src/utils/iconTooltips.ts:12-18`) [Tipe: `function`]
    - *Signature:* `(root: ParentNode): void`
  - [`observe`](file://apps/web/scripts/browser-shims.ts#L59-L59) (`apps/web/scripts/browser-shims.ts:59-59`) [Tipe: `method`]
    - *Signature:* `()`
  - [`installIconTooltips`](file://apps/web/src/utils/iconTooltips.ts#L20-L30) (`apps/web/src/utils/iconTooltips.ts:20-30`) [Tipe: `function`]
    - *Signature:* `(): void`

### Sub-sistem: `cleanup:0003:main` (Klaster #64)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/branch-scope-probe.ts#L30-L39) (`services/api/scripts/branch-scope-probe.ts:30-39`) [Tipe: `function`]
    - *Signature:* `(name: string, ok: boolean, details?: string)`
  - [`cleanup`](file://services/api/scripts/branch-scope-probe.ts#L343-L350) (`services/api/scripts/branch-scope-probe.ts:343-350`) [Tipe: `function`]
    - *Signature:* `(sql: string, params: unknown[])`
  - [`main`](file://services/api/scripts/branch-scope-probe.ts#L7-L367) (`services/api/scripts/branch-scope-probe.ts:7-367`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Security Probe: Scope Cabang di Server (F2-06 / ADR-0003 Jalur A)

### Sub-sistem: `patch:main:assert` (Klaster #68)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`patch`](file://services/api/scripts/concurrency-probe.ts#L20-L20) (`services/api/scripts/concurrency-probe.ts:20-20`) [Tipe: `function`]
    - *Signature:* `(note: string, baseUpdatedAt?: string)`
  - [`assert`](file://services/api/scripts/concurrency-probe.ts#L12-L15) (`services/api/scripts/concurrency-probe.ts:12-15`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`main`](file://services/api/scripts/concurrency-probe.ts#L7-L46) (`services/api/scripts/concurrency-probe.ts:7-46`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `loan:main:assert` (Klaster #74)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loan`](file://services/api/scripts/equipment-loan-probe.ts#L21-L25) (`services/api/scripts/equipment-loan-probe.ts:21-25`) [Tipe: `function`]
    - *Signature:* `(startDate: string, endDate: string)`
  - [`assert`](file://services/api/scripts/equipment-loan-probe.ts#L12-L15) (`services/api/scripts/equipment-loan-probe.ts:12-15`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`main`](file://services/api/scripts/equipment-loan-probe.ts#L7-L48) (`services/api/scripts/equipment-loan-probe.ts:7-48`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `main:assert:headersfor` (Klaster #76)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/files-privacy-probe.ts#L11-L14) (`services/api/scripts/files-privacy-probe.ts:11-14`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`headersFor`](file://services/api/scripts/files-privacy-probe.ts#L15-L18) (`services/api/scripts/files-privacy-probe.ts:15-18`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<{ authorization: string }>`
  - [`main`](file://services/api/scripts/files-privacy-probe.ts#L6-L50) (`services/api/scripts/files-privacy-probe.ts:6-50`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `runhelperchecks:main:helper` (Klaster #81)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/inventory-conversion-probe.ts#L14-L21) (`services/api/scripts/inventory-conversion-probe.ts:14-21`) [Tipe: `function`]
    - *Signature:* `(name: string, condition: boolean, detail = ""): void`
  - [`runHelperChecks`](file://services/api/scripts/inventory-conversion-probe.ts#L37-L103) (`services/api/scripts/inventory-conversion-probe.ts:37-103`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`main`](file://services/api/scripts/inventory-conversion-probe.ts#L243-L249) (`services/api/scripts/inventory-conversion-probe.ts:243-249`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `objectof:runroutechecks:bodyof` (Klaster #80)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`objectOf`](file://services/api/scripts/inventory-conversion-probe.ts#L23-L27) (`services/api/scripts/inventory-conversion-probe.ts:23-27`) [Tipe: `function`]
    - *Signature:* `(value: unknown): Record<string, unknown> | null`
  - [`runRouteChecks`](file://services/api/scripts/inventory-conversion-probe.ts#L105-L241) (`services/api/scripts/inventory-conversion-probe.ts:105-241`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`bodyOf`](file://services/api/scripts/inventory-conversion-probe.ts#L29-L35) (`services/api/scripts/inventory-conversion-probe.ts:29-35`) [Tipe: `function`]
    - *Signature:* `(response: { body: string }): Record<string, unknown>`

### Sub-sistem: `main:assert:headersfor` (Klaster #107)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/read-models-probe.ts#L13-L16) (`services/api/scripts/read-models-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`headersFor`](file://services/api/scripts/read-models-probe.ts#L17-L20) (`services/api/scripts/read-models-probe.ts:17-20`) [Tipe: `function`]
    - *Signature:* `(role: string): Promise<{ authorization: string }>`
  - [`main`](file://services/api/scripts/read-models-probe.ts#L8-L69) (`services/api/scripts/read-models-probe.ts:8-69`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `visit:snapshotdirectory:directory` (Klaster #108)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`visit`](file://services/api/scripts/security-probe-isolation-probe.ts#L15-L28) (`services/api/scripts/security-probe-isolation-probe.ts:15-28`) [Tipe: `function`]
    - *Signature:* `(directory: string, relativeDirectory = ""): void`
  - [`sha256`](file://services/api/scripts/security-probe-isolation-probe.ts#L9-L11) (`services/api/scripts/security-probe-isolation-probe.ts:9-11`) [Tipe: `function`]
    - *Signature:* `(data: Buffer): string`
  - [`snapshotDirectory`](file://services/api/scripts/security-probe-isolation-probe.ts#L13-L31) (`services/api/scripts/security-probe-isolation-probe.ts:13-31`) [Tipe: `function`]
    - *Signature:* `(root: string): string[]`

### Sub-sistem: `audit:writeaudit:newauditid` (Klaster #122)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`writeAudit`](file://services/api/src/audit.ts#L30-L45) (`services/api/src/audit.ts:30-45`) [Tipe: `function`]
    - *Signature:* `(input: AuditInput, options: AuditWriteOptions = {}): Promise<void>`
  - [`newAuditId`](file://services/api/src/audit.ts#L19-L21) (`services/api/src/audit.ts:19-21`) [Tipe: `function`]
    - *Signature:* `(): string`
  - [`saveRenderModel`](file://services/api/src/pdf/renderStore.ts#L56-L111) (`services/api/src/pdf/renderStore.ts:56-111`) [Tipe: `function`]
    - *Signature:* `(input: RenderModelInput): Promise<string | null>`

### Sub-sistem: `seed:runseed:hashpassword` (Klaster #128)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`hashPassword`](file://services/api/src/auth.ts#L33-L35) (`services/api/src/auth.ts:33-35`) [Tipe: `function`]
    - *Signature:* `(plain: string): Promise<string>`
  - [`seedUsers`](file://services/api/src/auth.ts#L282-L382) (`services/api/src/auth.ts:282-382`) [Tipe: `function`]
    - *Signature:* `(
  dbInsert: ExecFn,
  dbQuery?: QueryFn,
  queryImpl?: (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>,
): Promise<void>`
  - [`runSeed`](file://services/api/src/seed.ts#L8-L82) (`services/api/src/seed.ts:8-82`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `real:loan:isactiveloan` (Klaster #136)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`real`](file://services/api/src/bookingGuard.ts#L23-L23) (`services/api/src/bookingGuard.ts:23-23`) [Tipe: `function`]
    - *Signature:* `(d: string): boolean`
    - *Deskripsi:* // Round-trip UTC: 2024-02-31 lolos Date.parse (jadi 2 Maret) padahal bukan tanggal sah.
  - [`isActiveLoan`](file://services/api/src/bookingGuard.ts#L9-L11) (`services/api/src/bookingGuard.ts:9-11`) [Tipe: `function`]
    - *Signature:* `(d: Data): boolean`
  - [`loanOverlapError`](file://services/api/src/bookingGuard.ts#L14-L40) (`services/api/src/bookingGuard.ts:14-40`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string | null, after: Data | null): Promise<string | null>`

### Sub-sistem: `islocked:boqlockerror:checkdocunique` (Klaster #139)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isLocked`](file://services/api/src/boqDocs.ts#L54-L56) (`services/api/src/boqDocs.ts:54-56`) [Tipe: `function`]
    - *Signature:* `(status: unknown): boolean`
  - [`checkDocUnique`](file://services/api/src/boqDocs.ts#L74-L89) (`services/api/src/boqDocs.ts:74-89`) [Tipe: `function`]
    - *Signature:* `(data: Data, selfId: string | null): Promise<string | null>`
  - [`boqLockError`](file://services/api/src/boqDocs.ts#L96-L120) (`services/api/src/boqDocs.ts:96-120`) [Tipe: `function`]
    - *Signature:* `(table: string, before: Data | null, after: Data | null): Promise<string | null>`

### Sub-sistem: `fit:one:dock` (Klaster #152)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`dockFitIssue`](file://services/api/src/dockFit.ts#L16-L25) (`services/api/src/dockFit.ts:16-25`) [Tipe: `function`]
    - *Signature:* `(dock: Data, vessel: Data): string | null`
  - [`one`](file://services/api/src/dockFit.ts#L27-L31) (`services/api/src/dockFit.ts:27-31`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string): Promise<Data | null>`
    - *Deskripsi:* /** Murni, supaya bisa diuji probe tanpa DB. */
  - [`dockFitError`](file://services/api/src/dockFit.ts#L34-L50) (`services/api/src/dockFit.ts:34-50`) [Tipe: `function`]
    - *Signature:* `(table: string, after: Data | null, role: string | undefined): Promise<string | null>`

### Sub-sistem: `stages:stamp:stampwbsroles` (Klaster #155)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stages`](file://services/api/src/domainGuards.ts#L23-L23) (`services/api/src/domainGuards.ts:23-23`) [Tipe: `function`]
    - *Signature:* `(v: unknown): Data[]`
    - *Deskripsi:* // Schema rute menerima anggota array apa pun; yang bukan objek dianggap tahapan kosong.
  - [`stampRole`](file://services/api/src/domainGuards.ts#L70-L74) (`services/api/src/domainGuards.ts:70-74`) [Tipe: `function`]
    - *Signature:* `(before: unknown, after: unknown, role: string): unknown`
  - [`stampWbsRoles`](file://services/api/src/domainGuards.ts#L77-L89) (`services/api/src/domainGuards.ts:77-89`) [Tipe: `function`]
    - *Signature:* `(before: unknown, after: unknown, role: string): unknown`

### Sub-sistem: `generation:cache:samegeneration` (Klaster #172)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`cacheGeneration`](file://services/api/src/listCache.ts#L43-L45) (`services/api/src/listCache.ts:43-45`) [Tipe: `function`]
    - *Signature:* `(table: string): CacheGeneration`
  - [`sameGeneration`](file://services/api/src/listCache.ts#L47-L49) (`services/api/src/listCache.ts:47-49`) [Tipe: `function`]
    - *Signature:* `(a: CacheGeneration, b: CacheGeneration): boolean`
  - [`cachePut`](file://services/api/src/listCache.ts#L62-L77) (`services/api/src/listCache.ts:62-77`) [Tipe: `function`]
    - *Signature:* `(
  key: string,
  table: string,
  body: unknown,
  generationAtStart?: CacheGeneration,
): Entry`

### Sub-sistem: `can:registerinventoryadditionalroutes:requiremanageusers` (Klaster #206)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`can`](file://services/api/src/policy.ts#L371-L376) (`services/api/src/policy.ts:371-376`) [Tipe: `function`]
    - *Signature:* `(role: unknown, collection: string, action: Action): boolean`
  - [`registerInventoryAdditionalRoutes`](file://services/api/src/routes/inventoryAdditional.ts#L19-L36) (`services/api/src/routes/inventoryAdditional.ts:19-36`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`
  - [`requireManageUsers`](file://services/api/src/policy.ts#L416-L425) (`services/api/src/policy.ts:416-425`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `get:getclientip:getwriteratekey` (Klaster #209)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isTrustedProxy`](file://services/api/src/rateLimit.ts#L33-L36) (`services/api/src/rateLimit.ts:33-36`) [Tipe: `function`]
    - *Signature:* `(): boolean`
  - [`getClientIp`](file://services/api/src/rateLimit.ts#L38-L46) (`services/api/src/rateLimit.ts:38-46`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest): string`
  - [`getWriteRateKey`](file://services/api/src/rateLimit.ts#L67-L80) (`services/api/src/rateLimit.ts:67-80`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest): string`

### Sub-sistem: `checklist:checklisthook:hook` (Klaster #218)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalizedValue`](file://services/api/src/scoring.ts#L14-L26) (`services/api/src/scoring.ts:14-26`) [Tipe: `function`]
    - *Signature:* `(item: ChecklistItem, answer: unknown): number | null`
  - [`scoreChecklist`](file://services/api/src/scoring.ts#L28-L46) (`services/api/src/scoring.ts:28-46`) [Tipe: `function`]
    - *Signature:* `(template: ChecklistTemplate, answers: Record<string, unknown>): { score: number; answered: number; total: number }`
  - [`checklistHook`](file://services/api/src/scoring.ts#L49-L77) (`services/api/src/scoring.ts:49-77`) [Tipe: `function`]
    - *Signature:* `(table: string, data: Data): Promise<{ data: Data } | { error: string }>`

### Sub-sistem: `service:approval:registerserviceapprovalroutes` (Klaster #243)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`canApproveService`](file://services/api/src/serviceApproval.ts#L38-L40) (`services/api/src/serviceApproval.ts:38-40`) [Tipe: `function`]
    - *Signature:* `(role: string | undefined): boolean`
  - [`setServiceApproval`](file://services/api/src/serviceApproval.ts#L112-L146) (`services/api/src/serviceApproval.ts:112-146`) [Tipe: `function`]
    - *Signature:* `(
  id: string, next: ServiceApproval, role: string | undefined, actor: string, note: string,
  audit: (svc: Data) => Promise<void>,
): Promise<Data>`
  - [`registerServiceApprovalRoutes`](file://services/api/src/routes/serviceApproval.ts#L16-L36) (`services/api/src/routes/serviceApproval.ts:16-36`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `every:write:same` (Klaster #675)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`scopedProjectIds`](file://services/api/src/teamScope.ts#L15-L39) (`services/api/src/teamScope.ts:15-39`) [Tipe: `function`]
    - *Signature:* `(user: ScopeUser | undefined): Promise<Set<string> | null>`
  - [`rowVisibleToUser`](file://services/api/src/routes/crud.ts#L359-L370) (`services/api/src/routes/crud.ts:359-370`) [Tipe: `function`]
    - *Signature:* `(table: string, row: Row, user: Parameters<typeof branchAllowed>[0]): Promise<boolean>`
    - *Deskripsi:* /** Same row-level branch/team authorization for every by-id read or write. */
  - [`withProjectWriteScope`](file://services/api/src/routes/crud.ts#L372-L386) (`services/api/src/routes/crud.ts:372-386`) [Tipe: `function`]
    - *Signature:* `(
  id: string,
  user: Parameters<typeof branchAllowed>[0],
  write: () => Promise<T>,
): Promise<{ allowed: false } | { allowed: true; result: T }>`
    - *Deskripsi:* /** Same row-level branch/team authorization for every by-id read or write. */

### Sub-sistem: `alert:handleclose:rendericon` (Klaster #260)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`renderIcon`](file://apps/web/src/components/Alert.tsx#L115-L121) (`apps/web/src/components/Alert.tsx:115-121`) [Tipe: `function`]
    - *Signature:* `()`
  - [`handleClose`](file://apps/web/src/components/Alert.tsx#L110-L113) (`apps/web/src/components/Alert.tsx:110-113`) [Tipe: `function`]
    - *Signature:* `()`
  - [`Alert`](file://apps/web/src/components/Alert.tsx#L93-L165) (`apps/web/src/components/Alert.tsx:93-165`) [Tipe: `function`]
    - *Signature:* `({
  variant = "info",
  title,
  description,
  children,
  icon = true,
  dismissible = false,
  onDismiss,
  action,
  className = "",
}: AlertProps)`

### Sub-sistem: `handle:handleconfirm:alertmodal` (Klaster #262)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`handleConfirm`](file://apps/web/src/components/Alert.tsx#L247-L252) (`apps/web/src/components/Alert.tsx:247-252`) [Tipe: `function`]
    - *Signature:* `()`
  - [`handleCancel`](file://apps/web/src/components/Alert.tsx#L242-L245) (`apps/web/src/components/Alert.tsx:242-245`) [Tipe: `function`]
    - *Signature:* `()`
  - [`AlertModal`](file://apps/web/src/components/Alert.tsx#L226-L295) (`apps/web/src/components/Alert.tsx:226-295`) [Tipe: `function`]
    - *Signature:* `({
  open,
  onClose,
  title,
  description,
  children,
  variant = "warning",
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: AlertModalProps)`

### Sub-sistem: `umur:fill:meta` (Klaster #266)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fill`](file://apps/web/src/components/AlertBanner.tsx#L146-L148) (`apps/web/src/components/AlertBanner.tsx:146-148`) [Tipe: `function`]
    - *Signature:* `(tpl: string, vars: Record<string, string | number>): string`
    - *Deskripsi:* /** Isi `{n}`/`{kritis}` pada kunci kamus. */
  - [`ageDays`](file://apps/web/src/components/AlertBanner.tsx#L226-L231) (`apps/web/src/components/AlertBanner.tsx:226-231`) [Tipe: `function`]
    - *Signature:* `(since: string | undefined): number | null`
    - *Deskripsi:* /**
 * Umur alert dalam hari. `since` sudah divalidasi di `normalizeItems`, jadi
 * di sini tidak mungkin NaN - tapi tetap dijaga, karena "NaN hari" lebih buruk
 * daripada tidak menampilkan umur sama sekali.
 */
  - [`AlertMeta`](file://apps/web/src/components/AlertBanner.tsx#L375-L384) (`apps/web/src/components/AlertBanner.tsx:375-384`) [Tipe: `function`]
    - *Signature:* `({ item }: { item: ModuleAlertItem })`
    - *Deskripsi:* /** Baris meta kecil: dampak + umur + tenggat. Tidak ada isinya, tidak tampil. */

### Sub-sistem: `notes:remove:notesof` (Klaster #290)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`remove`](file://apps/web/src/components/ServiceNotes.tsx#L107-L119) (`apps/web/src/components/ServiceNotes.tsx:107-119`) [Tipe: `function`]
    - *Signature:* `(idx: number): Promise<void>`
  - [`notesOf`](file://apps/web/src/components/ServiceNotes.tsx#L38-L41) (`apps/web/src/components/ServiceNotes.tsx:38-41`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): ServiceNote[]`
  - [`ServiceNotesModal`](file://apps/web/src/components/ServiceNotes.tsx#L74-L221) (`apps/web/src/components/ServiceNotes.tsx:74-221`) [Tipe: `function`]
    - *Signature:* `({ equip, labels, onClose, onSave }: ServiceNotesProps)`

### Sub-sistem: `fmtjam24:timeinput24:norm24` (Klaster #573)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`norm24`](file://apps/web/src/utils/time24.ts#L27-L46) (`apps/web/src/utils/time24.ts:27-46`) [Tipe: `function`]
    - *Signature:* `(t: unknown): string`
  - [`fmtJam24`](file://apps/web/src/utils/time24.ts#L73-L83) (`apps/web/src/utils/time24.ts:73-83`) [Tipe: `function`]
    - *Signature:* `(jam: unknown): string`
  - [`TimeInput24`](file://apps/web/src/components/TimeInput24.tsx#L5-L30) (`apps/web/src/components/TimeInput24.tsx:5-30`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
})`

### Sub-sistem: `toast:mouse:success` (Klaster #298)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`handleMouseLeave`](file://apps/web/src/components/Toast.tsx#L219-L223) (`apps/web/src/components/Toast.tsx:219-223`) [Tipe: `function`]
    - *Signature:* `()`
  - [`handleMouseEnter`](file://apps/web/src/components/Toast.tsx#L212-L217) (`apps/web/src/components/Toast.tsx:212-217`) [Tipe: `function`]
    - *Signature:* `()`
  - [`ToastCard`](file://apps/web/src/components/Toast.tsx#L178-L286) (`apps/web/src/components/Toast.tsx:178-286`) [Tipe: `function`]
    - *Signature:* `({ item, onDismiss }: ToastCardProps)`
    - *Deskripsi:* /**
 * Menerbitkan notifikasi toast ke seluruh aplikasi.
 * Kompatibel penuh dengan signature lama: toast(message, "success" | "info")
 * serta mendukung options tambahan dan method pembantu (toast.success, toast.error, dll).
 */

### Sub-sistem: `toaster:ontoast:ondismiss` (Klaster #299)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`onDismiss`](file://apps/web/src/components/Toast.tsx#L332-L335) (`apps/web/src/components/Toast.tsx:332-335`) [Tipe: `function`]
    - *Signature:* `(e: Event)`
  - [`onToast`](file://apps/web/src/components/Toast.tsx#L303-L330) (`apps/web/src/components/Toast.tsx:303-330`) [Tipe: `function`]
    - *Signature:* `(e: Event)`
  - [`Toaster`](file://apps/web/src/components/Toast.tsx#L291-L358) (`apps/web/src/components/Toast.tsx:291-358`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `blank:cmpval:sortrows` (Klaster #328)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`blank`](file://apps/web/src/components/ui.tsx#L1318-L1318) (`apps/web/src/components/ui.tsx:1318-1318`) [Tipe: `function`]
    - *Signature:* `(v: string | number | null | undefined): boolean`
  - [`cmpVal`](file://apps/web/src/components/ui.tsx#L1291-L1304) (`apps/web/src/components/ui.tsx:1291-1304`) [Tipe: `function`]
    - *Signature:* `(a: string | number | null | undefined, b: string | number | null | undefined): number`
  - [`sortRows`](file://apps/web/src/components/ui.tsx#L1306-L1330) (`apps/web/src/components/ui.tsx:1306-1330`) [Tipe: `function`]
    - *Signature:* `(rows: T[], sort: SortState, get: (row: T, key: string) => string | number | null | undefined): T[]`

### Sub-sistem: `time:masktimedigits:mask` (Klaster #337)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`maskTimeDigits`](file://apps/web/src/utils/timeMask.ts#L20-L23) (`apps/web/src/utils/timeMask.ts:20-23`) [Tipe: `function`]
    - *Signature:* `(raw: string): string`
  - [`shouldEmitTime`](file://apps/web/src/utils/timeMask.ts#L39-L46) (`apps/web/src/utils/timeMask.ts:39-46`) [Tipe: `function`]
    - *Signature:* `(masked: string): string | null`
  - [`TimeInput`](file://apps/web/src/components/ui.tsx#L1782-L1836) (`apps/web/src/components/ui.tsx:1782-1836`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "HH:MM",
  ariaLabel,
}: {
  /** Selalu "HH:MM" atau string kosong. */
  value: string;
  /** Menerima hasil masking; string kosong berarti pengguna mengosongkan. */
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
})`

### Sub-sistem: `downloadbloburl:cjkwarning:usepdfdoc` (Klaster #346)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`cjkWarning`](file://apps/web/src/components/usePdfDoc.ts#L36-L38) (`apps/web/src/components/usePdfDoc.ts:36-38`) [Tipe: `function`]
    - *Signature:* `(count: number): string`
  - [`downloadBlobUrl`](file://apps/web/src/services/pdfClient.ts#L230-L238) (`apps/web/src/services/pdfClient.ts:230-238`) [Tipe: `function`]
    - *Signature:* `(url: string, filename: string): void`
  - [`usePdfDoc`](file://apps/web/src/components/usePdfDoc.ts#L40-L145) (`apps/web/src/components/usePdfDoc.ts:40-145`) [Tipe: `function`]
    - *Signature:* `(): {
  state: PdfDocState;
  /** Minta dokumen; memunculkan popup bila `open` true. */
  request: (req: PdfRequest, filename: string, open: boolean) => Promise<boolean>;
  /** Cetak ulang snapshot sebelumnya; hasil tetap melewati popup/unduh yang sama. */
  reprint: (modelId: string, filename: string, open: boolean) => Promise<boolean>;
  download: (filename: string) => void;
  close: () => void;
  reset: () => void;
}`

### Sub-sistem: `idb:idbclearall:idbavailable` (Klaster #353)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`openDb`](file://apps/web/src/data/idb.ts#L31-L67) (`apps/web/src/data/idb.ts:31-67`) [Tipe: `function`]
    - *Signature:* `(): Promise<IDBDatabase | null>`
  - [`idbClearAll`](file://apps/web/src/data/idb.ts#L140-L157) (`apps/web/src/data/idb.ts:140-157`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`idbAvailable`](file://apps/web/src/data/idb.ts#L70-L72) (`apps/web/src/data/idb.ts:70-72`) [Tipe: `function`]
    - *Signature:* `(): Promise<boolean>`

### Sub-sistem: `clone:buildseeds:sanitizestore` (Klaster #388)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`buildSeeds`](file://apps/web/src/data/store.tsx#L306-L380) (`apps/web/src/data/store.tsx:306-380`) [Tipe: `function`]
    - *Signature:* `(): StoreShape`
  - [`clone`](file://apps/web/src/data/store.tsx#L297-L299) (`apps/web/src/data/store.tsx:297-299`) [Tipe: `function`]
    - *Signature:* `(v: T): T`
  - [`sanitizeStore`](file://apps/web/src/data/store.tsx#L542-L554) (`apps/web/src/data/store.tsx:542-554`) [Tipe: `function`]
    - *Signature:* `(parsed: Partial<StoreShape>): StoreShape`

### Sub-sistem: `persisted:berakhir:403` (Klaster #391)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`notifyStorageFull`](file://apps/web/src/data/store.tsx#L774-L787) (`apps/web/src/data/store.tsx:774-787`) [Tipe: `function`]
    - *Signature:* `(message: string): void`
    - *Deskripsi:* /** 401 sudah ditangani AppShell (satu toast "Sesi berakhir" + ke login), jadi
 *  store hanya bersuara untuk 403: token masih ada tetapi hak akses ditolak.
 *  Dulu keduanya diberi pesan "Sesi berakhir" sehingga 403 menyesatkan
 *  (K17-UMUM-01). */
  - [`saveDirtyPersisted`](file://apps/web/src/data/store.tsx#L415-L421) (`apps/web/src/data/store.tsx:415-421`) [Tipe: `function`]
    - *Signature:* `(cols: string[]): void`
  - [`saveTombstonesPersisted`](file://apps/web/src/data/store.tsx#L444-L455) (`apps/web/src/data/store.tsx:444-455`) [Tipe: `function`]
    - *Signature:* `(map: Map<string, Set<string>>): void`

### Sub-sistem: `flush:run:userealtime` (Klaster #408)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`run`](file://apps/web/src/data/useRealtime.ts#L43-L75) (`apps/web/src/data/useRealtime.ts:43-75`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`flush`](file://apps/web/src/data/useRealtime.ts#L29-L42) (`apps/web/src/data/useRealtime.ts:29-42`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`useRealtime`](file://apps/web/src/data/useRealtime.ts#L14-L83) (`apps/web/src/data/useRealtime.ts:14-83`) [Tipe: `function`]
    - *Signature:* `(enabled: boolean): void`

### Sub-sistem: `usedeterrent:deterrent:securityguards` (Klaster #422)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`onKey`](file://apps/web/src/security/watermark.tsx#L207-L213) (`apps/web/src/security/watermark.tsx:207-213`) [Tipe: `function`]
    - *Signature:* `(e: KeyboardEvent)`
  - [`useDeterrent`](file://apps/web/src/security/watermark.tsx#L205-L219) (`apps/web/src/security/watermark.tsx:205-219`) [Tipe: `function`]
    - *Signature:* `()`
  - [`SecurityGuards`](file://apps/web/src/security/watermark.tsx#L221-L224) (`apps/web/src/security/watermark.tsx:221-224`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `bell:perhatian:dashboard` (Klaster #464)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`daysUntil`](file://apps/web/src/utils/alerts.ts#L14-L22) (`apps/web/src/utils/alerts.ts:14-22`) [Tipe: `function`]
    - *Signature:* `(iso: string | null | undefined): number | null`
    - *Deskripsi:* // Dipakai AppShell (bell) + Dashboard (strip Perlu Perhatian).
  - [`wbsDaysUntil`](file://apps/web/src/utils/alerts.ts#L24-L43) (`apps/web/src/utils/alerts.ts:24-43`) [Tipe: `function`]
    - *Signature:* `(end: string | null | undefined): number | null`
    - *Deskripsi:* // Dipakai AppShell (bell) + Dashboard (strip Perlu Perhatian).
  - [`computeAlerts`](file://apps/web/src/utils/alerts.ts#L45-L163) (`apps/web/src/utils/alerts.ts:45-163`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape): Alert[]`

### Sub-sistem: `level:dismisslevel:restorelevel` (Klaster #468)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`dismissedFor`](file://apps/web/src/utils/bannerDismiss.ts#L60-L62) (`apps/web/src/utils/bannerDismiss.ts:60-62`) [Tipe: `function`]
    - *Signature:* `(map: DismissMap, moduleKey: string): AlertLevel[]`
  - [`dismissLevel`](file://apps/web/src/utils/bannerDismiss.ts#L65-L69) (`apps/web/src/utils/bannerDismiss.ts:65-69`) [Tipe: `function`]
    - *Signature:* `(map: DismissMap, moduleKey: string, level: AlertLevel): DismissMap`
  - [`restoreLevel`](file://apps/web/src/utils/bannerDismiss.ts#L72-L80) (`apps/web/src/utils/bannerDismiss.ts:72-80`) [Tipe: `function`]
    - *Signature:* `(map: DismissMap, moduleKey: string, level: AlertLevel): DismissMap`

### Sub-sistem: `hascontract:isclassapprovalsatisfied:satisfied` (Klaster #474)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isClassApprovalSatisfied`](file://apps/web/src/utils/classApprovalBlockers.ts#L45-L56) (`apps/web/src/utils/classApprovalBlockers.ts:45-56`) [Tipe: `function`]
    - *Signature:* `(project: StoreItem, data: TransitionBlockerData): boolean`
  - [`hasContract`](file://apps/web/src/pages/proyek/Projects.tsx#L49-L54) (`apps/web/src/pages/proyek/Projects.tsx:49-54`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem, contracts: StoreItem[]): boolean`
  - [`getStageTransitionBlockers`](file://apps/web/src/utils/classApprovalBlockers.ts#L58-L236) (`apps/web/src/utils/classApprovalBlockers.ts:58-236`) [Tipe: `function`]
    - *Signature:* `(
  from: string,
  to: string,
  project: StoreItem,
  data: TransitionBlockerData,
  locale: "id" | "en" = "id",
): StageBlocker[]`

### Sub-sistem: `dead:num:deadvalueof` (Klaster #476)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/utils/deadStock.ts#L18-L21) (`apps/web/src/utils/deadStock.ts:18-21`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
    - *Deskripsi:* // supaya data yang sudah ada tidak hilang.
  - [`deadValueOf`](file://apps/web/src/utils/deadStock.ts#L182-L185) (`apps/web/src/utils/deadStock.ts:182-185`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem): number`
  - [`derivedDeadCode`](file://apps/web/src/utils/deadStock.ts#L161-L166) (`apps/web/src/utils/deadStock.ts:161-166`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem, hasAnyOut: boolean, lastOutDays: number): string`

### Sub-sistem: `num:categorywarnings:warnings` (Klaster #497)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/utils/inventoryWarn.ts#L123-L126) (`apps/web/src/utils/inventoryWarn.ts:123-126`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
    - *Deskripsi:* /** Cocokkan nama kategori ke rule. Coba persis dulu, lalu contains. */
  - [`effectiveMinStock`](file://apps/web/src/utils/inventoryWarn.ts#L135-L148) (`apps/web/src/utils/inventoryWarn.ts:135-148`) [Tipe: `function`]
    - *Signature:* `(item: StoreItem, warehouse?: string): number`
  - [`categoryWarnings`](file://apps/web/src/utils/inventoryWarn.ts#L235-L289) (`apps/web/src/utils/inventoryWarn.ts:235-289`) [Tipe: `function`]
    - *Signature:* `(
  inventory: StoreItem[],
  opts: { maxUrgentPerCategory?: number; onlyWithAction?: boolean } = {},
): CategoryWarningSummary[]`

### Sub-sistem: `materials:stock:stockmaterials` (Klaster #509)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`materialsOf`](file://apps/web/src/utils/maintenance.ts#L97-L115) (`apps/web/src/utils/maintenance.ts:97-115`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>): MaintMaterial[]`
  - [`planStockCut`](file://apps/web/src/utils/maintenance.ts#L190-L212) (`apps/web/src/utils/maintenance.ts:190-212`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>, inventory: StoreItem[]): StockPlanItem[]`
  - [`stockMaterials`](file://apps/web/src/utils/maintenance.ts#L118-L120) (`apps/web/src/utils/maintenance.ts:118-120`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>): MaintMaterial[]`

### Sub-sistem: `cost:materialscost:workdaysof` (Klaster #511)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`materialsCost`](file://apps/web/src/utils/maintenance.ts#L122-L124) (`apps/web/src/utils/maintenance.ts:122-124`) [Tipe: `function`]
    - *Signature:* `(materials: MaintMaterial[]): number`
  - [`workDaysOf`](file://apps/web/src/utils/maintenance.ts#L160-L168) (`apps/web/src/utils/maintenance.ts:160-168`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>): number`
  - [`costBreakdown`](file://apps/web/src/utils/maintenance.ts#L146-L157) (`apps/web/src/utils/maintenance.ts:146-157`) [Tipe: `function`]
    - *Signature:* `(
  m: Partial<StoreItem>,
  opts: { laborRatePerDay?: number; otherCost?: number } = {},
): MaintCostBreakdown`

### Sub-sistem: `month:yearsin:bucketbymonth` (Klaster #522)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`monthKeyOf`](file://apps/web/src/utils/monthAxis.ts#L40-L44) (`apps/web/src/utils/monthAxis.ts:40-44`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string`
  - [`bucketByMonth`](file://apps/web/src/utils/monthAxis.ts#L140-L161) (`apps/web/src/utils/monthAxis.ts:140-161`) [Tipe: `function`]
    - *Signature:* `(
  rows: T[],
  axis: MonthPoint[],
  dateOf: (row: T) => unknown,
  pick: (row: T) => number,
  aggregate: (values: number[]) => number = (v) => v.reduce((s, x) => s + x, 0),
): Record<string, number>`
  - [`yearsIn`](file://apps/web/src/utils/monthAxis.ts#L262-L270) (`apps/web/src/utils/monthAxis.ts:262-270`) [Tipe: `function`]
    - *Signature:* `(rows: T[], dateOf: (row: T) => unknown): number[]`

### Sub-sistem: `weekkey:dailyovertime:applyweeklycap` (Klaster #526)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`weekKey`](file://apps/web/src/utils/overtime.ts#L29-L34) (`apps/web/src/utils/overtime.ts:29-34`) [Tipe: `function`]
    - *Signature:* `(dateISO: string): string`
  - [`dailyOvertime`](file://apps/web/src/utils/overtime.ts#L24-L26) (`apps/web/src/utils/overtime.ts:24-26`) [Tipe: `function`]
    - *Signature:* `(hours: number, rules: OvertimeRules = DEFAULT_OVERTIME_RULES): number`
  - [`applyWeeklyCap`](file://apps/web/src/utils/overtime.ts#L37-L46) (`apps/web/src/utils/overtime.ts:37-46`) [Tipe: `function`]
    - *Signature:* `(days: { date: string; hours: number }[], rules: OvertimeRules = DEFAULT_OVERTIME_RULES): { date: string; overtime: number }[]`

### Sub-sistem: `html:boq:escapehtml` (Klaster #529)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`generateBoqHtml`](file://apps/web/src/utils/printBoqHtml.ts#L32-L334) (`apps/web/src/utils/printBoqHtml.ts:32-334`) [Tipe: `function`]
    - *Signature:* `(data: BoqPrintData): string`
  - [`escapeHtml`](file://apps/web/src/utils/printBoqHtml.ts#L336-L343) (`apps/web/src/utils/printBoqHtml.ts:336-343`) [Tipe: `function`]
    - *Signature:* `(s: string): string`
  - [`printBoqHtml`](file://apps/web/src/utils/printBoqHtml.ts#L345-L376) (`apps/web/src/utils/printBoqHtml.ts:345-376`) [Tipe: `function`]
    - *Signature:* `(data: BoqPrintData): void`

### Sub-sistem: `cost:equipment:equipmentcostbyproject` (Klaster #536)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`equipmentCostSummary`](file://apps/web/src/utils/projectCost.ts#L200-L223) (`apps/web/src/utils/projectCost.ts:200-223`) [Tipe: `function`]
    - *Signature:* `(
  projectId: string,
  bookings: StoreItem[],
  maintenances: StoreItem[],
  equipment: StoreItem[],
): EquipmentCostSummary`
  - [`maintenanceCostRows`](file://apps/web/src/utils/projectCost.ts#L143-L168) (`apps/web/src/utils/projectCost.ts:143-168`) [Tipe: `function`]
    - *Signature:* `(
  projectId: string,
  maintenances: StoreItem[],
): MaintCostRow[]`
  - [`equipmentCostByProject`](file://apps/web/src/utils/projectCost.ts#L229-L244) (`apps/web/src/utils/projectCost.ts:229-244`) [Tipe: `function`]
    - *Signature:* `(
  projects: StoreItem[],
  bookings: StoreItem[],
  maintenances: StoreItem[],
  equipment: StoreItem[],
): { projectId: string; projectName: string; cost: number }[]`

### Sub-sistem: `delay:days:projectdelaydetailsof` (Klaster #538)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`endInDays`](file://apps/web/src/utils/projectDelay.ts#L11-L19) (`apps/web/src/utils/projectDelay.ts:11-19`) [Tipe: `function`]
    - *Signature:* `(end: unknown, today: string): number | null`
  - [`delayDaysOf`](file://apps/web/src/utils/projectDelay.ts#L28-L33) (`apps/web/src/utils/projectDelay.ts:28-33`) [Tipe: `function`]
    - *Signature:* `(end: unknown, today: string, isLate: boolean): number | null`
  - [`projectDelayDetailsOf`](file://apps/web/src/utils/projectDelay.ts#L52-L83) (`apps/web/src/utils/projectDelay.ts:52-83`) [Tipe: `function`]
    - *Signature:* `(
  projectEnd: unknown,
  wbs: readonly DelayWbsItem[],
  today: string,
  isLate: boolean,
): ProjectDelayDetails`

### Sub-sistem: `ptkp:clampdependents:dependents` (Klaster #544)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`clampDependents`](file://apps/web/src/utils/ptkp.ts#L5-L8) (`apps/web/src/utils/ptkp.ts:5-8`) [Tipe: `function`]
    - *Signature:* `(n: unknown): number`
  - [`parsePtkp`](file://apps/web/src/utils/ptkp.ts#L16-L19) (`apps/web/src/utils/ptkp.ts:16-19`) [Tipe: `function`]
    - *Signature:* `(code: unknown): { marital: MaritalStatus; dependents: number }`
  - [`ptkpCode`](file://apps/web/src/utils/ptkp.ts#L10-L13) (`apps/web/src/utils/ptkp.ts:10-13`) [Tipe: `function`]
    - *Signature:* `(marital: unknown, dependents: unknown): string`

### Sub-sistem: `labor:day:rate` (Klaster #546)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`minimumDailyWage`](file://apps/web/src/utils/rates.ts#L86-L88) (`apps/web/src/utils/rates.ts:86-88`) [Tipe: `function`]
    - *Signature:* `(): number`
  - [`loadedLaborRatePerDay`](file://apps/web/src/utils/rates.ts#L94-L97) (`apps/web/src/utils/rates.ts:94-97`) [Tipe: `function`]
    - *Signature:* `(role: SkillRole): number`
  - [`billedLaborRatePerDay`](file://apps/web/src/utils/rates.ts#L105-L107) (`apps/web/src/utils/rates.ts:105-107`) [Tipe: `function`]
    - *Signature:* `(role: SkillRole): number`

### Sub-sistem: `risiko:milestone:doneat` (Klaster #553)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`claimKey`](file://apps/web/src/utils/riskAuto.ts#L278-L279) (`apps/web/src/utils/riskAuto.ts:278-279`) [Tipe: `function`]
    - *Signature:* `(projectId: string, d: { source?: unknown; wbsTask?: unknown; title?: unknown }): string`
    - *Deskripsi:* /**
 * Hasilkan risiko dari milestone WO sebuah proyek.
 *
 * Aturan:
 * 1. Milestone tanpa doneAt dan due dalam `milestoneDays` hari →
 *    risiko "termin hampir jatuh tempo".
 * 2. Milestone tanpa doneAt dan due sudah lewat → risiko "termin terlambat".
 *
 * Milestone yang sudah punya doneAt → risiko terkait ditutup.
 */
  - [`releaseAutoRisk`](file://apps/web/src/utils/riskAuto.ts#L290-L292) (`apps/web/src/utils/riskAuto.ts:290-292`) [Tipe: `function`]
    - *Signature:* `(projectId: string, draft: { source?: unknown; wbsTask?: unknown; title?: unknown }): void`
  - [`claimAutoRisk`](file://apps/web/src/utils/riskAuto.ts#L282-L287) (`apps/web/src/utils/riskAuto.ts:282-287`) [Tipe: `function`]
    - *Signature:* `(projectId: string, draft: { source?: unknown; wbsTask?: unknown; title?: unknown }): boolean`

### Sub-sistem: `recap:exportrecap:monthlyrecap` (Klaster #707)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`getSetting`](file://apps/web/src/utils/settings.ts#L6-L10) (`apps/web/src/utils/settings.ts:6-10`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape, key: string, fallback: number): number`
  - [`exportRecap`](file://apps/web/src/pages/absensi/MonthlyRecap.tsx#L62-L66) (`apps/web/src/pages/absensi/MonthlyRecap.tsx:62-66`) [Tipe: `function`]
    - *Signature:* `()`
  - [`MonthlyRecap`](file://apps/web/src/pages/absensi/MonthlyRecap.tsx#L18-L122) (`apps/web/src/pages/absensi/MonthlyRecap.tsx:18-122`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `per:positive:dasar` (Klaster #581)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`positiveNumber`](file://apps/web/src/utils/unitConversion.ts#L73-L76) (`apps/web/src/utils/unitConversion.ts:73-76`) [Tipe: `function`]
    - *Signature:* `(value: unknown): number | null`
    - *Deskripsi:* /** Satuan dasar yang lazim untuk kemasan tanpa aturan kategori: roll dikeluarkan
 *  per meter, drum/galon/kaleng per liter. Dipakai sebagai isian awal. */
  - [`unitConversionOf`](file://apps/web/src/utils/unitConversion.ts#L206-L236) (`apps/web/src/utils/unitConversion.ts:206-236`) [Tipe: `function`]
    - *Signature:* `(value: unknown): UnitConversion | null`
  - [`optionalPositiveNumber`](file://apps/web/src/utils/unitConversion.ts#L78-L81) (`apps/web/src/utils/unitConversion.ts:78-81`) [Tipe: `function`]
    - *Signature:* `(value: unknown): number | undefined`
    - *Deskripsi:* /** Satuan dasar yang lazim untuk kemasan tanpa aturan kategori: roll dikeluarkan
 *  per meter, drum/galon/kaleng per liter. Dipakai sebagai isian awal. */

### Sub-sistem: `uom2:conversion:mengubah` (Klaster #586)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`numberText`](file://apps/web/src/utils/unitConversion.ts#L238-L242) (`apps/web/src/utils/unitConversion.ts:238-242`) [Tipe: `function`]
    - *Signature:* `(value: number, locale: "id" | "en"): string`
    - *Deskripsi:* /** Membaca conversion baru atau field UOM2 lama tanpa mengubah data asal. */
  - [`displayUnit`](file://apps/web/src/utils/unitConversion.ts#L244-L249) (`apps/web/src/utils/unitConversion.ts:244-249`) [Tipe: `function`]
    - *Signature:* `(unit: string): string`
    - *Deskripsi:* /** Membaca conversion baru atau field UOM2 lama tanpa mengubah data asal. */
  - [`formatUnitConversion`](file://apps/web/src/utils/unitConversion.ts#L251-L267) (`apps/web/src/utils/unitConversion.ts:251-267`) [Tipe: `function`]
    - *Signature:* `(
  purchaseUnit: string,
  conversion: UnitConversion | null,
  locale: "id" | "en",
): string`

### Sub-sistem: `warehouse:warehousenames:warehousename` (Klaster #591)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`warehouseName`](file://apps/web/src/utils/warehouse.ts#L66-L68) (`apps/web/src/utils/warehouse.ts:66-68`) [Tipe: `function`]
    - *Signature:* `(w: StoreItem | Warehouse): string`
  - [`warehouseActive`](file://apps/web/src/utils/warehouse.ts#L70-L73) (`apps/web/src/utils/warehouse.ts:70-73`) [Tipe: `function`]
    - *Signature:* `(w: StoreItem | Warehouse): boolean`
  - [`warehouseNames`](file://apps/web/src/utils/warehouse.ts#L100-L111) (`apps/web/src/utils/warehouse.ts:100-111`) [Tipe: `function`]
    - *Signature:* `(warehouses: (StoreItem | Warehouse)[]): string[]`

### Sub-sistem: `100:milestone:tahap` (Klaster #597)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`woProgressOf`](file://apps/web/src/utils/woMilestones.ts#L73-L83) (`apps/web/src/utils/woMilestones.ts:73-83`) [Tipe: `function`]
    - *Signature:* `(wo: StoreItem | null | undefined): number`
  - [`clampPct`](file://apps/web/src/utils/woMilestones.ts#L85-L88) (`apps/web/src/utils/woMilestones.ts:85-88`) [Tipe: `function`]
    - *Signature:* `(n: number): number`
    - *Deskripsi:* /**
 * Progress WO sebagai PERSEN, dihitung dari milestone bila ada.
 *
 * Dua aturan yang membuat fungsi ini bisa dipercaya:
 *
 * 1. Bobot dijumlahkan dari milestone yang SUDAH SELESAI saja (`doneAt`
 *    terisi), lalu dibagi TOTAL bobot semua milestone - bukan dibagi 100.
 *    Kalau totale 100%, membagi 100 sama saja; kalau user hanya mengisi
 *    tiga tahap 30/30/40, membagi 100 membuat progres tersedak ke 90% di
 *    tahap kedua.
 *
 * 2. Kalau WO punya milestone tapi belum ada yang selesai, hasilnya 0 - bukan
 *    jatuh ke angka manual. Kalau ada satu tahap selesai dari total 100%,
 *    progressnya tepat 100%, bukan "hanya tahap pertama yang selesai".
 *
 * WO tanpa milestone sama sekali memakai `wo.progress` yang diketik
 * manual, supaya WO lama tidak ikut jadi 0%.
 */
  - [`woProgressLabel`](file://apps/web/src/utils/woMilestones.ts#L96-L99) (`apps/web/src/utils/woMilestones.ts:96-99`) [Tipe: `function`]
    - *Signature:* `(wo: StoreItem | null | undefined): string`

### Sub-sistem: `font:files:loadfontfiles` (Klaster #633)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadFontFiles`](file://services/api/src/pdf/font.ts#L64-L85) (`services/api/src/pdf/font.ts:64-85`) [Tipe: `function`]
    - *Signature:* `(): Record<string, string | null>`
  - [`registerFonts`](file://services/api/src/pdf/font.ts#L148-L175) (`services/api/src/pdf/font.ts:148-175`) [Tipe: `function`]
    - *Signature:* `(pdf: jsPDF): Record<FontName, FontSpec>`
  - [`fontFilesAvailable`](file://services/api/src/pdf/font.ts#L88-L91) (`services/api/src/pdf/font.ts:88-91`) [Tipe: `function`]
    - *Signature:* `(): boolean`

### Sub-sistem: `issetuptokenvalid:setup:recorderror` (Klaster #663)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`recordError`](file://services/api/src/routes/admin.ts#L53-L58) (`services/api/src/routes/admin.ts:53-58`) [Tipe: `function`]
    - *Signature:* `(context: string, err: unknown): void`
    - *Deskripsi:* // seeds stay skip-if-exists.
  - [`isSetupTokenValid`](file://services/api/src/routes/admin.ts#L11-L17) (`services/api/src/routes/admin.ts:11-17`) [Tipe: `function`]
    - *Signature:* `(expected: string | undefined, provided: unknown): boolean`
  - [`registerAdminRoutes`](file://services/api/src/routes/admin.ts#L19-L119) (`services/api/src/routes/admin.ts:19-119`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `sha:ishr:registerattendanceingestroutes` (Klaster #666)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isHr`](file://services/api/src/routes/attendanceIngest.ts#L94-L94) (`services/api/src/routes/attendanceIngest.ts:94-94`) [Tipe: `function`]
    - *Signature:* `(role: string | undefined): boolean`
  - [`sha`](file://services/api/src/routes/attendanceIngest.ts#L29-L29) (`services/api/src/routes/attendanceIngest.ts:29-29`) [Tipe: `function`]
    - *Signature:* `(s: string): string`
  - [`registerAttendanceIngestRoutes`](file://services/api/src/routes/attendanceIngest.ts#L93-L135) (`services/api/src/routes/attendanceIngest.ts:93-135`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `mergepunch:applypunches:punches` (Klaster #664)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mergePunch`](file://services/api/src/routes/attendanceIngest.ts#L40-L45) (`services/api/src/routes/attendanceIngest.ts:40-45`) [Tipe: `function`]
    - *Signature:* `(row: { checkIn?: string; checkOut?: string }, type: "in" | "out", time: string): { checkIn: string; checkOut: string }`
  - [`witaParts`](file://services/api/src/routes/attendanceIngest.ts#L32-L37) (`services/api/src/routes/attendanceIngest.ts:32-37`) [Tipe: `function`]
    - *Signature:* `(timestamp: string): { date: string; time: string } | null`
  - [`applyPunches`](file://services/api/src/routes/attendanceIngest.ts#L49-L91) (`services/api/src/routes/attendanceIngest.ts:49-91`) [Tipe: `function`]
    - *Signature:* `(punches: z.infer<typeof Punch>[], source: string): Promise<IngestResult>`

### Sub-sistem: `flush:onwrite:registereventroutes` (Klaster #680)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`onWrite`](file://services/api/src/routes/events.ts#L48-L52) (`services/api/src/routes/events.ts:48-52`) [Tipe: `function`]
    - *Signature:* `(table: string): void`
  - [`flush`](file://services/api/src/routes/events.ts#L42-L47) (`services/api/src/routes/events.ts:42-47`) [Tipe: `function`]
    - *Signature:* `(): void`
  - [`registerEventRoutes`](file://services/api/src/routes/events.ts#L19-L61) (`services/api/src/routes/events.ts:19-61`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `registerpofulfillmentroutes:fulfillment:canpo` (Klaster #686)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`canPo`](file://services/api/src/routes/poFulfillment.ts#L47-L47) (`services/api/src/routes/poFulfillment.ts:47-47`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest)`
  - [`handleError`](file://services/api/src/routes/poFulfillment.ts#L41-L44) (`services/api/src/routes/poFulfillment.ts:41-44`) [Tipe: `function`]
    - *Signature:* `(err: unknown, reply: FastifyReply)`
  - [`registerPoFulfillmentRoutes`](file://services/api/src/routes/poFulfillment.ts#L46-L97) (`services/api/src/routes/poFulfillment.ts:46-97`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `token:satu:sha` (Klaster #688)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sha`](file://services/api/src/routes/publicLeave.ts#L64-L64) (`services/api/src/routes/publicLeave.ts:64-64`) [Tipe: `function`]
    - *Signature:* `(v: string): string`
    - *Deskripsi:* // Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.
  - [`sameToken`](file://services/api/src/routes/publicLeave.ts#L59-L63) (`services/api/src/routes/publicLeave.ts:59-63`) [Tipe: `function`]
    - *Signature:* `(a: string, b: string): boolean`
    - *Deskripsi:* // Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.
  - [`tokenValid`](file://services/api/src/routes/publicLeave.ts#L74-L78) (`services/api/src/routes/publicLeave.ts:74-78`) [Tipe: `function`]
    - *Signature:* `(token: string): Promise<boolean>`
    - *Deskripsi:* /** Baris `qr:token`: JSON berisi hash (baru) atau token polos (sebelum ADR-0019). */

### Sub-sistem: `action:print:handle` (Klaster #716)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`handleExportExcel`](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L130-L184) (`apps/web/src/pages/dokumen/BoqDetailModal.tsx:130-184`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Action: Export Excel
  - [`handlePrint`](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L109-L127) (`apps/web/src/pages/dokumen/BoqDetailModal.tsx:109-127`) [Tipe: `function`]
    - *Signature:* `()`
    - *Deskripsi:* // Action: Print HTML Enterprise
  - [`BoqDetailModal`](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L30-L406) (`apps/web/src/pages/dokumen/BoqDetailModal.tsx:30-406`) [Tipe: `function`]
    - *Signature:* `({
  open,
  onClose,
  doc,
  boqDoc,
  items,
  project,
  allBoqDocs = [],
  onSelectDoc,
}: BoqDetailModalProps)`

### Sub-sistem: `active:delegationstatus:activemaintof` (Klaster #720)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`activeMaintOf`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L20-L23) (`apps/web/src/pages/equipment/DelegationPanel.tsx:20-23`) [Tipe: `function`]
    - *Signature:* `(eq: StoreItem, maintenances: StoreItem[]): StoreItem | undefined`
  - [`activeLoanOf`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L15-L18) (`apps/web/src/pages/equipment/DelegationPanel.tsx:15-18`) [Tipe: `function`]
    - *Signature:* `(eq: StoreItem, bookings: StoreItem[], today: string): StoreItem | undefined`
  - [`delegationStatus`](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L25-L28) (`apps/web/src/pages/equipment/DelegationPanel.tsx:25-28`) [Tipe: `function`]
    - *Signature:* `(eq: StoreItem, bookings: StoreItem[], maintenances: StoreItem[], today: string): "Maintenance" | "Dipinjam" | "Tersedia"`

### Sub-sistem: `reserved:availof:avail` (Klaster #743)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`reservedOf`](file://apps/web/src/pages/inventori/Inventory.tsx#L268-L270) (`apps/web/src/pages/inventori/Inventory.tsx:268-270`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): Reservation[]`
  - [`reservedQty`](file://apps/web/src/pages/inventori/Inventory.tsx#L272-L274) (`apps/web/src/pages/inventori/Inventory.tsx:272-274`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): number`
  - [`availOf`](file://apps/web/src/pages/inventori/Inventory.tsx#L276-L278) (`apps/web/src/pages/inventori/Inventory.tsx:276-278`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): number`

### Sub-sistem: `rentang:hist:tanggal` (Klaster #751)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rentangValid`](file://apps/web/src/pages/keuangan/Finance.tsx#L118-L120) (`apps/web/src/pages/keuangan/Finance.tsx:118-120`) [Tipe: `function`]
    - *Signature:* `(f: HistFilter): boolean`
    - *Deskripsi:* /** Rentang tanggal (FIN: filter dari-sampai) sah bila kedua tanggal nyata dan berurutan. */
  - [`matchHistPeriod`](file://apps/web/src/pages/keuangan/Finance.tsx#L158-L168) (`apps/web/src/pages/keuangan/Finance.tsx:158-168`) [Tipe: `function`]
    - *Signature:* `(periodYM: unknown, f: HistFilter): boolean`
  - [`histToParam`](file://apps/web/src/pages/keuangan/Finance.tsx#L93-L99) (`apps/web/src/pages/keuangan/Finance.tsx:93-99`) [Tipe: `function`]
    - *Signature:* `(f: HistFilter): string`

### Sub-sistem: `muka:uang:num` (Klaster #755)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/pages/keuangan/Finance.tsx#L339-L342) (`apps/web/src/pages/keuangan/Finance.tsx:339-342`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
    - *Deskripsi:* /** DP = uang muka: tanpa retensi, dan menandai proyek punya uang muka. */
  - [`lineAmount`](file://apps/web/src/pages/keuangan/Finance.tsx#L367-L370) (`apps/web/src/pages/keuangan/Finance.tsx:367-370`) [Tipe: `function`]
    - *Signature:* `(l: InvLine, isTM: boolean): number`
    - *Deskripsi:* // potongan = bruto - net (PPh21 + BPJS karyawan), selalu seimbang.
  - [`apOutAsOf`](file://apps/web/src/pages/keuangan/Finance.tsx#L509-L524) (`apps/web/src/pages/keuangan/Finance.tsx:509-524`) [Tipe: `function`]
    - *Signature:* `(list: StoreItem[], end: string): { v: string; total: number; count: number }[]`
    - *Deskripsi:* // payroll) - tidak ada snapshot hardcode per bulan.

### Sub-sistem: `bulan:liveasof:live` (Klaster #757)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`liveAsOf`](file://apps/web/src/pages/keuangan/Finance.tsx#L449-L460) (`apps/web/src/pages/keuangan/Finance.tsx:449-460`) [Tipe: `function`]
    - *Signature:* `(f: HistFilter, lastDate = ""): string`
  - [`akhirBulan`](file://apps/web/src/pages/keuangan/Finance.tsx#L443-L448) (`apps/web/src/pages/keuangan/Finance.tsx:443-448`) [Tipe: `function`]
    - *Signature:* `(ym: string): string`
    - *Deskripsi:* // payroll) - tidak ada snapshot hardcode per bulan.
  - [`asOfOrToday`](file://apps/web/src/pages/keuangan/Finance.tsx#L462-L464) (`apps/web/src/pages/keuangan/Finance.tsx:462-464`) [Tipe: `function`]
    - *Signature:* `(f: HistFilter, lastDate = ""): string`

### Sub-sistem: `init:manualtaxform:save` (Klaster #761)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`save`](file://apps/web/src/pages/keuangan/Finance.tsx#L627-L632) (`apps/web/src/pages/keuangan/Finance.tsx:627-632`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* // eslint-disable-line react-hooks/exhaustive-deps
  - [`init`](file://apps/web/src/pages/keuangan/Finance.tsx#L618-L623) (`apps/web/src/pages/keuangan/Finance.tsx:618-623`) [Tipe: `function`]
    - *Signature:* `(): Record<TaxManualKey, string>`
  - [`ManualTaxForm`](file://apps/web/src/pages/keuangan/Finance.tsx#L609-L647) (`apps/web/src/pages/keuangan/Finance.tsx:609-647`) [Tipe: `function`]
    - *Signature:* `({ period, locked, labels, auto, onSave }: {
  period: StoreItem;
  locked: boolean;
  labels: Record<TaxManualKey, string>;
  auto: Record<TaxManualKey, number>;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
})`

### Sub-sistem: `toisodate:mondayof:monday` (Klaster #764)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toISODate`](file://apps/web/src/pages/laporan/Laporan.tsx#L51-L53) (`apps/web/src/pages/laporan/Laporan.tsx:51-53`) [Tipe: `function`]
    - *Signature:* `(d: Date): string`
  - [`addDays`](file://apps/web/src/pages/laporan/Laporan.tsx#L63-L67) (`apps/web/src/pages/laporan/Laporan.tsx:63-67`) [Tipe: `function`]
    - *Signature:* `(iso: string, n: number): string`
  - [`mondayOf`](file://apps/web/src/pages/laporan/Laporan.tsx#L55-L61) (`apps/web/src/pages/laporan/Laporan.tsx:55-61`) [Tipe: `function`]
    - *Signature:* `(iso: string): string`

### Sub-sistem: `kasbon:norm:normkasbon` (Klaster #773)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normKasbonList`](file://apps/web/src/utils/kasbon.ts#L24-L40) (`apps/web/src/utils/kasbon.ts:24-40`) [Tipe: `function`]
    - *Signature:* `(v: unknown): KasbonEntry[]`
  - [`normKasbon`](file://apps/web/src/pages/payroll/Payroll.tsx#L145-L147) (`apps/web/src/pages/payroll/Payroll.tsx:145-147`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): KasbonEntry[]`
  - [`kasbonSisa`](file://apps/web/src/pages/payroll/Payroll.tsx#L149-L151) (`apps/web/src/pages/payroll/Payroll.tsx:149-151`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): number`

### Sub-sistem: `pph:calc:calcpphprogressive` (Klaster #774)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`annualPph`](file://apps/web/src/pages/payroll/Payroll.tsx#L166-L188) (`apps/web/src/pages/payroll/Payroll.tsx:166-188`) [Tipe: `function`]
    - *Signature:* `(penghasilanSetahun: number, ptkpStatus: string, dependents: number, r: PayrollRates): number`
  - [`calcPphProgressive`](file://apps/web/src/pages/payroll/Payroll.tsx#L191-L193) (`apps/web/src/pages/payroll/Payroll.tsx:191-193`) [Tipe: `function`]
    - *Signature:* `(bruto: number, ptkpStatus: string, dependents: number, r: PayrollRates): number`
  - [`calcPphIrregular`](file://apps/web/src/pages/payroll/Payroll.tsx#L197-L205) (`apps/web/src/pages/payroll/Payroll.tsx:197-205`) [Tipe: `function`]
    - *Signature:* `(baseMonthly: number, irregular: number, emp: StoreItem, r: PayrollRates): number`

### Sub-sistem: `nextlevel:needlevels:need` (Klaster #781)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`needLevels`](file://apps/web/src/pages/procurement/Procurement.tsx#L132-L139) (`apps/web/src/pages/procurement/Procurement.tsx:132-139`) [Tipe: `function`]
    - *Signature:* `(amount: number, financeLimit = 1000000): string[]`
  - [`apprOf`](file://apps/web/src/pages/procurement/Procurement.tsx#L148-L150) (`apps/web/src/pages/procurement/Procurement.tsx:148-150`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem): Approval[]`
  - [`nextLevel`](file://apps/web/src/pages/procurement/Procurement.tsx#L152-L156) (`apps/web/src/pages/procurement/Procurement.tsx:152-156`) [Tipe: `function`]
    - *Signature:* `(po: StoreItem, financeLimit = 1000000): string | null`

### Sub-sistem: `kop:server:parsekop` (Klaster #785)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseKop`](file://apps/web/src/pages/pengaturan/KopCard.tsx#L13-L21) (`apps/web/src/pages/pengaturan/KopCard.tsx:13-21`) [Tipe: `function`]
    - *Signature:* `(raw: unknown): Record<KopField, string>`
    - *Deskripsi:* // COMPANY_KOP; kolom yang dikosongkan memakai kop bawaan server.
  - [`save`](file://apps/web/src/pages/pengaturan/KopCard.tsx#L33-L42) (`apps/web/src/pages/pengaturan/KopCard.tsx:33-42`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* // Ikuti nilai server bila berubah dari perangkat lain (realtime).
  - [`KopCard`](file://apps/web/src/pages/pengaturan/KopCard.tsx#L23-L58) (`apps/web/src/pages/pengaturan/KopCard.tsx:23-58`) [Tipe: `function`]
    - *Signature:* `({ canWrite }: { canWrite: boolean })`

### Sub-sistem: `ext:doc:docbasename` (Klaster #806)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`withExt`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L108-L113) (`apps/web/src/pages/proyek/ProjectDetail.tsx:108-113`) [Tipe: `function`]
    - *Signature:* `(name: string): string`
  - [`docExtOf`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L121-L125) (`apps/web/src/pages/proyek/ProjectDetail.tsx:121-125`) [Tipe: `function`]
    - *Signature:* `(url: string): string`
  - [`docBaseName`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L105-L119) (`apps/web/src/pages/proyek/ProjectDetail.tsx:105-119`) [Tipe: `function`]
    - *Signature:* `(d: StoreItem, url: string): string`

### Sub-sistem: `bru:put:ispublicroute` (Klaster #886)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isPublicRoute`](file://services/api/src/routeList.ts#L30-L32) (`services/api/src/routeList.ts:30-32`) [Tipe: `function`]
    - *Signature:* `(path: string): boolean`
  - [`put`](file://services/api/scripts/gen-bruno.ts#L25-L25) (`services/api/scripts/gen-bruno.ts:25-25`) [Tipe: `function`]
    - *Signature:* `(rel: string, body: string): void`
  - [`bru`](file://services/api/scripts/gen-bruno.ts#L30-L49) (`services/api/scripts/gen-bruno.ts:30-49`) [Tipe: `function`]
    - *Signature:* `(folder: string, name: string, method: string, path: string, opts: { body?: string; docs?: string; script?: string; query?: Record<string, string> } = {}): void`

### Sub-sistem: `diuji:asal:aplikasi` (Klaster #888)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`reportRuns`](file://services/api/scripts/pdf-audit-probe.ts#L36-L46) (`services/api/scripts/pdf-audit-probe.ts:36-46`) [Tipe: `function`]
    - *Signature:* `(kind: string): Promise<Run[]>`
    - *Deskripsi:* /** Laporan tidak punya baris asal: diuji dengan filter yang dipakai aplikasi. */
  - [`idsFor`](file://services/api/scripts/pdf-audit-probe.ts#L24-L31) (`services/api/scripts/pdf-audit-probe.ts:24-31`) [Tipe: `function`]
    - *Signature:* `(kind: string, field: string): Promise<string[]>`
  - [`main`](file://services/api/scripts/pdf-audit-probe.ts#L48-L88) (`services/api/scripts/pdf-audit-probe.ts:48-88`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
    - *Deskripsi:* /** Laporan tidak punya baris asal: diuji dengan filter yang dipakai aplikasi. */

### Sub-sistem: `post:main:assert` (Klaster #890)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`post`](file://services/api/scripts/voucher-probe.ts#L22-L27) (`services/api/scripts/voucher-probe.ts:22-27`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>)`
  - [`assert`](file://services/api/scripts/voucher-probe.ts#L13-L16) (`services/api/scripts/voucher-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`main`](file://services/api/scripts/voucher-probe.ts#L8-L46) (`services/api/scripts/voucher-probe.ts:8-46`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `voucher:voucherprefix:prefix` (Klaster #895)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`voucherPrefix`](file://services/api/src/voucher.ts#L14-L17) (`services/api/src/voucher.ts:14-17`) [Tipe: `function`]
    - *Signature:* `(date: unknown): string`
  - [`nextVoucherNo`](file://services/api/src/voucher.ts#L21-L32) (`services/api/src/voucher.ts:21-32`) [Tipe: `function`]
    - *Signature:* `(date: unknown, taken: Iterable<string> = []): Promise<string>`
  - [`withVoucherNo`](file://services/api/src/voucher.ts#L35-L44) (`services/api/src/voucher.ts:35-44`) [Tipe: `function`]
    - *Signature:* `(data: Data): Promise<Data>`

### Sub-sistem: `csv:rows:read` (Klaster #906)
- **Kepadatan Simbol:** 3 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`splitCsvRow`](file://apps/web/src/utils/readSheet.ts#L94-L110) (`apps/web/src/utils/readSheet.ts:94-110`) [Tipe: `function`]
    - *Signature:* `(line: string, sep: string): string[]`
  - [`readCsvRows`](file://apps/web/src/utils/readSheet.ts#L112-L117) (`apps/web/src/utils/readSheet.ts:112-117`) [Tipe: `function`]
    - *Signature:* `(text: string): string[][]`
  - [`readSheetRows`](file://apps/web/src/utils/readSheet.ts#L120-L124) (`apps/web/src/utils/readSheet.ts:120-124`) [Tipe: `function`]
    - *Signature:* `(file: File): Promise<string[][]>`

### Sub-sistem: `main:assert` (Klaster #62)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/attendance-ingest-probe.ts#L12-L15) (`services/api/scripts/attendance-ingest-probe.ts:12-15`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`main`](file://services/api/scripts/attendance-ingest-probe.ts#L7-L60) (`services/api/scripts/attendance-ingest-probe.ts:7-60`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `main:assert` (Klaster #67)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/checklist-probe.ts#L13-L16) (`services/api/scripts/checklist-probe.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(name: string, cond: boolean, detail = ""): void`
  - [`main`](file://services/api/scripts/checklist-probe.ts#L8-L50) (`services/api/scripts/checklist-probe.ts:8-50`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `legacy:legacytotal:legacynumber` (Klaster #89)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`legacyNumber`](file://services/api/scripts/migrate-boq-docs.ts#L40-L51) (`services/api/scripts/migrate-boq-docs.ts:40-51`) [Tipe: `function`]
    - *Signature:* `(data: Data, field: "totalPrice" | "quantity" | "unitPrice", id: string): number`
  - [`legacyTotal`](file://services/api/scripts/migrate-boq-docs.ts#L53-L62) (`services/api/scripts/migrate-boq-docs.ts:53-62`) [Tipe: `function`]
    - *Signature:* `(data: Data, id: string): number`

### Sub-sistem: `byte:dibandingkan:identik` (Klaster #102)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalizePdf`](file://services/api/scripts/pdf-db-probe.ts#L88-L93) (`services/api/scripts/pdf-db-probe.ts:88-93`) [Tipe: `function`]
    - *Signature:* `(bytes: Uint8Array): string`
    - *Deskripsi:* /**
 * Normalisasi byte PDF sebelum dibandingkan.
 *
 * Dua render dari input yang sama tidak pernah menghasilkan byte identik:
 * jsPDF menulis `/CreationDate` dan `/ID` yang mengandung waktu. Tanpa dua
 * field itu, "cetak ulang identik" akan selalu gagal dan probe ini akan
 * melatih orang untuk menolak assertion yang benar - lebih buruk daripada tidak
 * punya probe. Yang dibandingkan isi dokumennya, bukan stempel waktunya.
 */
  - [`samePdf`](file://services/api/scripts/pdf-db-probe.ts#L95-L98) (`services/api/scripts/pdf-db-probe.ts:95-98`) [Tipe: `function`]
    - *Signature:* `(a: Uint8Array, b: Uint8Array): boolean`
    - *Deskripsi:* /**
 * Normalisasi byte PDF sebelum dibandingkan.
 *
 * Dua render dari input yang sama tidak pernah menghasilkan byte identik:
 * jsPDF menulis `/CreationDate` dan `/ID` yang mengandung waktu. Tanpa dua
 * field itu, "cetak ulang identik" akan selalu gagal dan probe ini akan
 * melatih orang untuk menolak assertion yang benar - lebih buruk daripada tidak
 * punya probe. Yang dibandingkan isi dokumennya, bukan stempel waktunya.
 */

### Sub-sistem: `walk:benar:frontendkinds` (Klaster #103)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`walk`](file://services/api/scripts/pdf-probe.ts#L377-L388) (`services/api/scripts/pdf-probe.ts:377-388`) [Tipe: `function`]
    - *Signature:* `(dir: string): void`
  - [`frontendKinds`](file://services/api/scripts/pdf-probe.ts#L374-L391) (`services/api/scripts/pdf-probe.ts:374-391`) [Tipe: `function`]
    - *Signature:* `(): Map<string, string>`
    - *Deskripsi:* /** Kind PDF yang benar-benar dipanggil di FE. */

### Sub-sistem: `probe:keamanan:fase` (Klaster #110)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`probePassword`](file://services/api/scripts/security-probe.ts#L22-L24) (`services/api/scripts/security-probe.ts:22-24`) [Tipe: `function`]
    - *Signature:* `(purpose: string): string`
    - *Deskripsi:* /**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */
  - [`getSeedPass`](file://services/api/scripts/security-probe.ts#L26-L31) (`services/api/scripts/security-probe.ts:26-31`) [Tipe: `function`]
    - *Signature:* `(username: string): string`
    - *Deskripsi:* /**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */

### Sub-sistem: `main:assert` (Klaster #115)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/token-revocation-probe.ts#L13-L22) (`services/api/scripts/token-revocation-probe.ts:13-22`) [Tipe: `function`]
    - *Signature:* `(name: string, ok: boolean, details?: string)`
  - [`main`](file://services/api/scripts/token-revocation-probe.ts#L5-L110) (`services/api/scripts/token-revocation-probe.ts:5-110`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `main:assert` (Klaster #116)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/user-hierarchy-probe.ts#L24-L33) (`services/api/scripts/user-hierarchy-probe.ts:24-33`) [Tipe: `function`]
    - *Signature:* `(name: string, ok: boolean, details?: string)`
  - [`main`](file://services/api/scripts/user-hierarchy-probe.ts#L5-L101) (`services/api/scripts/user-hierarchy-probe.ts:5-101`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `requestactor:registerboqdocroutes:actor` (Klaster #123)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`requestActor`](file://services/api/src/audit.ts#L47-L50) (`services/api/src/audit.ts:47-50`) [Tipe: `function`]
    - *Signature:* `(req: FastifyRequest): string`
  - [`registerBoqDocRoutes`](file://services/api/src/routes/boqDocs.ts#L15-L41) (`services/api/src/routes/boqDocs.ts:15-41`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `norm:branchallowed:allowed` (Klaster #129)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`norm`](file://services/api/src/auth.ts#L81-L81) (`services/api/src/auth.ts:81-81`) [Tipe: `function`]
    - *Signature:* `(v: unknown): string`
  - [`branchAllowed`](file://services/api/src/auth.ts#L80-L88) (`services/api/src/auth.ts:80-88`) [Tipe: `function`]
    - *Signature:* `(user: AuthUser | undefined, asked: string): boolean`

### Sub-sistem: `constructor:branchscoperesolutionerror:resolution` (Klaster #130)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/auth.ts#L91-L94) (`services/api/src/auth.ts:91-94`) [Tipe: `method`]
    - *Signature:* `()`
  - [`BranchScopeResolutionError`](file://services/api/src/auth.ts#L90-L95) (`services/api/src/auth.ts:90-95`) [Tipe: `class`]
    - *Signature:* `class BranchScopeResolutionError`

### Sub-sistem: `constructor:boqerror:boq` (Klaster #138)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/boqDocs.ts#L33-L35) (`services/api/src/boqDocs.ts:33-35`) [Tipe: `method`]
    - *Signature:* `(public status: 404 | 409 | 422, message: string, public code: string)`
  - [`BoqError`](file://services/api/src/boqDocs.ts#L32-L36) (`services/api/src/boqDocs.ts:32-36`) [Tipe: `class`]
    - *Signature:* `class BoqError`

### Sub-sistem: `constructor:coerror:error` (Klaster #143)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/changeOrders.ts#L20-L20) (`services/api/src/changeOrders.ts:20-20`) [Tipe: `method`]
    - *Signature:* `(public status: 403 | 404 | 409 | 422, message: string, public code: string)`
  - [`CoError`](file://services/api/src/changeOrders.ts#L19-L21) (`services/api/src/changeOrders.ts:19-21`) [Tipe: `class`]
    - *Signature:* `class CoError`

### Sub-sistem: `sqlite:ensuresqlite:resolvesqlitepath` (Klaster #149)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ensureSqlite`](file://services/api/src/db.ts#L43-L50) (`services/api/src/db.ts:43-50`) [Tipe: `function`]
    - *Signature:* `(): Database.Database`
  - [`resolveSqlitePath`](file://services/api/src/db.ts#L29-L39) (`services/api/src/db.ts:29-39`) [Tipe: `function`]
    - *Signature:* `(): string`

### Sub-sistem: `len:stagehasdata:stage` (Klaster #153)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`len`](file://services/api/src/domainGuards.ts#L9-L9) (`services/api/src/domainGuards.ts:9-9`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`stageHasData`](file://services/api/src/domainGuards.ts#L13-L16) (`services/api/src/domainGuards.ts:13-16`) [Tipe: `function`]
    - *Signature:* `(stage: Data): boolean`

### Sub-sistem: `bom:bomitemerror:bomallocationerror` (Klaster #157)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`bomAllocationError`](file://services/api/src/domainGuards.ts#L138-L154) (`services/api/src/domainGuards.ts:138-154`) [Tipe: `function`]
    - *Signature:* `(alokasi: unknown, need: number): string | null`
  - [`bomItemError`](file://services/api/src/domainGuards.ts#L156-L170) (`services/api/src/domainGuards.ts:156-170`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string | null, data: Data): Promise<string | null>`

### Sub-sistem: `parseorigins:origins:loadenv` (Klaster #159)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadEnv`](file://services/api/src/env.ts#L29-L153) (`services/api/src/env.ts:29-153`) [Tipe: `function`]
    - *Signature:* `(): Env`
  - [`parseOrigins`](file://services/api/src/env.ts#L19-L27) (`services/api/src/env.ts:19-27`) [Tipe: `function`]
    - *Signature:* `(): string[]`

### Sub-sistem: `fail:registererrorhandler:handler` (Klaster #160)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fail`](file://services/api/src/envelope.ts#L8-L10) (`services/api/src/envelope.ts:8-10`) [Tipe: `function`]
    - *Signature:* `(message: string, code?: string): { ok: false; error: { message: string; code?: string } }`
  - [`registerErrorHandler`](file://services/api/src/envelope.ts#L12-L37) (`services/api/src/envelope.ts:12-37`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `initfonts:main:fonts` (Klaster #161)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`initFonts`](file://services/api/src/pdf/font.ts#L134-L138) (`services/api/src/pdf/font.ts:134-138`) [Tipe: `function`]
    - *Signature:* `(dir: string): void`
  - [`main`](file://services/api/src/index.ts#L6-L23) (`services/api/src/index.ts:6-23`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `constructor:issueerror:issue` (Klaster #166)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/inventoryIssue.ts#L12-L12) (`services/api/src/inventoryIssue.ts:12-12`) [Tipe: `method`]
    - *Signature:* `(public status: 404 | 409 | 422, message: string, public code: string)`
  - [`IssueError`](file://services/api/src/inventoryIssue.ts#L11-L13) (`services/api/src/inventoryIssue.ts:11-13`) [Tipe: `class`]
    - *Signature:* `class IssueError`

### Sub-sistem: `constructor:materialerror:material` (Klaster #173)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/materialRequests.ts#L20-L22) (`services/api/src/materialRequests.ts:20-22`) [Tipe: `method`]
    - *Signature:* `(public status: 404 | 409 | 422, message: string, public code: string)`
  - [`MaterialError`](file://services/api/src/materialRequests.ts#L19-L23) (`services/api/src/materialRequests.ts:19-23`) [Tipe: `class`]
    - *Signature:* `class MaterialError`

### Sub-sistem: `constructor:poerror:error` (Klaster #183)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/poFulfillment.ts#L24-L26) (`services/api/src/poFulfillment.ts:24-26`) [Tipe: `method`]
    - *Signature:* `(public status: 404 | 409 | 422, message: string, public code: string)`
  - [`PoError`](file://services/api/src/poFulfillment.ts#L23-L27) (`services/api/src/poFulfillment.ts:23-27`) [Tipe: `class`]
    - *Signature:* `class PoError`

### Sub-sistem: `tabel:checkrefs:idcolumn` (Klaster #212)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`idColumn`](file://services/api/src/refs.ts#L98-L100) (`services/api/src/refs.ts:98-100`) [Tipe: `function`]
    - *Signature:* `(table: string): string`
    - *Deskripsi:* // Tabel yang dikecualikan dari delete-guard (tabel konfigurasi/admin).
  - [`checkRefs`](file://services/api/src/refs.ts#L113-L147) (`services/api/src/refs.ts:113-147`) [Tipe: `function`]
    - *Signature:* `(table: string, data: Record<string, unknown>): Promise<string | null>`

### Sub-sistem: `jsoneq:findusages:usages` (Klaster #213)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`jsonEq`](file://services/api/src/refs.ts#L105-L110) (`services/api/src/refs.ts:105-110`) [Tipe: `function`]
    - *Signature:* `(field: string): string`
  - [`findUsages`](file://services/api/src/refs.ts#L150-L185) (`services/api/src/refs.ts:150-185`) [Tipe: `function`]
    - *Signature:* `(table: string, id: string): Promise<string[]>`

### Sub-sistem: `constructor:serviceerror:service` (Klaster #240)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/serviceApproval.ts#L26-L28) (`services/api/src/serviceApproval.ts:26-28`) [Tipe: `method`]
    - *Signature:* `(public status: 403 | 404 | 409 | 422, message: string, public code: string)`
  - [`ServiceError`](file://services/api/src/serviceApproval.ts#L25-L29) (`services/api/src/serviceApproval.ts:25-29`) [Tipe: `class`]
    - *Signature:* `class ServiceError`

### Sub-sistem: `normalizenewservice:hasproject:normalize` (Klaster #241)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`hasProject`](file://services/api/src/serviceApproval.ts#L45-L47) (`services/api/src/serviceApproval.ts:45-47`) [Tipe: `function`]
    - *Signature:* `(d: Data): boolean`
  - [`normalizeNewService`](file://services/api/src/serviceApproval.ts#L51-L55) (`services/api/src/serviceApproval.ts:51-55`) [Tipe: `function`]
    - *Signature:* `(data: Data): Data`

### Sub-sistem: `spk:spklockerror:caneditspk` (Klaster #245)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`canEditSpk`](file://services/api/src/workOrderGuard.ts#L11-L13) (`services/api/src/workOrderGuard.ts:11-13`) [Tipe: `function`]
    - *Signature:* `(role: unknown): boolean`
  - [`spkLockError`](file://services/api/src/workOrderGuard.ts#L16-L24) (`services/api/src/workOrderGuard.ts:16-24`) [Tipe: `function`]
    - *Signature:* `(table: string, before: Data | null, after: Data | null, role: unknown): string | null`

### Sub-sistem: `loadsession:getrole:izin` (Klaster #248)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadSession`](file://apps/web/src/auth/auth.tsx#L71-L78) (`apps/web/src/auth/auth.tsx:71-78`) [Tipe: `function`]
    - *Signature:* `(): Session | null`
    - *Deskripsi:* /**
 * Pengecekan izin modular berbasis matriks policy server (ADR-0004 & F2-05).
 */
  - [`getRole`](file://apps/web/src/auth/auth.tsx#L81-L83) (`apps/web/src/auth/auth.tsx:81-83`) [Tipe: `function`]
    - *Signature:* `(): string | null`

### Sub-sistem: `auth:useauth:requireauth` (Klaster #252)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`useAuth`](file://apps/web/src/auth/auth.tsx#L258-L260) (`apps/web/src/auth/auth.tsx:258-260`) [Tipe: `function`]
    - *Signature:* `()`
  - [`RequireAuth`](file://apps/web/src/auth/auth.tsx#L262-L269) (`apps/web/src/auth/auth.tsx:262-269`) [Tipe: `function`]
    - *Signature:* `({ children }: { children: ReactNode })`

### Sub-sistem: `confirmdroppending:drop:restoreoriginal` (Klaster #256)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`confirmDropPending`](file://apps/web/src/auth/demoSwitch.ts#L43-L50) (`apps/web/src/auth/demoSwitch.ts:43-50`) [Tipe: `function`]
    - *Signature:* `(): boolean`
    - *Deskripsi:* /** Peran yang boleh dipilih (kosong bila fitur mati / bukan direktur-developer). */
  - [`restoreOriginal`](file://apps/web/src/auth/demoSwitch.ts#L77-L91) (`apps/web/src/auth/demoSwitch.ts:77-91`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`

### Sub-sistem: `loginasrole:resetcachefor:dipilih` (Klaster #257)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`resetCacheFor`](file://apps/web/src/auth/demoSwitch.ts#L52-L55) (`apps/web/src/auth/demoSwitch.ts:52-55`) [Tipe: `function`]
    - *Signature:* `(userId: string): Promise<void>`
    - *Deskripsi:* /** Peran yang boleh dipilih (kosong bila fitur mati / bukan direktur-developer). */
  - [`loginAsRole`](file://apps/web/src/auth/demoSwitch.ts#L105-L120) (`apps/web/src/auth/demoSwitch.ts:105-120`) [Tipe: `function`]
    - *Signature:* `(role: string, to = "/dashboard"): Promise<void>`

### Sub-sistem: `run:demoroleswitcher:switcher` (Klaster #275)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`run`](file://apps/web/src/components/DemoRoleSwitcher.tsx#L30-L36) (`apps/web/src/components/DemoRoleSwitcher.tsx:30-36`) [Tipe: `function`]
    - *Signature:* `(fn: () => Promise<void>)`
  - [`DemoRoleSwitcher`](file://apps/web/src/components/DemoRoleSwitcher.tsx#L12-L65) (`apps/web/src/components/DemoRoleSwitcher.tsx:12-65`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `select:search:mapsearchselectoptions` (Klaster #286)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mapSearchSelectOptions`](file://apps/web/src/components/SearchSelect.tsx#L11-L13) (`apps/web/src/components/SearchSelect.tsx:11-13`) [Tipe: `function`]
    - *Signature:* `(options: readonly SearchSelectOption[]): PickerOption[]`
  - [`SearchSelect`](file://apps/web/src/components/SearchSelect.tsx#L16-L64) (`apps/web/src/components/SearchSelect.tsx:16-64`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  emptyText,
  className,
  disabled,
  allowCustom,
  required,
  invalid,
  onOpenChange,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  required?: boolean;
  invalid?: boolean;
  onOpenChange?: (open: boolean) => void;
})`

### Sub-sistem: `compactmoney:kpicard:compact` (Klaster #309)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`compactMoney`](file://apps/web/src/components/ui.tsx#L340-L345) (`apps/web/src/components/ui.tsx:340-345`) [Tipe: `function`]
    - *Signature:* `(value: string): string`
    - *Deskripsi:* /** Teks status sesuai locale aktif (nilai data tidak diubah). */
  - [`KpiCard`](file://apps/web/src/components/ui.tsx#L347-L419) (`apps/web/src/components/ui.tsx:347-419`) [Tipe: `function`]
    - *Signature:* `({
  label,
  value,
  delta,
  deltaDirection = "up",
  icon,
  hint,
  spark,
  chip = "navy",
  tone,
}: {
  tone?: keyof typeof kpiTone;
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  icon?: ReactNode;
  hint?: string;
  spark?: { name: string; v: number }[];
  chip?: keyof typeof gradientChip;
})`

### Sub-sistem: `modal:onkey:key` (Klaster #320)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`onKey`](file://apps/web/src/components/ui.tsx#L815-L828) (`apps/web/src/components/ui.tsx:815-828`) [Tipe: `function`]
    - *Signature:* `(e: KeyboardEvent)`
  - [`Modal`](file://apps/web/src/components/ui.tsx#L787-L898) (`apps/web/src/components/ui.tsx:787-898`) [Tipe: `function`]
    - *Signature:* `({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
  extraWide = false,
  fullWidth = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  extraWide?: boolean;
  /** Tabel lebar (checklist BOM): hampir selebar layar. */
  fullWidth?: boolean;
})`

### Sub-sistem: `001:inv:search` (Klaster #324)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`searchText`](file://apps/web/src/components/ui.tsx#L979-L991) (`apps/web/src/components/ui.tsx:979-991`) [Tipe: `function`]
    - *Signature:* `(value: unknown, depth = 0): string`
    - *Deskripsi:* /**
 * Poin tebakan: seluruh kata harus cocok, di field yang DIMINTAKAN.
 * Sebagian lama memakai `includes` pada satu field gabungan, jadi "INV 001"
 * tidak pernah menemukan "INV-001" dan nomor dokumen tidak bisa dicari sama
 * sekali - search-nya ada tapi tidak berguna.
 */
  - [`rowMatches`](file://apps/web/src/components/ui.tsx#L993-L1005) (`apps/web/src/components/ui.tsx:993-1005`) [Tipe: `function`]
    - *Signature:* `(
  row: T,
  query: string,
  fields: readonly (keyof T & string)[],
): boolean`

### Sub-sistem: `use:uselistsearch:usedebouncedvalue` (Klaster #341)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`useDebouncedValue`](file://apps/web/src/components/ui.tsx#L2071-L2078) (`apps/web/src/components/ui.tsx:2071-2078`) [Tipe: `function`]
    - *Signature:* `(value: T, delay = 200): T`
  - [`useListSearch`](file://apps/web/src/components/ui.tsx#L1007-L1017) (`apps/web/src/components/ui.tsx:1007-1017`) [Tipe: `function`]
    - *Signature:* `(delay = 200)`

### Sub-sistem: `run:usebusy:busy` (Klaster #330)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`run`](file://apps/web/src/components/ui.tsx#L1419-L1429) (`apps/web/src/components/ui.tsx:1419-1429`) [Tipe: `function`]
    - *Signature:* `(key: string, fn: () => Promise<T> | T): Promise<T | void>`
  - [`useBusy`](file://apps/web/src/components/ui.tsx#L1411-L1431) (`apps/web/src/components/ui.tsx:1411-1431`) [Tipe: `function`]
    - *Signature:* `(): {
  isBusy: (k: string) => boolean;
  run: <T>(key: string, fn: () => Promise<T> | T) => Promise<T | void>;
}`

### Sub-sistem: `asyncbutton:useasyncaction:button` (Klaster #331)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`useAsyncAction`](file://apps/web/src/components/ui.tsx#L1438-L1456) (`apps/web/src/components/ui.tsx:1438-1456`) [Tipe: `function`]
    - *Signature:* `(): {
  pending: boolean;
  run: <T>(fn: () => Promise<T> | T) => Promise<T | undefined>;
}`
  - [`AsyncButton`](file://apps/web/src/components/ui.tsx#L1460-L1506) (`apps/web/src/components/ui.tsx:1460-1506`) [Tipe: `function`]
    - *Signature:* `({
  onAction,
  className = "btn-secondary",
  disabled = false,
  onError,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled"> & {
  onAction: () => Promise<unknown> | unknown;
  disabled?: boolean;
  /** Handler error opsional. Tanpa ini, penolakan onAction akan muncul
   *  sebagai unhandled rejection karena pemanggil memakai `void run(...)`. */
  onError?: (err: unknown) => void;
})`

### Sub-sistem: `useserverpager:pager:server` (Klaster #334)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`go`](file://apps/web/src/components/ui.tsx#L1650-L1650) (`apps/web/src/components/ui.tsx:1650-1650`) [Tipe: `function`]
    - *Signature:* `(p: number)`
  - [`useServerPager`](file://apps/web/src/components/ui.tsx#L1585-L1653) (`apps/web/src/components/ui.tsx:1585-1653`) [Tipe: `function`]
    - *Signature:* `(
  load: (page: number, size: number) => Promise<ServerPage<T>>,
  filterKey: string,
  defaultSize = 25,
  enabled = true,
): {
  page: number;
  size: number;
  pages: number;
  total: number;
  rows: T[];
  loading: boolean;
  go: (p: number) => void;
  bar: ReactNode;
}`

### Sub-sistem: `format:moneyinput:money` (Klaster #340)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`format`](file://apps/web/src/components/ui.tsx#L2008-L2012) (`apps/web/src/components/ui.tsx:2008-2012`) [Tipe: `function`]
    - *Signature:* `(raw: string): string`
  - [`MoneyInput`](file://apps/web/src/components/ui.tsx#L2004-L2022) (`apps/web/src/components/ui.tsx:2004-2022`) [Tipe: `function`]
    - *Signature:* `({ value, onChange, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (v: string) => void;
})`

### Sub-sistem: `splithighlight:usedeeplinkparams:params` (Klaster #343)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`splitHighlight`](file://apps/web/src/components/useDeepLink.ts#L52-L59) (`apps/web/src/components/useDeepLink.ts:52-59`) [Tipe: `function`]
    - *Signature:* `(highlight: string): string[]`
  - [`useDeepLinkParams`](file://apps/web/src/components/useDeepLink.ts#L37-L45) (`apps/web/src/components/useDeepLink.ts:37-45`) [Tipe: `function`]
    - *Signature:* `(): DeepLinkParams`

### Sub-sistem: `deep:link:usedeeplinktarget` (Klaster #344)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`allowlistedDeepLinkTab`](file://apps/web/src/components/useDeepLink.ts#L62-L65) (`apps/web/src/components/useDeepLink.ts:62-65`) [Tipe: `function`]
    - *Signature:* `(tab: string, allowedTabs?: readonly string[]): string`
  - [`useDeepLinkTarget`](file://apps/web/src/components/useDeepLink.ts#L74-L107) (`apps/web/src/components/useDeepLink.ts:74-107`) [Tipe: `function`]
    - *Signature:* `(
  tab: string,
  highlight: string,
  setTab: (next: string) => void,
  resolve: (ids: string[]) => void,
  deps: unknown[] = [],
  allowedTabs?: readonly string[],
): void`

### Sub-sistem: `scopealertstoredata:rowsinbranch:alert` (Klaster #376)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rowsInBranch`](file://apps/web/src/data/branchScope.ts#L2-L10) (`apps/web/src/data/branchScope.ts:2-10`) [Tipe: `function`]
    - *Signature:* `(rows: T[], branch: string): T[]`
  - [`scopeAlertStoreData`](file://apps/web/src/data/scopeAlertData.ts#L6-L21) (`apps/web/src/data/scopeAlertData.ts:6-21`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape, branch: string): StoreShape`

### Sub-sistem: `idbput:indexeddb:localstorage` (Klaster #354)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`tx`](file://apps/web/src/data/idb.ts#L74-L96) (`apps/web/src/data/idb.ts:74-96`) [Tipe: `function`]
    - *Signature:* `(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null>`
    - *Deskripsi:* /** true bila IndexedDB aktif dipakai (false = sedang fallback localStorage). */
  - [`idbPut`](file://apps/web/src/data/idb.ts#L99-L102) (`apps/web/src/data/idb.ts:99-102`) [Tipe: `function`]
    - *Signature:* `(col: string, value: unknown): Promise<boolean>`

### Sub-sistem: `finish:idbgetall:idb` (Klaster #355)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`finish`](file://apps/web/src/data/idb.ts#L116-L126) (`apps/web/src/data/idb.ts:116-126`) [Tipe: `function`]
    - *Signature:* `()`
  - [`idbGetAll`](file://apps/web/src/data/idb.ts#L105-L135) (`apps/web/src/data/idb.ts:105-135`) [Tipe: `function`]
    - *Signature:* `(): Promise<Record<string, unknown> | null>`

### Sub-sistem: `isprojectarraymap:mergeofflinevalues:values` (Klaster #373)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isProjectArrayMap`](file://apps/web/src/data/offlinePersistence.ts#L10-L15) (`apps/web/src/data/offlinePersistence.ts:10-15`) [Tipe: `function`]
    - *Signature:* `(value: unknown): value is Record<string, unknown[]>`
  - [`mergeOfflineValues`](file://apps/web/src/data/offlinePersistence.ts#L25-L43) (`apps/web/src/data/offlinePersistence.ts:25-43`) [Tipe: `function`]
    - *Signature:* `(
  current: T,
  cached: Record<string, unknown>,
): T`

### Sub-sistem: `persistscopedcollections:isstringmap:scoped` (Klaster #374)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`persistScopedCollections`](file://apps/web/src/data/offlinePersistence.ts#L46-L71) (`apps/web/src/data/offlinePersistence.ts:46-71`) [Tipe: `function`]
    - *Signature:* `(
  source: Record<string, unknown>,
  collections: readonly string[],
  isCurrentScope: () => boolean,
  io: OfflinePersistenceIO,
): Promise<number>`
  - [`isStringMap`](file://apps/web/src/data/offlinePersistence.ts#L17-L22) (`apps/web/src/data/offlinePersistence.ts:17-22`) [Tipe: `function`]
    - *Signature:* `(value: unknown): value is Record<string, string>`

### Sub-sistem: `createsessionfence:iscurrent:fence` (Klaster #379)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isCurrent`](file://apps/web/src/data/sessionFence.ts#L8-L8) (`apps/web/src/data/sessionFence.ts:8-8`) [Tipe: `function`]
    - *Signature:* `()`
  - [`createSessionFence`](file://apps/web/src/data/sessionFence.ts#L7-L15) (`apps/web/src/data/sessionFence.ts:7-15`) [Tipe: `function`]
    - *Signature:* `(expectedScope: string, readCurrentScope: () => string): SessionFence`

### Sub-sistem: `read:biar:loadstore` (Klaster #389)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`read`](file://apps/web/src/data/store.tsx#L561-L572) (`apps/web/src/data/store.tsx:561-572`) [Tipe: `function`]
    - *Signature:* `(storage: Storage, key: string): Partial<StoreShape> | null`
    - *Deskripsi:* // selalu gagal. Dibaca sekali untuk migrasi, lalu dihapus biar kuota bebas.
  - [`loadStore`](file://apps/web/src/data/store.tsx#L556-L583) (`apps/web/src/data/store.tsx:556-583`) [Tipe: `function`]
    - *Signature:* `(): StoreShape`

### Sub-sistem: `usefulfillmaterialrequest:mrstatus:fulfill` (Klaster #398)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mrStatus`](file://apps/web/src/data/useMaterialRequest.ts#L43-L46) (`apps/web/src/data/useMaterialRequest.ts:43-46`) [Tipe: `function`]
    - *Signature:* `(issued: number, shortage: number, hadShortage: boolean): MrStatus`
  - [`useFulfillMaterialRequest`](file://apps/web/src/data/useMaterialRequest.ts#L238-L287) (`apps/web/src/data/useMaterialRequest.ts:238-287`) [Tipe: `function`]
    - *Signature:* `(): (id: string, actor?: string) => Promise<FulfillResult>`

### Sub-sistem: `batch:sia:efek` (Klaster #399)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`setSyncActive`](file://apps/web/src/data/useModuleSync.ts#L48-L52) (`apps/web/src/data/useModuleSync.ts:48-52`) [Tipe: `function`]
    - *Signature:* `(delta: 1 | -1): void`
    - *Deskripsi:* /** true bila ada halaman yang baru saja menarik batch-nya sendiri (< withinMs).
 *  Dipakai AppShell untuk melewati resync penuh saat pindah route.
 *
 *  Dua kondisi yang WAJIB ikut dicek, bukan hanya cap waktu:
 *   - batch sedang berjalan: resync penuh menambah ~55 request sia-sia hanya
 *     untuk mengambil data yang sedang dirakit. AppShell memanggil ini di
 *     efek parent yang berjalan di commit yang SAMA dengan efek halaman, jadi
 *     cap waktu "baru saja" belum pernah ditulis - hasilnya dua tarikan
 *     paralel di setiap pindah rute, dan jendela "snapshot basi" yang
 *     menimpa tulis lokal ikut memanjang.
 *   - lebih dari satu batch jalan bersamaan: 15 modul bisa memicu
 *     resyncCollections sekaligus; setiap Tarikan punya snapshot basi sendiri. */
  - [`useProjectWbsSync`](file://apps/web/src/data/useModuleSync.ts#L217-L264) (`apps/web/src/data/useModuleSync.ts:217-264`) [Tipe: `function`]
    - *Signature:* `(
  projectIds: string[],
): { syncing: boolean; byProject: Record<string, WbsItem[]> }`

### Sub-sistem: `batch:berjalan:halaman` (Klaster #400)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`publishFailed`](file://apps/web/src/data/useModuleSync.ts#L77-L82) (`apps/web/src/data/useModuleSync.ts:77-82`) [Tipe: `function`]
    - *Signature:* `(batch: string[], failed: string[]): void`
    - *Deskripsi:* /** true bila ada batch modul yang sedang berjalan (semua halaman).
 *  Dipakai AppShell untuk badge topbar; halaman juga bisa memakainya untuk
 *  menonaktifkan tombol ekspor selama batch berjalan. */
  - [`useModuleSync`](file://apps/web/src/data/useModuleSync.ts#L111-L197) (`apps/web/src/data/useModuleSync.ts:111-197`) [Tipe: `function`]
    - *Signature:* `(cols: CollectionKey[], deps: unknown[] = []): ModuleSync`

### Sub-sistem: `approval:useserviceapproval:approvalof` (Klaster #409)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`approvalOf`](file://apps/web/src/data/useServiceApproval.ts#L11-L14) (`apps/web/src/data/useServiceApproval.ts:11-14`) [Tipe: `function`]
    - *Signature:* `(s: Record<string, unknown>): ServiceApproval`
  - [`useServiceApproval`](file://apps/web/src/data/useServiceApproval.ts#L21-L44) (`apps/web/src/data/useServiceApproval.ts:21-44`) [Tipe: `function`]
    - *Signature:* `(): (id: string, approval: ServiceApproval, note: string, actor: string) => Promise<void>`

### Sub-sistem: `loadlocale:languageprovider:language` (Klaster #412)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadLocale`](file://apps/web/src/i18n/LanguageContext.tsx#L11-L18) (`apps/web/src/i18n/LanguageContext.tsx:11-18`) [Tipe: `function`]
    - *Signature:* `(): Locale`
    - *Deskripsi:* // Status DATA tidak diterjemahkan nilainya - pakai status.ts (label saja).
  - [`LanguageProvider`](file://apps/web/src/i18n/LanguageContext.tsx#L28-L46) (`apps/web/src/i18n/LanguageContext.tsx:28-46`) [Tipe: `function`]
    - *Signature:* `({ children }: { children: ReactNode })`

### Sub-sistem: `tileuri:tile:uri` (Klaster #419)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`escapeXml`](file://apps/web/src/security/watermark.tsx#L61-L63) (`apps/web/src/security/watermark.tsx:61-63`) [Tipe: `function`]
    - *Signature:* `(s: string): string`
  - [`tileUri`](file://apps/web/src/security/watermark.tsx#L65-L80) (`apps/web/src/security/watermark.tsx:65-80`) [Tipe: `function`]
    - *Signature:* `(lines: string[]): string`

### Sub-sistem: `paintlayer:paint:layer` (Klaster #420)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`paintLayer`](file://apps/web/src/security/watermark.tsx#L84-L92) (`apps/web/src/security/watermark.tsx:84-92`) [Tipe: `function`]
    - *Signature:* `(el: HTMLElement, bg: string)`
  - [`ensureDom`](file://apps/web/src/security/watermark.tsx#L94-L124) (`apps/web/src/security/watermark.tsx:94-124`) [Tipe: `function`]
    - *Signature:* `(bg: string, printText: string)`

### Sub-sistem: `misclocale:misc:exportchartpng` (Klaster #424)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`miscLocale`](file://apps/web/src/pages/Analytics.tsx#L122-L126) (`apps/web/src/pages/Analytics.tsx:122-126`) [Tipe: `function`]
    - *Signature:* `(): "id" | "en"`
  - [`exportChartPNG`](file://apps/web/src/pages/Analytics.tsx#L128-L159) (`apps/web/src/pages/Analytics.tsx:128-159`) [Tipe: `function`]
    - *Signature:* `(chartId: string, filename: string): void`

### Sub-sistem: `num:postcashjournal:unik` (Klaster #431)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/services/autoJournal.ts#L22-L22) (`apps/web/src/services/autoJournal.ts:22-22`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
    - *Deskripsi:* // Idempoten via dokumen unik - aman dipanggil ulang / dari aksi massal.
  - [`postCashJournal`](file://apps/web/src/services/autoJournal.ts#L34-L59) (`apps/web/src/services/autoJournal.ts:34-59`) [Tipe: `function`]
    - *Signature:* `(args: CashJournalArgs): Promise<boolean>`

### Sub-sistem: `constructor:filehttperror:http` (Klaster #433)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://apps/web/src/services/files.ts#L89-L93) (`apps/web/src/services/files.ts:89-93`) [Tipe: `method`]
    - *Signature:* `(status: number)`
  - [`FileHttpError`](file://apps/web/src/services/files.ts#L87-L94) (`apps/web/src/services/files.ts:87-94`) [Tipe: `class`]
    - *Signature:* `class FileHttpError`

### Sub-sistem: `constructor:apinotconfigured:not` (Klaster #435)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://apps/web/src/services/http.ts#L14-L17) (`apps/web/src/services/http.ts:14-17`) [Tipe: `method`]
    - *Signature:* `()`
  - [`ApiNotConfigured`](file://apps/web/src/services/http.ts#L13-L18) (`apps/web/src/services/http.ts:13-18`) [Tipe: `class`]
    - *Signature:* `class ApiNotConfigured`

### Sub-sistem: `constructor:apierror:api` (Klaster #436)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://apps/web/src/services/http.ts#L25-L32) (`apps/web/src/services/http.ts:25-32`) [Tipe: `method`]
    - *Signature:* `(status: number, message: string, code?: string, data?: unknown, retryAfterSec?: number)`
  - [`ApiError`](file://apps/web/src/services/http.ts#L20-L33) (`apps/web/src/services/http.ts:20-33`) [Tipe: `class`]
    - *Signature:* `class ApiError`

### Sub-sistem: `jwt:safestorage:clearjwt` (Klaster #438)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`safeStorage`](file://apps/web/src/services/http.ts#L39-L46) (`apps/web/src/services/http.ts:39-46`) [Tipe: `function`]
    - *Signature:* `(): Storage | null`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.
  - [`clearJwt`](file://apps/web/src/services/http.ts#L73-L80) (`apps/web/src/services/http.ts:73-80`) [Tipe: `function`]
    - *Signature:* `(): void`

### Sub-sistem: `jwt:setjwt:notifysessionchange` (Klaster #437)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`notifySessionChange`](file://apps/web/src/services/http.ts#L48-L54) (`apps/web/src/services/http.ts:48-54`) [Tipe: `function`]
    - *Signature:* `(): void`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.
  - [`setJwt`](file://apps/web/src/services/http.ts#L56-L63) (`apps/web/src/services/http.ts:56-63`) [Tipe: `function`]
    - *Signature:* `(token: string): void`

### Sub-sistem: `bearer:dikirim:authorization` (Klaster #439)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`notifyAuthExpired`](file://apps/web/src/services/http.ts#L138-L153) (`apps/web/src/services/http.ts:138-153`) [Tipe: `function`]
    - *Signature:* `(): void`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.
  - [`verifySessionAfterBackground401`](file://apps/web/src/services/http.ts#L162-L169) (`apps/web/src/services/http.ts:162-169`) [Tipe: `function`]
    - *Signature:* `(): void`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.

### Sub-sistem: `pdf:ispdfhead:head` (Klaster #450)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isPdfHead`](file://apps/web/src/services/pdfClient.ts#L35-L41) (`apps/web/src/services/pdfClient.ts:35-41`) [Tipe: `function`]
    - *Signature:* `(head: ArrayLike<number>): boolean`
  - [`reprintPdf`](file://apps/web/src/services/pdfClient.ts#L175-L212) (`apps/web/src/services/pdfClient.ts:175-212`) [Tipe: `function`]
    - *Signature:* `(modelId: string): Promise<PdfRenderResult>`

### Sub-sistem: `constructor:pdfrendererror:render` (Klaster #447)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://apps/web/src/services/pdfClient.ts#L63-L67) (`apps/web/src/services/pdfClient.ts:63-67`) [Tipe: `method`]
    - *Signature:* `(message: string, status: number)`
  - [`PdfRenderError`](file://apps/web/src/services/pdfClient.ts#L61-L68) (`apps/web/src/services/pdfClient.ts:61-68`) [Tipe: `class`]
    - *Signature:* `class PdfRenderError`

### Sub-sistem: `render:pdf:renderpdf` (Klaster #449)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`renderPdfFrom`](file://apps/web/src/services/pdfClient.ts#L107-L158) (`apps/web/src/services/pdfClient.ts:107-158`) [Tipe: `function`]
    - *Signature:* `(
  base: string,
  jwt: string,
  req: PdfRequest,
): Promise<PdfRenderResult>`
  - [`renderPdf`](file://apps/web/src/services/pdfClient.ts#L161-L166) (`apps/web/src/services/pdfClient.ts:161-166`) [Tipe: `function`]
    - *Signature:* `(req: PdfRequest): Promise<PdfRenderResult>`

### Sub-sistem: `2026:key:dinormalkan` (Klaster #459)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`key`](file://apps/web/src/services/repositories.ts#L130-L130) (`apps/web/src/services/repositories.ts:130-130`) [Tipe: `function`]
    - *Signature:* `(r: StoreItem): string`
    - *Deskripsi:* // Dinormalkan lewat createdAtOf: tanggal lama seperti "2026-9-5" tidak boleh mengalahkan "2026-10-01".
  - [`stableOrder`](file://apps/web/src/services/repositories.ts#L128-L132) (`apps/web/src/services/repositories.ts:128-132`) [Tipe: `function`]
    - *Signature:* `(rows: StoreItem[]): StoreItem[]`

### Sub-sistem: `constructor:uploadnotconfigured:not` (Klaster #461)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://apps/web/src/services/upload.ts#L10-L13) (`apps/web/src/services/upload.ts:10-13`) [Tipe: `method`]
    - *Signature:* `()`
  - [`UploadNotConfigured`](file://apps/web/src/services/upload.ts#L9-L14) (`apps/web/src/services/upload.ts:9-14`) [Tipe: `class`]
    - *Signature:* `class UploadNotConfigured`

### Sub-sistem: `hiddencount:hidden:visibleitems` (Klaster #470)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`visibleItems`](file://apps/web/src/utils/bannerDismiss.ts#L91-L95) (`apps/web/src/utils/bannerDismiss.ts:91-95`) [Tipe: `function`]
    - *Signature:* `(items: ModuleAlertItem[], dismissed: readonly AlertLevel[]): ModuleAlertItem[]`
  - [`hiddenCount`](file://apps/web/src/utils/bannerDismiss.ts#L98-L100) (`apps/web/src/utils/bannerDismiss.ts:98-100`) [Tipe: `function`]
    - *Signature:* `(items: ModuleAlertItem[], dismissed: readonly AlertLevel[]): number`

### Sub-sistem: `draft:usedraftstate:loaddraft` (Klaster #481)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadDraft`](file://apps/web/src/utils/draft.ts#L6-L14) (`apps/web/src/utils/draft.ts:6-14`) [Tipe: `function`]
    - *Signature:* `(key: string, fallback: T): T`
  - [`useDraftState`](file://apps/web/src/utils/draft.ts#L16-L29) (`apps/web/src/utils/draft.ts:16-29`) [Tipe: `function`]
    - *Signature:* `(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>]`

### Sub-sistem: `fmttanggaljam:jam:fmt` (Klaster #490)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`g`](file://apps/web/src/utils/format.ts#L36-L36) (`apps/web/src/utils/format.ts:36-36`) [Tipe: `function`]
    - *Signature:* `(k: string): string`
  - [`fmtTanggalJam`](file://apps/web/src/utils/format.ts#L27-L39) (`apps/web/src/utils/format.ts:27-39`) [Tipe: `function`]
    - *Signature:* `(v: string | null | undefined): string`

### Sub-sistem: `rupiah:fmt:fmtrupiahshort` (Klaster #492)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fmtRupiah`](file://apps/web/src/utils/format.ts#L63-L66) (`apps/web/src/utils/format.ts:63-66`) [Tipe: `function`]
    - *Signature:* `(n: number): string`
  - [`fmtRupiahShort`](file://apps/web/src/utils/format.ts#L70-L80) (`apps/web/src/utils/format.ts:70-80`) [Tipe: `function`]
    - *Signature:* `(n: number): string`

### Sub-sistem: `minstok:rasio:stok` (Klaster #496)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normKey`](file://apps/web/src/utils/inventoryWarn.ts#L98-L100) (`apps/web/src/utils/inventoryWarn.ts:98-100`) [Tipe: `function`]
    - *Signature:* `(s: unknown): string`
    - *Deskripsi:* /**
 * Kategori barang + parameter warning-nya.
 * `criticalRatio` : stok ≤ rasio ini × minStok → Kritis (langsung blokir
 *                    produksi / buat PR).
 * `watchRatio`    : stok ≤ rasio ini × minStok → Waspada.
 * `leadTimeDays`  : lead time supply; kategori lead-time panjang diberi
 *                    buffer lebih lebar sehingga tidak alarm palsu.
 * `maxRatio`      : stok > rasio ini × minStok → Overstock (uang tertidur).
 * `ignoresMin`    : kategori tanpa stok fisik (jasa/service) → minStok
 *                    tidak berlaku, tidak pernah "menipis".
 */
  - [`ruleOf`](file://apps/web/src/utils/inventoryWarn.ts#L103-L113) (`apps/web/src/utils/inventoryWarn.ts:103-113`) [Tipe: `function`]
    - *Signature:* `(category: unknown): CategoryRule`

### Sub-sistem: `counts:empty:leveltally` (Klaster #500)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EMPTY_COUNTS`](file://apps/web/src/utils/inventoryWarn.ts#L204-L206) (`apps/web/src/utils/inventoryWarn.ts:204-206`) [Tipe: `function`]
    - *Signature:* `(): Record<WarnLevel, number>`
    - *Deskripsi:* /** true bila item layak masuk daftar prioritas. */
  - [`levelTally`](file://apps/web/src/utils/inventoryWarn.ts#L217-L224) (`apps/web/src/utils/inventoryWarn.ts:217-224`) [Tipe: `function`]
    - *Signature:* `(inventory: StoreItem[], warehouse?: string): Record<WarnLevel, number>`

### Sub-sistem: `ismaintstatus:status:statusof` (Klaster #505)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isMaintStatus`](file://apps/web/src/utils/maintenance.ts#L29-L31) (`apps/web/src/utils/maintenance.ts:29-31`) [Tipe: `function`]
    - *Signature:* `(v: unknown): v is MaintStatus`
  - [`statusOf`](file://apps/web/src/utils/maintenance.ts#L33-L36) (`apps/web/src/utils/maintenance.ts:33-36`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>): MaintStatus`

### Sub-sistem: `cantransition:nextstatuses:statuses` (Klaster #506)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`nextStatuses`](file://apps/web/src/utils/maintenance.ts#L44-L49) (`apps/web/src/utils/maintenance.ts:44-49`) [Tipe: `function`]
    - *Signature:* `(from: MaintStatus): MaintStatus[]`
  - [`canTransition`](file://apps/web/src/utils/maintenance.ts#L51-L53) (`apps/web/src/utils/maintenance.ts:51-53`) [Tipe: `function`]
    - *Signature:* `(from: MaintStatus, to: MaintStatus): boolean`

### Sub-sistem: `canrestorestock:markdeducted:deducted` (Klaster #513)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`canRestoreStock`](file://apps/web/src/utils/maintenance.ts#L227-L229) (`apps/web/src/utils/maintenance.ts:227-229`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>): boolean`
  - [`markDeducted`](file://apps/web/src/utils/maintenance.ts#L231-L233) (`apps/web/src/utils/maintenance.ts:231-233`) [Tipe: `function`]
    - *Signature:* `(m: Partial<StoreItem>): boolean`

### Sub-sistem: `fmtmonthkey:monthsof:berasal` (Klaster #518)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`monthsOf`](file://apps/web/src/utils/monthAxis.ts#L35-L37) (`apps/web/src/utils/monthAxis.ts:35-37`) [Tipe: `function`]
    - *Signature:* `(locale: Locale): readonly string[]`
    - *Deskripsi:* // sehingga angka dan label selalu berasal dari bulan yang sama.
  - [`fmtMonthKey`](file://apps/web/src/utils/monthAxis.ts#L245-L250) (`apps/web/src/utils/monthAxis.ts:245-250`) [Tipe: `function`]
    - *Signature:* `(key: string, locale: Locale = "id"): string`

### Sub-sistem: `workedhours:tominutes:worked` (Klaster #525)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toMinutes`](file://apps/web/src/utils/overtime.ts#L6-L12) (`apps/web/src/utils/overtime.ts:6-12`) [Tipe: `function`]
    - *Signature:* `(hhmm: string): number | null`
  - [`workedHours`](file://apps/web/src/utils/overtime.ts#L15-L21) (`apps/web/src/utils/overtime.ts:15-21`) [Tipe: `function`]
    - *Signature:* `(checkIn: string, checkOut: string): number`

### Sub-sistem: `modul:num:maintenancedowntimehours` (Klaster #530)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/utils/projectCost.ts#L18-L21) (`apps/web/src/utils/projectCost.ts:18-21`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
    - *Deskripsi:* // dijumlahkan, supaya modul Equipment dan modul Proyek membaca angka yang sama.
  - [`maintenanceDowntimeHours`](file://apps/web/src/utils/projectCost.ts#L171-L177) (`apps/web/src/utils/projectCost.ts:171-177`) [Tipe: `function`]
    - *Signature:* `(m: StoreItem): number`

### Sub-sistem: `booking:isbillablebooking:billable` (Klaster #531)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`bookingCostRows`](file://apps/web/src/utils/projectCost.ts#L83-L110) (`apps/web/src/utils/projectCost.ts:83-110`) [Tipe: `function`]
    - *Signature:* `(
  projectId: string,
  bookings: StoreItem[],
  equipment: StoreItem[],
): BookingCostRow[]`
  - [`isBillableBooking`](file://apps/web/src/utils/projectCost.ts#L30-L32) (`apps/web/src/utils/projectCost.ts:30-32`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem): boolean`

### Sub-sistem: `resolveequipment:bookingcost:booking` (Klaster #532)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`resolveEquipment`](file://apps/web/src/utils/projectCost.ts#L40-L48) (`apps/web/src/utils/projectCost.ts:40-48`) [Tipe: `function`]
    - *Signature:* `(booking: StoreItem, equipment: StoreItem[]): StoreItem | undefined`
  - [`bookingCost`](file://apps/web/src/utils/projectCost.ts#L59-L68) (`apps/web/src/utils/projectCost.ts:59-68`) [Tipe: `function`]
    - *Signature:* `(b: StoreItem, equipment: StoreItem[]): number`

### Sub-sistem: `scope:scopelist:scopenames` (Klaster #557)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`scopeList`](file://apps/web/src/utils/scope.ts#L9-L29) (`apps/web/src/utils/scope.ts:9-29`) [Tipe: `function`]
    - *Signature:* `(scope: unknown): ScopeItem[]`
  - [`scopeNames`](file://apps/web/src/utils/scope.ts#L32-L34) (`apps/web/src/utils/scope.ts:32-34`) [Tipe: `function`]
    - *Signature:* `(scope: unknown): string[]`

### Sub-sistem: `scorechecklist:normalizedvalue:normalized` (Klaster #560)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normalizedValue`](file://apps/web/src/utils/scoring.ts#L6-L18) (`apps/web/src/utils/scoring.ts:6-18`) [Tipe: `function`]
    - *Signature:* `(item: ScItem, answer: unknown): number | null`
  - [`scoreChecklist`](file://apps/web/src/utils/scoring.ts#L20-L33) (`apps/web/src/utils/scoring.ts:20-33`) [Tipe: `function`]
    - *Signature:* `(template: ScTemplate, answers: Record<string, unknown>): { score: number; answered: number; total: number }`

### Sub-sistem: `briefof:brief:safetext` (Klaster #562)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`safeText`](file://apps/web/src/utils/series.ts#L48-L52) (`apps/web/src/utils/series.ts:48-52`) [Tipe: `function`]
    - *Signature:* `(value: unknown, fallback = "-"): string`
  - [`briefOf`](file://apps/web/src/utils/series.ts#L62-L65) (`apps/web/src/utils/series.ts:62-65`) [Tipe: `function`]
    - *Signature:* `(value: unknown, words = 2): string`

### Sub-sistem: `terbilang:bahasa:rupiah` (Klaster #566)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`angkaKeKataId`](file://apps/web/src/utils/terbilang.ts#L21-L32) (`apps/web/src/utils/terbilang.ts:21-32`) [Tipe: `function`]
    - *Signature:* `(n: number): string`
    - *Deskripsi:* /**
 * Konversi angka rupiah ke kalimat terbilang bahasa Indonesia & bahasa Inggris
 * untuk dokumen resmi / enterprise-grade (BoQ, Invoice, Kontrak).
 */
  - [`terbilangRupiah`](file://apps/web/src/utils/terbilang.ts#L34-L39) (`apps/web/src/utils/terbilang.ts:34-39`) [Tipe: `function`]
    - *Signature:* `(amount: number): string`

### Sub-sistem: `bahasa:spelledoutcurrency:spelled` (Klaster #567)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`numToWordsEn`](file://apps/web/src/utils/terbilang.ts#L44-L52) (`apps/web/src/utils/terbilang.ts:44-52`) [Tipe: `function`]
    - *Signature:* `(n: number): string`
    - *Deskripsi:* /**
 * Konversi angka rupiah ke kalimat terbilang bahasa Indonesia & bahasa Inggris
 * untuk dokumen resmi / enterprise-grade (BoQ, Invoice, Kontrak).
 */
  - [`spelledOutCurrency`](file://apps/web/src/utils/terbilang.ts#L54-L58) (`apps/web/src/utils/terbilang.ts:54-58`) [Tipe: `function`]
    - *Signature:* `(amount: number): string`

### Sub-sistem: `sum:buildtermins:termins` (Klaster #571)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sum`](file://apps/web/src/utils/termin.ts#L24-L24) (`apps/web/src/utils/termin.ts:24-24`) [Tipe: `function`]
    - *Signature:* `(xs: number[]): number`
  - [`buildTermins`](file://apps/web/src/utils/termin.ts#L26-L60) (`apps/web/src/utils/termin.ts:26-60`) [Tipe: `function`]
    - *Signature:* `(value: number, scheme: TerminScheme): BuildResult`

### Sub-sistem: `created:derivecreatedat:stampderivedcreatedat` (Klaster #576)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stampDerivedCreatedAt`](file://apps/web/src/utils/timestamps.ts#L169-L195) (`apps/web/src/utils/timestamps.ts:169-195`) [Tipe: `function`]
    - *Signature:* `(
  shape: Record<string, unknown[]>,
): { stamped: number; unresolved: Record<string, number> }`
  - [`deriveCreatedAt`](file://apps/web/src/utils/timestamps.ts#L147-L161) (`apps/web/src/utils/timestamps.ts:147-161`) [Tipe: `function`]
    - *Signature:* `(row: Record<string, unknown> | null | undefined): string | null`

### Sub-sistem: `rowsof:case:insensitive` (Klaster #588)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rowsOf`](file://apps/web/src/utils/usages.ts#L7-L11) (`apps/web/src/utils/usages.ts:7-11`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape, key: string): Record<string, unknown>[]`
    - *Deskripsi:* // Perbandingan nama memakai sameName (trim + case-insensitive); join ID exact.
  - [`findUsages`](file://apps/web/src/utils/usages.ts#L31-L134) (`apps/web/src/utils/usages.ts:31-134`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape, collection: string, id: string): string[]`

### Sub-sistem: `names:warehouse:usedwarehousenames` (Klaster #592)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`allWarehouseNames`](file://apps/web/src/utils/warehouse.ts#L124-L137) (`apps/web/src/utils/warehouse.ts:124-137`) [Tipe: `function`]
    - *Signature:* `(
  warehouses: (StoreItem | Warehouse)[],
  inventory: StoreItem[],
): string[]`
  - [`usedWarehouseNames`](file://apps/web/src/utils/warehouse.ts#L114-L121) (`apps/web/src/utils/warehouse.ts:114-121`) [Tipe: `function`]
    - *Signature:* `(inventory: StoreItem[]): string[]`

### Sub-sistem: `ensuremetrics:standardwidth:standard` (Klaster #635)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`standardWidth`](file://services/api/src/pdf/measure.ts#L28-L35) (`services/api/src/pdf/measure.ts:28-35`) [Tipe: `function`]
    - *Signature:* `(pdf: jsPDF, text: string, size: number, bold: boolean): number`
  - [`ensureMetrics`](file://services/api/src/pdf/measure.ts#L56-L64) (`services/api/src/pdf/measure.ts:56-64`) [Tipe: `function`]
    - *Signature:* `(pdf: jsPDF, weight: FontName, embedded: boolean, size = 100): number`

### Sub-sistem: `assemble:buildfrommodel:build` (Klaster #640)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assemble`](file://services/api/src/pdf/registry.ts#L316-L320) (`services/api/src/pdf/registry.ts:316-320`) [Tipe: `method`]
    - *Signature:* `(input)`
  - [`buildFromModel`](file://services/api/src/pdf/registry.ts#L1410-L1412) (`services/api/src/pdf/registry.ts:1410-1412`) [Tipe: `function`]
    - *Signature:* `(recipe: RecipeView, model: unknown, ctx: RenderContext): Document`

### Sub-sistem: `pick:posigners:signers` (Klaster #641)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pick`](file://services/api/src/pdf/registry.ts#L591-L591) (`services/api/src/pdf/registry.ts:591-591`) [Tipe: `function`]
    - *Signature:* `(key: string, fallback: string): string`
  - [`poSigners`](file://services/api/src/pdf/registry.ts#L589-L605) (`services/api/src/pdf/registry.ts:589-605`) [Tipe: `function`]
    - *Signature:* `(p: Record<string, unknown>, vendorName: string, approvals: Array<Record<string, unknown>>, locale: Locale): Array<{ role: string; name: string }>`
    - *Deskripsi:* /** Tarif PPh final default untuk tagihan; baris invoice menyimpannya sendiri. */

### Sub-sistem: `recipe:findrecipe:recipeentity` (Klaster #645)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`findRecipe`](file://services/api/src/pdf/registry.ts#L1386-L1388) (`services/api/src/pdf/registry.ts:1386-1388`) [Tipe: `function`]
    - *Signature:* `(kind: string): RecipeView | undefined`
  - [`recipeEntity`](file://services/api/src/pdf/registry.ts#L1391-L1393) (`services/api/src/pdf/registry.ts:1391-1393`) [Tipe: `function`]
    - *Signature:* `(kind: string): { field: string; prefix: string } | undefined`

### Sub-sistem: `month:shiftmonth:monthaxis` (Klaster #650)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`shiftMonth`](file://services/api/src/pdf/reports.ts#L57-L62) (`services/api/src/pdf/reports.ts:57-62`) [Tipe: `function`]
    - *Signature:* `(key: string, delta: number): string`
  - [`monthAxis`](file://services/api/src/pdf/reports.ts#L65-L70) (`services/api/src/pdf/reports.ts:65-70`) [Tipe: `function`]
    - *Signature:* `(months: number, ref = new Date()): string[]`

### Sub-sistem: `parsial:divalidasi:sengaja` (Klaster #671)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toJson`](file://services/api/src/routes/crud.ts#L249-L258) (`services/api/src/routes/crud.ts:249-258`) [Tipe: `function`]
    - *Signature:* `(row: Row): { id: string; branch: string; data: unknown; updated_at: string }`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).
  - [`checkUniqueField`](file://services/api/src/routes/crud.ts#L220-L247) (`services/api/src/routes/crud.ts:220-247`) [Tipe: `function`]
    - *Signature:* `(
  table: string,
  field: string,
  label: string,
  value: string,
  selfId: string | null,
): Promise<string | null>`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).

### Sub-sistem: `parsial:drydock:divalidasi` (Klaster #674)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`drydockRange`](file://services/api/src/routes/crud.ts#L291-L299) (`services/api/src/routes/crud.ts:291-299`) [Tipe: `function`]
    - *Signature:* `(data: Record<string, unknown>, today: number): DrydockRange | null`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).
  - [`drydockOverlapError`](file://services/api/src/routes/crud.ts#L309-L331) (`services/api/src/routes/crud.ts:309-331`) [Tipe: `function`]
    - *Signature:* `(
  data: Record<string, unknown>,
  branch: string,
  selfId: string | null,
): Promise<string | null>`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).

### Sub-sistem: `filter:pdf:safefilename` (Klaster #684)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`safeFileName`](file://services/api/src/routes/pdf.ts#L288-L290) (`services/api/src/routes/pdf.ts:288-290`) [Tipe: `function`]
    - *Signature:* `(kind: string, id: string): string`
    - *Deskripsi:* /**
 * Filter yang diterima server.
 *
 * Hanya daftar putih. Tanpa itu, klien bisa mengirim filter bertingkat
 * bebas (deep object, array besar) yang nanti ikut disimpan ke snapshot dan
 * membuat baris pdfDocs membengkak tanpa batas.
 */
  - [`sendPdf`](file://services/api/src/routes/pdf.ts#L233-L257) (`services/api/src/routes/pdf.ts:233-257`) [Tipe: `function`]
    - *Signature:* `(
  reply: { header: (k: string, v: string) => unknown; send: (b: Buffer) => unknown },
  kind: string,
  id: string,
  res: RenderResult,
  modelId: string | null,
  disposition: "inline" | "attachment",
): unknown`
    - *Deskripsi:* /** Header + body PDF. Satu tempat supaya render dan cetak ulang tidak berbeda. */

### Sub-sistem: `token:getvalue:readqr` (Klaster #691)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`getValue`](file://services/api/src/routes/publicLeave.ts#L50-L53) (`services/api/src/routes/publicLeave.ts:50-53`) [Tipe: `function`]
    - *Signature:* `(key: string): Promise<string | null>`
    - *Deskripsi:* // Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.
  - [`readQr`](file://services/api/src/routes/publicLeave.ts#L68-L73) (`services/api/src/routes/publicLeave.ts:68-73`) [Tipe: `function`]
    - *Signature:* `(): Promise<{ record: QrRecord | null; legacy: string | null }>`
    - *Deskripsi:* /** Baris `qr:token`: JSON berisi hash (baru) atau token polos (sebelum ADR-0019). */

### Sub-sistem: `registerreadmodelroutes:projectvisible:tim` (Klaster #693)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`projectVisible`](file://services/api/src/routes/readModels.ts#L55-L58) (`services/api/src/routes/readModels.ts:55-58`) [Tipe: `function`]
    - *Signature:* `(user: { role?: string; employeeId?: string | null } | undefined, id: string): Promise<boolean>`
    - *Deskripsi:* /** 404 bila proyek di luar lingkup tim peran lapangan (sama dengan /api/projects/:id). */
  - [`registerReadModelRoutes`](file://services/api/src/routes/readModels.ts#L53-L115) (`services/api/src/routes/readModels.ts:53-115`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): void`

### Sub-sistem: `time:jejak:lalu` (Klaster #711)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`timeOf`](file://apps/web/src/pages/audit/Audit.tsx#L36-L42) (`apps/web/src/pages/audit/Audit.tsx:36-42`) [Tipe: `function`]
    - *Signature:* `(a: Record<string, unknown>): string | null`
    - *Deskripsi:* /** Waktu persis kejadian: `createdAt` (jejak baru), lalu `time` bila berupa
 *  tanggal, lalu `updated_at` server (saat jejak lama tersinkron). */
  - [`timeLabel`](file://apps/web/src/pages/audit/Audit.tsx#L46-L49) (`apps/web/src/pages/audit/Audit.tsx:46-49`) [Tipe: `function`]
    - *Signature:* `(a: Record<string, unknown>): string`
    - *Deskripsi:* /** Tampilan kolom Waktu: tanggal + jam bila waktunya diketahui, selain itu
 *  label relatif lama apa adanya (mis. jejak seed "5 menit lalu"). */

### Sub-sistem: `dock:docklengthm:dockmaxloa` (Klaster #718)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`dockLengthM`](file://apps/web/src/pages/drydock/Drydock.tsx#L70-L73) (`apps/web/src/pages/drydock/Drydock.tsx:70-73`) [Tipe: `function`]
    - *Signature:* `(capacity: unknown): number | null`
  - [`dockMaxLoa`](file://apps/web/src/pages/drydock/Drydock.tsx#L77-L81) (`apps/web/src/pages/drydock/Drydock.tsx:77-81`) [Tipe: `function`]
    - *Signature:* `(dock: StoreItem | undefined): number | null`

### Sub-sistem: `certtone:monthdiff:diff` (Klaster #724)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`monthDiff`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L37-L43) (`apps/web/src/pages/kapal/VesselDetail.tsx:37-43`) [Tipe: `function`]
    - *Signature:* `(expires: string, base: string): number | null`
  - [`certTone`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L45-L51) (`apps/web/src/pages/kapal/VesselDetail.tsx:45-51`) [Tipe: `function`]
    - *Signature:* `(expires: string, nowMonth: string): "green" | "amber" | "red"`

### Sub-sistem: `diam:ber:dnv` (Klaster #732)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`monthDiff`](file://apps/web/src/pages/kapal/Vessels.tsx#L49-L54) (`apps/web/src/pages/kapal/Vessels.tsx:49-54`) [Tipe: `function`]
    - *Signature:* `(expires: string, base: string): number | null`
    - *Deskripsi:* /** Kapal lama bisa ber-class lain (ABS, DNV, …): tetap jadi pilihan supaya tidak tertimpa diam-diam. */
  - [`certNeedsAttention`](file://apps/web/src/pages/kapal/Vessels.tsx#L56-L59) (`apps/web/src/pages/kapal/Vessels.tsx:56-59`) [Tipe: `function`]
    - *Signature:* `(expires: string, nowMonth: string): boolean`
    - *Deskripsi:* /** Kapal lama bisa ber-class lain (ABS, DNV, …): tetap jadi pilihan supaya tidak tertimpa diam-diam. */

### Sub-sistem: `compliance:compliancesummary:complianceof` (Klaster #733)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`complianceOf`](file://apps/web/src/pages/kapal/Vessels.tsx#L70-L73) (`apps/web/src/pages/kapal/Vessels.tsx:70-73`) [Tipe: `function`]
    - *Signature:* `(v: StoreItem): ComplianceRow[]`
  - [`complianceSummary`](file://apps/web/src/pages/kapal/Vessels.tsx#L75-L81) (`apps/web/src/pages/kapal/Vessels.tsx:75-81`) [Tipe: `function`]
    - *Signature:* `(v: StoreItem): { total: number; valid: number; state: "ok" | "issue" | "empty" }`

### Sub-sistem: `form:tertimpa:diam` (Klaster #734)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`optNum`](file://apps/web/src/pages/kapal/Vessels.tsx#L104-L104) (`apps/web/src/pages/kapal/Vessels.tsx:104-104`) [Tipe: `function`]
    - *Signature:* `(v: string): number | null`
    - *Deskripsi:* /** Kapal lama bisa ber-class lain (ABS, DNV, …): tetap jadi pilihan supaya tidak tertimpa diam-diam. */
  - [`formToPayload`](file://apps/web/src/pages/kapal/Vessels.tsx#L110-L122) (`apps/web/src/pages/kapal/Vessels.tsx:110-122`) [Tipe: `function`]
    - *Signature:* `(form: VesselForm)`
    - *Deskripsi:* /** Hanya field form. Saat edit dipakai sebagai patch, jadi field lama yang sudah
 *  tidak ada di form (IMO, GT, …) tidak ikut tertimpa. */

### Sub-sistem: `form:str:field` (Klaster #735)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`str`](file://apps/web/src/pages/kapal/Vessels.tsx#L125-L125) (`apps/web/src/pages/kapal/Vessels.tsx:125-125`) [Tipe: `function`]
    - *Signature:* `(x: unknown): string`
  - [`vesselToForm`](file://apps/web/src/pages/kapal/Vessels.tsx#L124-L138) (`apps/web/src/pages/kapal/Vessels.tsx:124-138`) [Tipe: `function`]
    - *Signature:* `(v: StoreItem): VesselForm`
    - *Deskripsi:* /** Hanya field form. Saat edit dipakai sebagai patch, jadi field lama yang sudah
 *  tidak ada di form (IMO, GT, …) tidak ikut tertimpa. */

### Sub-sistem: `hasuom2:iseceran:uom` (Klaster #745)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isEceran`](file://apps/web/src/pages/inventori/Inventory.tsx#L103-L105) (`apps/web/src/pages/inventori/Inventory.tsx:103-105`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): boolean`
  - [`hasUom2`](file://apps/web/src/pages/inventori/Inventory.tsx#L297-L299) (`apps/web/src/pages/inventori/Inventory.tsx:297-299`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): boolean`

### Sub-sistem: `qtyinuom2:convof:conv` (Klaster #746)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`convOf`](file://apps/web/src/pages/inventori/Inventory.tsx#L285-L287) (`apps/web/src/pages/inventori/Inventory.tsx:285-287`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): number`
  - [`qtyInUom2`](file://apps/web/src/pages/inventori/Inventory.tsx#L301-L304) (`apps/web/src/pages/inventori/Inventory.tsx:301-304`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): number`

### Sub-sistem: `hasconversion:uom2of:uom` (Klaster #744)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`uom2Of`](file://apps/web/src/pages/inventori/Inventory.tsx#L289-L291) (`apps/web/src/pages/inventori/Inventory.tsx:289-291`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): string`
  - [`hasConversion`](file://apps/web/src/pages/inventori/Inventory.tsx#L293-L295) (`apps/web/src/pages/inventori/Inventory.tsx:293-295`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): boolean`

### Sub-sistem: `abcmap:effcost:abc` (Klaster #747)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`effCost`](file://apps/web/src/pages/inventori/Inventory.tsx#L315-L318) (`apps/web/src/pages/inventori/Inventory.tsx:315-318`) [Tipe: `function`]
    - *Signature:* `(it: StoreItem): number`
  - [`abcMap`](file://apps/web/src/pages/inventori/Inventory.tsx#L327-L344) (`apps/web/src/pages/inventori/Inventory.tsx:327-344`) [Tipe: `function`]
    - *Signature:* `(items: StoreItem[]): Record<string, "A" | "B" | "C">`

### Sub-sistem: `hist:histfilterbar:emptyhist` (Klaster #750)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`emptyHist`](file://apps/web/src/pages/keuangan/Finance.tsx#L88-L88) (`apps/web/src/pages/keuangan/Finance.tsx:88-88`) [Tipe: `function`]
    - *Signature:* `(): HistFilter`
  - [`HistFilterBar`](file://apps/web/src/pages/keuangan/Finance.tsx#L174-L226) (`apps/web/src/pages/keuangan/Finance.tsx:174-226`) [Tipe: `function`]
    - *Signature:* `({ value, onChange, idPrefix }: { value: HistFilter; onChange: (v: HistFilter) => void; idPrefix: string })`

### Sub-sistem: `matchhist:kasasofreport:kas` (Klaster #758)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`matchHist`](file://apps/web/src/pages/keuangan/Finance.tsx#L148-L157) (`apps/web/src/pages/keuangan/Finance.tsx:148-157`) [Tipe: `function`]
    - *Signature:* `(dateISO: unknown, f: HistFilter): boolean`
  - [`kasAsOfReport`](file://apps/web/src/pages/keuangan/Finance.tsx#L475-L505) (`apps/web/src/pages/keuangan/Finance.tsx:475-505`) [Tipe: `function`]
    - *Signature:* `(
  list: StoreItem[],
  end: string,
  f: HistFilter,
  opening: Record<string, number>,
  kodeRe: RegExp,
): { saldo: Record<string, number>; masuk: Record<string, number>; keluar: Record<string, number>; hitung: number }`

### Sub-sistem: `neto:aroutasof:invneto` (Klaster #759)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`invNeto`](file://apps/web/src/pages/keuangan/Finance.tsx#L345-L349) (`apps/web/src/pages/keuangan/Finance.tsx:345-349`) [Tipe: `function`]
    - *Signature:* `(inv: StoreItem): number`
    - *Deskripsi:* // Neto invoice: grandTotal bila ada, else amount dikurangi retensi yang ditahan.
  - [`arOutAsOf`](file://apps/web/src/pages/keuangan/Finance.tsx#L528-L544) (`apps/web/src/pages/keuangan/Finance.tsx:528-544`) [Tipe: `function`]
    - *Signature:* `(list: StoreItem[], end: string): { c: string; total: number; count: number }[]`
    - *Deskripsi:* // payroll) - tidak ada snapshot hardcode per bulan.

### Sub-sistem: `esc:downloadcsv:bruto` (Klaster #756)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`esc`](file://apps/web/src/pages/keuangan/Finance.tsx#L391-L394) (`apps/web/src/pages/keuangan/Finance.tsx:391-394`) [Tipe: `function`]
    - *Signature:* `(v: string | number): string`
  - [`downloadCsv`](file://apps/web/src/pages/keuangan/Finance.tsx#L390-L405) (`apps/web/src/pages/keuangan/Finance.tsx:390-405`) [Tipe: `function`]
    - *Signature:* `(filename: string, header: string[], rows: (string | number)[][]): void`
    - *Deskripsi:* // potongan = bruto - net (PPh21 + BPJS karyawan), selalu seimbang.

### Sub-sistem: `allowances:normallowances:sumallowances` (Klaster #772)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`normAllowances`](file://apps/web/src/pages/payroll/Payroll.tsx#L126-L139) (`apps/web/src/pages/payroll/Payroll.tsx:126-139`) [Tipe: `function`]
    - *Signature:* `(v: unknown): AllowanceLine[]`
  - [`sumAllowances`](file://apps/web/src/pages/payroll/Payroll.tsx#L141-L143) (`apps/web/src/pages/payroll/Payroll.tsx:141-143`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`

### Sub-sistem: `scoresof:scores:avgscore` (Klaster #782)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`scoresOf`](file://apps/web/src/pages/procurement/Procurement.tsx#L159-L161) (`apps/web/src/pages/procurement/Procurement.tsx:159-161`) [Tipe: `function`]
    - *Signature:* `(v: StoreItem): VendorScore[]`
  - [`avgScore`](file://apps/web/src/pages/procurement/Procurement.tsx#L163-L167) (`apps/web/src/pages/procurement/Procurement.tsx:163-167`) [Tipe: `function`]
    - *Signature:* `(v: StoreItem): number | null`

### Sub-sistem: `fmtdatetime:tanpa:rbac` (Klaster #789)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`p`](file://apps/web/src/pages/pengaturan/Peran.tsx#L286-L286) (`apps/web/src/pages/pengaturan/Peran.tsx:286-286`) [Tipe: `function`]
    - *Signature:* `(n: number): string`
  - [`fmtDateTime`](file://apps/web/src/pages/pengaturan/Peran.tsx#L282-L288) (`apps/web/src/pages/pengaturan/Peran.tsx:282-288`) [Tipe: `function`]
    - *Signature:* `(v: string): string`
    - *Deskripsi:* /** Matriks RBAC display: sel yang tidak tercantum = tanpa akses. Read-only tanpa backend. */

### Sub-sistem: `num:monitoringfeed:monitoring` (Klaster #804)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L38-L38) (`apps/web/src/pages/proyek/MonitoringFeed.tsx:38-38`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number | null`
  - [`MonitoringFeed`](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L40-L164) (`apps/web/src/pages/proyek/MonitoringFeed.tsx:40-164`) [Tipe: `function`]
    - *Signature:* `({ projects, canUpdate }: Props)`

### Sub-sistem: `addyearsiso:normcerts:years` (Klaster #822)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`addYearsISO`](file://apps/web/src/pages/sdm/HR.tsx#L87-L91) (`apps/web/src/pages/sdm/HR.tsx:87-91`) [Tipe: `function`]
    - *Signature:* `(iso: string, years = 2): string`
  - [`normCerts`](file://apps/web/src/pages/sdm/HR.tsx#L114-L131) (`apps/web/src/pages/sdm/HR.tsx:114-131`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): EmpCert[]`

### Sub-sistem: `skills:defaultskills:getskills` (Klaster #823)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`defaultSkills`](file://apps/web/src/pages/sdm/HR.tsx#L103-L107) (`apps/web/src/pages/sdm/HR.tsx:103-107`) [Tipe: `function`]
    - *Signature:* `(dept: string, role: string): string[]`
  - [`getSkills`](file://apps/web/src/pages/sdm/HR.tsx#L109-L112) (`apps/web/src/pages/sdm/HR.tsx:109-112`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): string[]`

### Sub-sistem: `addyearsiso:normcerts:dukung` (Klaster #828)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`addYearsISO`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L77-L81) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:77-81`) [Tipe: `function`]
    - *Signature:* `(iso: string, years = 2): string`
  - [`normCerts`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L104-L124) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:104-124`) [Tipe: `function`]
    - *Signature:* `(e: StoreItem): EmpCert[]`
    - *Deskripsi:* /** Total tunjangan: dukung number (lama) maupun array [{label,amount}] (Payroll). */

### Sub-sistem: `hutang:kata:tarif` (Klaster #831)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`daysUntil`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L120-L127) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:120-127`) [Tipe: `function`]
    - *Signature:* `(iso: string | null | undefined): number | null`
    - *Deskripsi:* /** Teks tarif untuk tampilan & catatan hutang: "0.5%" atau kata "manual". */
  - [`daysLate`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L129-L132) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:129-132`) [Tipe: `function`]
    - *Signature:* `(iso: string | null | undefined): number`
    - *Deskripsi:* /** Teks tarif untuk tampilan & catatan hutang: "0.5%" atau kata "manual". */

### Sub-sistem: `kwitansi:terbilang:ribu` (Klaster #851)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`terbilangAngka`](file://services/api/src/pdf/documents/kwitansi.ts#L129-L157) (`services/api/src/pdf/documents/kwitansi.ts:129-157`) [Tipe: `function`]
    - *Signature:* `(v: number): string`
    - *Deskripsi:* /** Bilangan dalam bahasa Indonesia untuk baris "Terbilang" pada kwitansi.
 *
 * Tanpa ini kwitansi hanya boleh dicetak dengan uang nominal - padahal
 * kwitansi pembayaran adalah dokumen yang biasanya wajib bertulis "Terbilang"
 * agar bisa dicocokkan dengan cek bank. Nilai negatif tidak mungkin di
 * kwitansi (baris pengurang sudah jadi nilai positif di tabel), jadi fungsi
 * ini hanya menerima nilai >= 0. */
  - [`ribu`](file://services/api/src/pdf/documents/kwitansi.ts#L123-L127) (`services/api/src/pdf/documents/kwitansi.ts:123-127`) [Tipe: `function`]
    - *Signature:* `(n: number): string`

### Sub-sistem: `loadentity:toitem:entity` (Klaster #863)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toItem`](file://services/api/src/pdf/documents/shared.ts#L148-L151) (`services/api/src/pdf/documents/shared.ts:148-151`) [Tipe: `function`]
    - *Signature:* `(r: Row): Record<string, unknown>`
  - [`loadEntity`](file://services/api/src/pdf/documents/shared.ts#L168-L172) (`services/api/src/pdf/documents/shared.ts:168-172`) [Tipe: `function`]
    - *Signature:* `(spec: RowSpec, id: string): Promise<Record<string, unknown> | null>`

### Sub-sistem: `constructor:additionalerror:additional` (Klaster #883)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://services/api/src/inventoryAdditional.ts#L13-L13) (`services/api/src/inventoryAdditional.ts:13-13`) [Tipe: `method`]
    - *Signature:* `(public status: 404 | 409 | 422, message: string, public code: string)`
  - [`AdditionalError`](file://services/api/src/inventoryAdditional.ts#L12-L14) (`services/api/src/inventoryAdditional.ts:12-14`) [Tipe: `class`]
    - *Signature:* `class AdditionalError`

### Sub-sistem: `num:shrinkpayableoncancel:shrink` (Klaster #892)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`num`](file://services/api/src/poPayable.ts#L19-L19) (`services/api/src/poPayable.ts:19-19`) [Tipe: `function`]
    - *Signature:* `(v: unknown): number`
  - [`shrinkPayableOnCancel`](file://services/api/src/poPayable.ts#L62-L73) (`services/api/src/poPayable.ts:62-73`) [Tipe: `function`]
    - *Signature:* `(id: string, po: Data, actor: string): Promise<void>`

### Sub-sistem: `routelist:parseroutes:route` (Klaster #894)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`parseRoutes`](file://services/api/src/routeList.ts#L9-L23) (`services/api/src/routeList.ts:9-23`) [Tipe: `function`]
    - *Signature:* `(tree: string): RouteEntry[]`
  - [`routeList`](file://services/api/src/routeList.ts#L25-L27) (`services/api/src/routeList.ts:25-27`) [Tipe: `function`]
    - *Signature:* `(app: FastifyInstance): RouteEntry[]`

### Sub-sistem: `confirm:importpreviewmodal:preview` (Klaster #898)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`confirm`](file://apps/web/src/components/ImportPreviewModal.tsx#L34-L37) (`apps/web/src/components/ImportPreviewModal.tsx:34-37`) [Tipe: `function`]
    - *Signature:* `(): Promise<void>`
  - [`ImportPreviewModal`](file://apps/web/src/components/ImportPreviewModal.tsx#L28-L77) (`apps/web/src/components/ImportPreviewModal.tsx:28-77`) [Tipe: `function`]
    - *Signature:* `({ open, title, fileName, columns, rows, onCancel, onConfirm }: Props)`

### Sub-sistem: `tahap:tahaplistof:tahapakhirof` (Klaster #902)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`tahapListOf`](file://apps/web/src/utils/projectStages.ts#L18-L20) (`apps/web/src/utils/projectStages.ts:18-20`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem | undefined): string[]`
  - [`tahapAkhirOf`](file://apps/web/src/utils/projectStages.ts#L23-L26) (`apps/web/src/utils/projectStages.ts:23-26`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem): string`

### Sub-sistem: `tahap:tahapkolom:tahapof` (Klaster #903)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`tahapOf`](file://apps/web/src/utils/projectStages.ts#L47-L49) (`apps/web/src/utils/projectStages.ts:47-49`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem): string`
  - [`tahapKolom`](file://apps/web/src/utils/projectStages.ts#L29-L34) (`apps/web/src/utils/projectStages.ts:29-34`) [Tipe: `function`]
    - *Signature:* `(projects: StoreItem[]): string[]`

### Sub-sistem: `unzip:inflateraw:inflate` (Klaster #904)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`inflateRaw`](file://apps/web/src/utils/readSheet.ts#L9-L12) (`apps/web/src/utils/readSheet.ts:9-12`) [Tipe: `function`]
    - *Signature:* `(data: Uint8Array): Promise<Uint8Array>`
  - [`unzip`](file://apps/web/src/utils/readSheet.ts#L15-L44) (`apps/web/src/utils/readSheet.ts:15-44`) [Tipe: `function`]
    - *Signature:* `(buf: ArrayBuffer, wanted: (name: string) => boolean): Promise<Map<string, string>>`
    - *Deskripsi:* /** Isi file di dalam zip, berdasarkan nama. */

### Sub-sistem: `reverserefs:reverse:alllinks` (Klaster #909)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`allLinks`](file://services/api/src/routes/relations.ts#L46-L55) (`services/api/src/routes/relations.ts:46-55`) [Tipe: `function`]
    - *Signature:* `(): Link[]`
  - [`reverseRefs`](file://services/api/src/routes/relations.ts#L58-L60) (`services/api/src/routes/relations.ts:58-60`) [Tipe: `function`]
    - *Signature:* `(table: string): Link[]`

### Sub-sistem: `allocationsof:allocations:stagematerialcount` (Klaster #918)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`allocationsOf`](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L17-L23) (`apps/web/src/pages/proyek/WbsMaterialModal.tsx:17-23`) [Tipe: `function`]
    - *Signature:* `(row: StoreItem): BomAllocation[]`
  - [`stageMaterialCount`](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L26-L28) (`apps/web/src/pages/proyek/WbsMaterialModal.tsx:26-28`) [Tipe: `function`]
    - *Signature:* `(bomItems: readonly StoreItem[], projectId: string, task: string): number`

### Sub-sistem: `length:memorystorage:memory` (Klaster #923)
- **Kepadatan Simbol:** 2 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`length`](file://apps/web/src/services/__tests__/authExpired.test.ts#L9-L9) (`apps/web/src/services/__tests__/authExpired.test.ts:9-9`) [Tipe: `method`]
    - *Signature:* `()`
  - [`memoryStorage`](file://apps/web/src/services/__tests__/authExpired.test.ts#L6-L16) (`apps/web/src/services/__tests__/authExpired.test.ts:6-16`) [Tipe: `function`]
    - *Signature:* `(): Storage`

### Sub-sistem: `assert` (Klaster #0)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/alert-probe.ts#L48-L51) (`apps/web/scripts/alert-probe.ts:48-51`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `dayoffset:day:offset` (Klaster #1)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`dayOffset`](file://apps/web/scripts/alert-probe.ts#L57-L61) (`apps/web/scripts/alert-probe.ts:57-61`) [Tipe: `function`]
    - *Signature:* `(n: number): string`

### Sub-sistem: `shape:builder:satu` (Klaster #2)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`shape`](file://apps/web/scripts/alert-probe.ts#L67-L68) (`apps/web/scripts/alert-probe.ts:67-68`) [Tipe: `function`]
    - *Signature:* `(over: Record<string, unknown[]>): StoreShape`
    - *Deskripsi:* /**
 * Fixture dibuat per kasus, bukan satu data besar: kalau satu builder salah,
 * test-nya masih bisa menunjuk builder mana.
 */

### Sub-sistem: `builder:satu:levelof` (Klaster #3)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`levelOf`](file://apps/web/scripts/alert-probe.ts#L70-L73) (`apps/web/scripts/alert-probe.ts:70-73`) [Tipe: `function`]
    - *Signature:* `(items: ModuleAlertItem[], idPart: string): AlertLevel | "HILANG"`
    - *Deskripsi:* /**
 * Fixture dibuat per kasus, bukan satu data besar: kalau satu builder salah,
 * test-nya masih bisa menunjuk builder mana.
 */

### Sub-sistem: `subsystem-4` (Klaster #4)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`es`](file://apps/web/scripts/alert-probe.ts#L337-L337) (`apps/web/scripts/alert-probe.ts:337-337`) [Tipe: `function`]
    - *Signature:* `(d: string): StoreItem`

### Sub-sistem: `norm` (Klaster #5)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`norm`](file://apps/web/scripts/alert-probe.ts#L352-L352) (`apps/web/scripts/alert-probe.ts:352-352`) [Tipe: `function`]
    - *Signature:* `(d: string): string`

### Sub-sistem: `item` (Klaster #6)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`item`](file://apps/web/scripts/alert-probe.ts#L402-L408) (`apps/web/scripts/alert-probe.ts:402-408`) [Tipe: `function`]
    - *Signature:* `(level: AlertLevel, n: number): ModuleAlertItem`

### Sub-sistem: `check` (Klaster #7)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`check`](file://apps/web/scripts/api-base-probe.ts#L7-L11) (`apps/web/scripts/api-base-probe.ts:7-11`) [Tipe: `function`]
    - *Signature:* `(name: string, got: string, want: string): void`

### Sub-sistem: `length` (Klaster #8)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`length`](file://apps/web/scripts/browser-shims.ts#L18-L20) (`apps/web/scripts/browser-shims.ts:18-20`) [Tipe: `method`]
    - *Signature:* `()`

### Sub-sistem: `noop` (Klaster #9)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`noop`](file://apps/web/scripts/browser-shims.ts#L23-L23) (`apps/web/scripts/browser-shims.ts:23-23`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `eventtarget:event:target` (Klaster #10)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`eventTarget`](file://apps/web/scripts/browser-shims.ts#L25-L30) (`apps/web/scripts/browser-shims.ts:25-30`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `define` (Klaster #11)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`define`](file://apps/web/scripts/browser-shims.ts#L34-L40) (`apps/web/scripts/browser-shims.ts:34-40`) [Tipe: `function`]
    - *Signature:* `(key: string, value: unknown): void`

### Sub-sistem: `unobserve` (Klaster #12)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`unobserve`](file://apps/web/scripts/browser-shims.ts#L59-L59) (`apps/web/scripts/browser-shims.ts:59-59`) [Tipe: `method`]
    - *Signature:* `()`

### Sub-sistem: `check` (Klaster #13)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`check`](file://apps/web/scripts/drydock-dates-probe.ts#L16-L23) (`apps/web/scripts/drydock-dates-probe.ts:16-23`) [Tipe: `function`]
    - *Signature:* `(condition: boolean, label: string, detail = ""): void`

### Sub-sistem: `collectstrings:strings:collect` (Klaster #14)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`collectStrings`](file://apps/web/scripts/em-dash-audit-probe.ts#L12-L23) (`apps/web/scripts/em-dash-audit-probe.ts:12-23`) [Tipe: `function`]
    - *Signature:* `(obj: unknown, prefix = ""): { path: string; val: string }[]`

### Sub-sistem: `cek` (Klaster #15)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`cek`](file://apps/web/scripts/employee-probe.ts#L25-L32) (`apps/web/scripts/employee-probe.ts:25-32`) [Tipe: `function`]
    - *Signature:* `(nama: string, ok: boolean, detail = ""): void`

### Sub-sistem: `assert` (Klaster #16)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/equipment-notification-probe.ts#L11-L14) (`apps/web/scripts/equipment-notification-probe.ts:11-14`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `syntheticfetch:synthetic:fetch` (Klaster #17)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`syntheticFetch`](file://apps/web/scripts/fetch-performance-probe.ts#L23-L46) (`apps/web/scripts/fetch-performance-probe.ts:23-46`) [Tipe: `function`]
    - *Signature:* `(path: string): Promise<T>`

### Sub-sistem: `assert` (Klaster #18)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/foundation-probe.ts#L22-L25) (`apps/web/scripts/foundation-probe.ts:22-25`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `aswo` (Klaster #19)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`asWo`](file://apps/web/scripts/foundation-probe.ts#L142-L142) (`apps/web/scripts/foundation-probe.ts:142-142`) [Tipe: `function`]
    - *Signature:* `(v: unknown): StoreItem`

### Sub-sistem: `subsystem-20` (Klaster #20)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`wo`](file://apps/web/scripts/foundation-probe.ts#L235-L235) (`apps/web/scripts/foundation-probe.ts:235-235`) [Tipe: `function`]
    - *Signature:* `(ms: unknown[], progress?: number): StoreItem`

### Sub-sistem: `subsystem-21` (Klaster #21)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`m`](file://apps/web/scripts/foundation-probe.ts#L236-L236) (`apps/web/scripts/foundation-probe.ts:236-236`) [Tipe: `function`]
    - *Signature:* `(title: string, pct: number, done: boolean)`

### Sub-sistem: `assert` (Klaster #22)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/hr-rules-probe.ts#L7-L10) (`apps/web/scripts/hr-rules-probe.ts:7-10`) [Tipe: `function`]
    - *Signature:* `(name: string, condition: boolean, detail = ""): void`

### Sub-sistem: `keysof:keys` (Klaster #23)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`keysOf`](file://apps/web/scripts/i18n-probe.ts#L6-L9) (`apps/web/scripts/i18n-probe.ts:6-9`) [Tipe: `function`]
    - *Signature:* `(obj: unknown, prefix = ""): string[]`

### Sub-sistem: `cek` (Klaster #25)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`cek`](file://apps/web/scripts/p8-probe.ts#L23-L30) (`apps/web/scripts/p8-probe.ts:23-30`) [Tipe: `function`]
    - *Signature:* `(nama: string, ok: boolean, detail = ""): void`

### Sub-sistem: `check` (Klaster #26)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`check`](file://apps/web/scripts/price-probe.ts#L36-L40) (`apps/web/scripts/price-probe.ts:36-40`) [Tipe: `function`]
    - *Signature:* `(label: string, value: number, min: number): void`

### Sub-sistem: `assert:predicated:plus` (Klaster #27)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/price-probe.ts#L43-L46) (`apps/web/scripts/price-probe.ts:43-46`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`
    - *Deskripsi:* /** Bentuk umum: predicated ya/tidak plus detail opsional. */

### Sub-sistem: `rows:predicated:plus` (Klaster #28)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`rows`](file://apps/web/scripts/price-probe.ts#L49-L49) (`apps/web/scripts/price-probe.ts:49-49`) [Tipe: `function`]
    - *Signature:* `(v: unknown): Row[]`
    - *Deskripsi:* /** Bentuk umum: predicated ya/tidak plus detail opsional. */

### Sub-sistem: `predicated:plus:opsional` (Klaster #29)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`id`](file://apps/web/scripts/price-probe.ts#L56-L56) (`apps/web/scripts/price-probe.ts:56-56`) [Tipe: `function`]
    - *Signature:* `(r: Row): string`
    - *Deskripsi:* /** Bentuk umum: predicated ya/tidak plus detail opsional. */

### Sub-sistem: `assert` (Klaster #30)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/project-add-probe.tsx#L14-L17) (`apps/web/scripts/project-add-probe.tsx:14-17`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `mockadd:mock:add` (Klaster #31)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mockAdd`](file://apps/web/scripts/project-add-probe.tsx#L56-L56) (`apps/web/scripts/project-add-probe.tsx:56-56`) [Tipe: `function`]
    - *Signature:* `(_col: string, item: Record<string, unknown>)`

### Sub-sistem: `assert` (Klaster #32)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/project-progress-probe.ts#L9-L12) (`apps/web/scripts/project-progress-probe.ts:9-12`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `assert` (Klaster #33)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/push-probe.ts#L36-L43) (`apps/web/scripts/push-probe.ts:36-43`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `model` (Klaster #34)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Model`](file://apps/web/scripts/push-probe.ts#L47-L62) (`apps/web/scripts/push-probe.ts:47-62`) [Tipe: `interface`]
    - *Signature:* `interface Model`

### Sub-sistem: `newmodel:new:model` (Klaster #35)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`newModel`](file://apps/web/scripts/push-probe.ts#L64-L72) (`apps/web/scripts/push-probe.ts:64-72`) [Tipe: `function`]
    - *Signature:* `(): Model`

### Sub-sistem: `world` (Klaster #36)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`World`](file://apps/web/scripts/push-probe.ts#L74-L80) (`apps/web/scripts/push-probe.ts:74-80`) [Tipe: `interface`]
    - *Signature:* `interface World`

### Sub-sistem: `run:runold:old` (Klaster #37)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`runOld`](file://apps/web/scripts/push-probe.ts#L83-L104) (`apps/web/scripts/push-probe.ts:83-104`) [Tipe: `function`]
    - *Signature:* `(w: World, m: Model): void`
    - *Deskripsi:* /** Satu run model LAMA: kuota per koleksi, cursor hanya maju kalau semua sukses. */

### Sub-sistem: `giliran:run:koleksi` (Klaster #38)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`runNew`](file://apps/web/scripts/push-probe.ts#L111-L150) (`apps/web/scripts/push-probe.ts:111-150`) [Tipe: `function`]
    - *Signature:* `(w: World, m: Model): void`
    - *Deskripsi:* /** Satu run model BARU: budget global, cursor selalu maju, racun punya jatah.
 *  Setara dengan store.tsx: rotasi koleksi (`pushColCursorRef`) supaya yang
 *  tidak kebagian giliran dapat giliran pertama di run berikutnya, dan
 *  koleksi yang sudah tuntas DILAPAS dari antrean (clearDirty) sehingga tidak
 *  tidak akan habis selamanya. */

### Sub-sistem: `giliran:koleksi:tidak` (Klaster #39)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mk`](file://apps/web/scripts/push-probe.ts#L152-L156) (`apps/web/scripts/push-probe.ts:152-156`) [Tipe: `function`]
    - *Signature:* `(cols: Record<string, number>): World`
    - *Deskripsi:* /** Satu run model BARU: budget global, cursor selalu maju, racun punya jatah.
 *  Setara dengan store.tsx: rotasi koleksi (`pushColCursorRef`) supaya yang
 *  tidak kebagian giliran dapat giliran pertama di run berikutnya, dan
 *  koleksi yang sudah tuntas DILAPAS dari antrean (clearDirty) sehingga tidak
 *  tidak akan habis selamanya. */

### Sub-sistem: `triggerlama:trigger:lama` (Klaster #40)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`triggerLama`](file://apps/web/scripts/push-probe.ts#L250-L262) (`apps/web/scripts/push-probe.ts:250-262`) [Tipe: `function`]
    - *Signature:* `(): void`

### Sub-sistem: `triggerbaru:trigger:baru` (Klaster #41)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`triggerBaru`](file://apps/web/scripts/push-probe.ts#L269-L280) (`apps/web/scripts/push-probe.ts:269-280`) [Tipe: `function`]
    - *Signature:* `(): void`

### Sub-sistem: `assert` (Klaster #42)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/qc-deep-link-probe.ts#L10-L13) (`apps/web/scripts/qc-deep-link-probe.ts:10-13`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `cek` (Klaster #43)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`cek`](file://apps/web/scripts/risk-auto-probe.ts#L23-L30) (`apps/web/scripts/risk-auto-probe.ts:23-30`) [Tipe: `function`]
    - *Signature:* `(nama: string, ok: boolean, detail = ""): void`

### Sub-sistem: `firstid:first` (Klaster #44)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`firstId`](file://apps/web/scripts/ssr-probe.tsx#L59-L60) (`apps/web/scripts/ssr-probe.tsx:59-60`) [Tipe: `function`]
    - *Signature:* `(rows: { id?: unknown }[] | undefined, fallback: string): string`

### Sub-sistem: `row` (Klaster #45)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`row`](file://apps/web/scripts/ssr-probe.tsx#L254-L254) (`apps/web/scripts/ssr-probe.tsx:254-254`) [Tipe: `function`]
    - *Signature:* `(id: string, extra: Record<string, unknown> = {})`

### Sub-sistem: `subsystem-46` (Klaster #46)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`j`](file://apps/web/scripts/ssr-probe.tsx#L318-L320) (`apps/web/scripts/ssr-probe.tsx:318-320`) [Tipe: `function`]
    - *Signature:* `(date: string, db: string, kr: string, amount: number, sumber = "Kas")`

### Sub-sistem: `enc` (Klaster #47)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`enc`](file://apps/web/scripts/ssr-probe.tsx#L434-L434) (`apps/web/scripts/ssr-probe.tsx:434-434`) [Tipe: `function`]
    - *Signature:* `(s: string): Uint8Array`

### Sub-sistem: `stub` (Klaster #48)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stub`](file://apps/web/scripts/ssr-probe.tsx#L470-L473) (`apps/web/scripts/ssr-probe.tsx:470-473`) [Tipe: `function`]
    - *Signature:* `(body: BodyInit | null, status: number, headers: Record<string, string>): void`

### Sub-sistem: `assert` (Klaster #49)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/stock-issue-probe.ts#L6-L12) (`apps/web/scripts/stock-issue-probe.ts:6-12`) [Tipe: `function`]
    - *Signature:* `(name: string, condition: boolean, detail = ""): void`

### Sub-sistem: `assert` (Klaster #50)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/table-probe.ts#L32-L35) (`apps/web/scripts/table-probe.ts:32-35`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `asrec:rec` (Klaster #51)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`asRec`](file://apps/web/scripts/table-probe.ts#L37-L37) (`apps/web/scripts/table-probe.ts:37-37`) [Tipe: `function`]
    - *Signature:* `(v: unknown): Record<string, unknown>`

### Sub-sistem: `urut` (Klaster #52)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`urut`](file://apps/web/scripts/table-probe.ts#L124-L124) (`apps/web/scripts/table-probe.ts:124-124`) [Tipe: `function`]
    - *Signature:* `(dir: "asc" | "desc")`

### Sub-sistem: `subsystem-53` (Klaster #53)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`dalam`](file://apps/web/scripts/table-probe.ts#L250-L251) (`apps/web/scripts/table-probe.ts:250-251`) [Tipe: `function`]
    - *Signature:* `(n: number): Record<string, unknown>`

### Sub-sistem: `assert` (Klaster #54)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/termin-probe.ts#L7-L13) (`apps/web/scripts/termin-probe.ts:7-13`) [Tipe: `function`]
    - *Signature:* `(name: string, condition: boolean, detail = ""): void`

### Sub-sistem: `total` (Klaster #55)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`total`](file://apps/web/scripts/termin-probe.ts#L14-L14) (`apps/web/scripts/termin-probe.ts:14-14`) [Tipe: `function`]
    - *Signature:* `(r: ReturnType<typeof buildTermins>): number`

### Sub-sistem: `assert` (Klaster #56)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/time-probe.ts#L26-L33) (`apps/web/scripts/time-probe.ts:26-33`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `subsystem-57` (Klaster #57)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`m`](file://apps/web/scripts/time-probe.ts#L125-L125) (`apps/web/scripts/time-probe.ts:125-125`) [Tipe: `function`]
    - *Signature:* `(s: string): number`

### Sub-sistem: `assert` (Klaster #58)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/unit-conversion-probe.ts#L18-L24) (`apps/web/scripts/unit-conversion-probe.ts:18-24`) [Tipe: `function`]
    - *Signature:* `(name: string, condition: boolean, detail = ""): void`

### Sub-sistem: `assert` (Klaster #59)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/wbs-flow-probe.ts#L14-L17) (`apps/web/scripts/wbs-flow-probe.ts:14-17`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `assert` (Klaster #60)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://apps/web/scripts/wo-probe.ts#L21-L24) (`apps/web/scripts/wo-probe.ts:21-24`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `modul:galat:tab` (Klaster #61)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Guard`](file://apps/web/src/main.tsx#L89-L96) (`apps/web/src/main.tsx:89-96`) [Tipe: `function`]
    - *Signature:* `({ title, children }: { title: string; children: ReactElement })`
    - *Deskripsi:* /**
 * Bungkus satu rute dengan ErrorBoundary yang ME-RESET setiap lokasi berubah.
 *
 * Tanpa resetKey, galat di /proyek/A mengunci /proyek/B, /kapal/X mengunci
 * /kapal/Y, dan seterusnya: React Router memakai instance React yang sama
 * untuk dua URL dalam satu pola rute, jadi boundary lama tidak pernah
 * di-unmount dan tetap menampilkan layar galat. Gejalanya persis "satu modul
 * rusak, semua modul ikut rusak" - padahal store dan modul lain baik-baik saja.
 *
 * resetKey memuat pathname DAN search. Query string ikut karena galat juga
 * bisa datang dari render yang dipicu ?tab= (mis. modul QC memindahkan tab),
 * dan tanpa itu galat di /keuangan akan tetap tampil setelah pengguna
 * pindah ke tab lain di halaman yang sama. Ini TIDAK membuang state modul pada
 * kasus normal, karena componentDidUpdate hanya bereaksi saat state.error
 * sudah terisi.
 */

### Sub-sistem: `createdrow:created:row` (Klaster #71)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CreatedRow`](file://services/api/scripts/drydock-booking-probe.ts#L6-L6) (`services/api/scripts/drydock-booking-probe.ts:6-6`) [Tipe: `interface`]
    - *Signature:* `interface CreatedRow`

### Sub-sistem: `env:runwithenv:process` (Klaster #73)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`runWithEnv`](file://services/api/scripts/env-probe.ts#L6-L18) (`services/api/scripts/env-probe.ts:6-18`) [Tipe: `function`]
    - *Signature:* `(envOverrides: Record<string, string | undefined>, fn: () => void)`
    - *Deskripsi:* // Simpan process.env asli

### Sub-sistem: `riil:mulberry32:mulberry` (Klaster #78)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mulberry32`](file://services/api/scripts/gen-seed-data.ts#L14-L22) (`services/api/scripts/gen-seed-data.ts:14-22`) [Tipe: `function`]
    - *Signature:* `(seed: number)`
    - *Deskripsi:* // tanpa memuat data riil (nama orang riil, rekening riil, email riil).

### Sub-sistem: `boqrow:boq:row` (Klaster #84)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoqRow`](file://services/api/scripts/migrate-boq-docs.ts#L5-L5) (`services/api/scripts/migrate-boq-docs.ts:5-5`) [Tipe: `interface`]
    - *Signature:* `interface BoqRow`

### Sub-sistem: `docrow:doc:row` (Klaster #85)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DocRow`](file://services/api/scripts/migrate-boq-docs.ts#L6-L6) (`services/api/scripts/migrate-boq-docs.ts:6-6`) [Tipe: `interface`]
    - *Signature:* `interface DocRow`

### Sub-sistem: `planneditem:planned:item` (Klaster #86)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PlannedItem`](file://services/api/scripts/migrate-boq-docs.ts#L7-L7) (`services/api/scripts/migrate-boq-docs.ts:7-7`) [Tipe: `interface`]
    - *Signature:* `interface PlannedItem`

### Sub-sistem: `groupplan:group:plan` (Klaster #87)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`GroupPlan`](file://services/api/scripts/migrate-boq-docs.ts#L8-L19) (`services/api/scripts/migrate-boq-docs.ts:8-19`) [Tipe: `interface`]
    - *Signature:* `interface GroupPlan`

### Sub-sistem: `boqmigrationsummary:migration:summary` (Klaster #88)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoqMigrationSummary`](file://services/api/scripts/migrate-boq-docs.ts#L20-L25) (`services/api/scripts/migrate-boq-docs.ts:20-25`) [Tipe: `interface`]
    - *Signature:* `interface BoqMigrationSummary`

### Sub-sistem: `userrow:user:row` (Klaster #91)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UserRow`](file://services/api/scripts/migrate-roles.ts#L4-L8) (`services/api/scripts/migrate-roles.ts:4-8`) [Tipe: `interface`]
    - *Signature:* `interface UserRow`

### Sub-sistem: `assert` (Klaster #92)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`assert`](file://services/api/scripts/page-probe.ts#L31-L38) (`services/api/scripts/page-probe.ts:31-38`) [Tipe: `function`]
    - *Signature:* `(ok: boolean, label: string, detail = ""): void`

### Sub-sistem: `row` (Klaster #93)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/scripts/page-probe.ts#L79-L82) (`services/api/scripts/page-probe.ts:79-82`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `updated:byorder:comparator` (Klaster #94)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`byOrder`](file://services/api/scripts/page-probe.ts#L89-L90) (`services/api/scripts/page-probe.ts:89-90`) [Tipe: `function`]
    - *Signature:* `(a: Row, b: Row): number`
    - *Deskripsi:* /** Comparator tuple yang setara dengan klausa WHERE server:
 *  (updated_at > ?) OR (updated_at = ? AND id > ?) */

### Sub-sistem: `keyset:pullkeyset:opportunity` (Klaster #95)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pullKeyset`](file://services/api/scripts/page-probe.ts#L94-L107) (`services/api/scripts/page-probe.ts:94-107`) [Tipe: `function`]
    - *Signature:* `(table: Row[], pageSize: number, mutate: () => void): string[]`
    - *Deskripsi:* /** Tarik seluruh tabel dengan keyset. Setiap "halaman" opportunity bagi
 *  penulis lain untuk mengubah satu baris di tengah pembacaan. */

### Sub-sistem: `perangkat:offset:halaman` (Klaster #96)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pullOffset`](file://services/api/scripts/page-probe.ts#L112-L122) (`services/api/scripts/page-probe.ts:112-122`) [Tipe: `function`]
    - *Signature:* `(table: Row[], pageSize: number, mutate: () => void): string[]`
    - *Deskripsi:* /** Tarik dengan OFFSET - cara lama, untuk membuktikan ia memang bocor.
 *  Mutasi harus terjadi SETELAH halaman dibaca; itu urutan dunia nyata:
 *  perangkat A sudah memegang halaman 1, lalu perangkat B menulis. */

### Sub-sistem: `perangkat:halaman:build` (Klaster #97)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`build`](file://services/api/scripts/page-probe.ts#L124-L128) (`services/api/scripts/page-probe.ts:124-128`) [Tipe: `function`]
    - *Signature:* `(n: number): Row[]`
    - *Deskripsi:* /** Tarik dengan OFFSET - cara lama, untuk membuktikan ia memang bocor.
 *  Mutasi harus terjadi SETELAH halaman dibaca; itu urutan dunia nyata:
 *  perangkat A sudah memegang halaman 1, lalu perangkat B menulis. */

### Sub-sistem: `perangkat:halaman:belumsentuh` (Klaster #98)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`belumSentuh`](file://services/api/scripts/page-probe.ts#L130-L130) (`services/api/scripts/page-probe.ts:130-130`) [Tipe: `function`]
    - *Signature:* `(): void`
    - *Deskripsi:* /** Tarik dengan OFFSET - cara lama, untuk membuktikan ia memang bocor.
 *  Mutasi harus terjadi SETELAH halaman dibaca; itu urutan dunia nyata:
 *  perangkat A sudah memegang halaman 1, lalu perangkat B menulis. */

### Sub-sistem: `penanda:perangkat:halaman` (Klaster #99)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`penanda`](file://services/api/scripts/page-probe.ts#L133-L135) (`services/api/scripts/page-probe.ts:133-135`) [Tipe: `function`]
    - *Signature:* `(table: Row[]): void`
    - *Deskripsi:* /** Tarik dengan OFFSET - cara lama, untuk membuktikan ia memang bocor.
 *  Mutasi harus terjadi SETELAH halaman dibaca; itu urutan dunia nyata:
 *  perangkat A sudah memegang halaman 1, lalu perangkat B menulis. */

### Sub-sistem: `sample` (Klaster #100)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Sample`](file://services/api/scripts/pdf-db-probe.ts#L40-L43) (`services/api/scripts/pdf-db-probe.ts:40-43`) [Tipe: `interface`]
    - *Signature:* `interface Sample`

### Sub-sistem: `probe:keamanan:fase` (Klaster #111)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProbeResult`](file://services/api/scripts/security-probe.ts#L33-L41) (`services/api/scripts/security-probe.ts:33-41`) [Tipe: `interface`]
    - *Signature:* `interface ProbeResult`
    - *Deskripsi:* /**
 * security-probe.ts — Runtime Security Probe untuk ISMS API (F1-05).
 * Memeriksa skenario baseline dan regresi task keamanan memakai app.inject() tanpa membuka port.
 *
 * Pada fase baseline (F1-05), skrip ini melaporkan status (mode --report)
 * tanpa menggagalkan proses (exit 0). Pada Fase 2 (F2-09), probe ini
 * dinaikkan menjadi gate CI yang memvalidasi perbaikan celah keamanan.
 */

### Sub-sistem: `userrow:user:row` (Klaster #118)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UserRow`](file://services/api/src/app.ts#L44-L54) (`services/api/src/app.ts:44-54`) [Tipe: `interface`]
    - *Signature:* `interface UserRow`

### Sub-sistem: `auditinput:audit:input` (Klaster #120)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditInput`](file://services/api/src/audit.ts#L5-L12) (`services/api/src/audit.ts:5-12`) [Tipe: `interface`]
    - *Signature:* `interface AuditInput`

### Sub-sistem: `auditwriteoptions:options:write` (Klaster #121)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditWriteOptions`](file://services/api/src/audit.ts#L14-L17) (`services/api/src/audit.ts:14-17`) [Tipe: `interface`]
    - *Signature:* `interface AuditWriteOptions`

### Sub-sistem: `duprow:dup:row` (Klaster #124)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DupRow`](file://services/api/src/auditDuplicates.ts#L29-L32) (`services/api/src/auditDuplicates.ts:29-32`) [Tipe: `interface`]
    - *Signature:* `interface DupRow`

### Sub-sistem: `authuser:auth:user` (Klaster #126)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuthUser`](file://services/api/src/auth.ts#L8-L20) (`services/api/src/auth.ts:8-20`) [Tipe: `interface`]
    - *Signature:* `interface AuthUser`

### Sub-sistem: `fastifyrequest:fastify:request` (Klaster #127)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FastifyRequest`](file://services/api/src/auth.ts#L23-L25) (`services/api/src/auth.ts:23-25`) [Tipe: `interface`]
    - *Signature:* `interface FastifyRequest`

### Sub-sistem: `spasi:huruf:cabang` (Klaster #132)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CachedUserRecord`](file://services/api/src/auth.ts#L114-L123) (`services/api/src/auth.ts:114-123`) [Tipe: `interface`]
    - *Signature:* `interface CachedUserRecord`
    - *Deskripsi:* /**
 * Cabang yang boleh diakses user. "SEMUA" berarti seluruh cabang.
 *
 * Spasi di kedua sisi dibersihkan tapi HURUF BESAR tetap ketat: spasi di
 * nilai `employees.branch` itu mungkin terjadi dan tidak pernah bermakna,
 * sedangkan perbedaan huruf besar menandakan data yang salah dan harus
 * terlihat - bukan lolos diam-diam.
 */

### Sub-sistem: `spasi:huruf:cabang` (Klaster #134)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SeedAccount`](file://services/api/src/auth.ts#L256-L261) (`services/api/src/auth.ts:256-261`) [Tipe: `interface`]
    - *Signature:* `interface SeedAccount`
    - *Deskripsi:* /**
 * Cabang yang boleh diakses user. "SEMUA" berarti seluruh cabang.
 *
 * Spasi di kedua sisi dibersihkan tapi HURUF BESAR tetap ketat: spasi di
 * nilai `employees.branch` itu mungkin terjadi dan tidak pernah bermakna,
 * sedangkan perbedaan huruf besar menandakan data yang salah dan harus
 * terlihat - bukan lolos diam-diam.
 */

### Sub-sistem: `row` (Klaster #137)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/boqDocs.ts#L29-L29) (`services/api/src/boqDocs.ts:29-29`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `row` (Klaster #142)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/changeOrders.ts#L17-L17) (`services/api/src/changeOrders.ts:17-17`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `cochange:change` (Klaster #144)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CoChange`](file://services/api/src/changeOrders.ts#L29-L29) (`services/api/src/changeOrders.ts:29-29`) [Tipe: `interface`]
    - *Signature:* `interface CoChange`

### Sub-sistem: `applyresult:apply:result` (Klaster #146)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ApplyResult`](file://services/api/src/changeOrders.ts#L90-L90) (`services/api/src/changeOrders.ts:90-90`) [Tipe: `interface`]
    - *Signature:* `interface ApplyResult`

### Sub-sistem: `execresult:exec:result` (Klaster #147)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ExecResult`](file://services/api/src/db.ts#L10-L12) (`services/api/src/db.ts:10-12`) [Tipe: `interface`]
    - *Signature:* `interface ExecResult`

### Sub-sistem: `txcontext:context` (Klaster #148)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TxContext`](file://services/api/src/db.ts#L14-L17) (`services/api/src/db.ts:14-17`) [Tipe: `interface`]
    - *Signature:* `interface TxContext`

### Sub-sistem: `env` (Klaster #158)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Env`](file://services/api/src/env.ts#L3-L17) (`services/api/src/env.ts:3-17`) [Tipe: `interface`]
    - *Signature:* `interface Env`

### Sub-sistem: `conversionrule:rule:conversion` (Klaster #162)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ConversionRule`](file://services/api/src/inventoryConversion.ts#L3-L7) (`services/api/src/inventoryConversion.ts:3-7`) [Tipe: `interface`]
    - *Signature:* `interface ConversionRule`

### Sub-sistem: `row` (Klaster #165)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/inventoryIssue.ts#L9-L9) (`services/api/src/inventoryIssue.ts:9-9`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `issueinput:issue:input` (Klaster #167)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`IssueInput`](file://services/api/src/inventoryIssue.ts#L17-L24) (`services/api/src/inventoryIssue.ts:17-24`) [Tipe: `interface`]
    - *Signature:* `interface IssueInput`

### Sub-sistem: `issueoutput:output:issue` (Klaster #168)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`IssueOutput`](file://services/api/src/inventoryIssue.ts#L26-L26) (`services/api/src/inventoryIssue.ts:26-26`) [Tipe: `interface`]
    - *Signature:* `interface IssueOutput`

### Sub-sistem: `entry` (Klaster #170)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Entry`](file://services/api/src/listCache.ts#L19-L19) (`services/api/src/listCache.ts:19-19`) [Tipe: `interface`]
    - *Signature:* `interface Entry`

### Sub-sistem: `cachegeneration:generation:cache` (Klaster #171)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CacheGeneration`](file://services/api/src/listCache.ts#L20-L20) (`services/api/src/listCache.ts:20-20`) [Tipe: `interface`]
    - *Signature:* `interface CacheGeneration`

### Sub-sistem: `materialrequestinput:material:request` (Klaster #174)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaterialRequestInput`](file://services/api/src/materialRequests.ts#L25-L39) (`services/api/src/materialRequests.ts:25-39`) [Tipe: `interface`]
    - *Signature:* `interface MaterialRequestInput`

### Sub-sistem: `materialrequestresult:result:material` (Klaster #175)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaterialRequestResult`](file://services/api/src/materialRequests.ts#L41-L53) (`services/api/src/materialRequests.ts:41-53`) [Tipe: `interface`]
    - *Signature:* `interface MaterialRequestResult`

### Sub-sistem: `row` (Klaster #177)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/materialRequests.ts#L64-L64) (`services/api/src/materialRequests.ts:64-64`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `fulfillresult:fulfill:result` (Klaster #179)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FulfillResult`](file://services/api/src/materialRequests.ts#L186-L193) (`services/api/src/materialRequests.ts:186-193`) [Tipe: `interface`]
    - *Signature:* `interface FulfillResult`

### Sub-sistem: `decisionresult:decision:result` (Klaster #180)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DecisionResult`](file://services/api/src/materialRequests.ts#L272-L272) (`services/api/src/materialRequests.ts:272-272`) [Tipe: `interface`]
    - *Signature:* `interface DecisionResult`

### Sub-sistem: `row` (Klaster #182)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/poFulfillment.ts#L21-L21) (`services/api/src/poFulfillment.ts:21-21`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `receivelineinput:receive:line` (Klaster #185)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReceiveLineInput`](file://services/api/src/poFulfillment.ts#L82-L89) (`services/api/src/poFulfillment.ts:82-89`) [Tipe: `interface`]
    - *Signature:* `interface ReceiveLineInput`

### Sub-sistem: `receiveinput:receive:input` (Klaster #186)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReceiveInput`](file://services/api/src/poFulfillment.ts#L91-L101) (`services/api/src/poFulfillment.ts:91-101`) [Tipe: `interface`]
    - *Signature:* `interface ReceiveInput`

### Sub-sistem: `receiveresult:receive:result` (Klaster #187)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReceiveResult`](file://services/api/src/poFulfillment.ts#L103-L107) (`services/api/src/poFulfillment.ts:103-107`) [Tipe: `interface`]
    - *Signature:* `interface ReceiveResult`

### Sub-sistem: `returninput:input` (Klaster #188)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReturnInput`](file://services/api/src/poFulfillment.ts#L317-L317) (`services/api/src/poFulfillment.ts:317-317`) [Tipe: `interface`]
    - *Signature:* `interface ReturnInput`

### Sub-sistem: `returnresult:result` (Klaster #189)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReturnResult`](file://services/api/src/poFulfillment.ts#L318-L318) (`services/api/src/poFulfillment.ts:318-318`) [Tipe: `interface`]
    - *Signature:* `interface ReturnResult`

### Sub-sistem: `reassigninput:reassign:input` (Klaster #190)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReassignInput`](file://services/api/src/poFulfillment.ts#L422-L422) (`services/api/src/poFulfillment.ts:422-422`) [Tipe: `interface`]
    - *Signature:* `interface ReassignInput`

### Sub-sistem: `makedevelopermatrix:developer:matrix` (Klaster #192)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeDeveloperMatrix`](file://services/api/src/policy.ts#L97-L105) (`services/api/src/policy.ts:97-105`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makedirekturmatrix:direktur:matrix` (Klaster #193)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeDirekturMatrix`](file://services/api/src/policy.ts#L107-L115) (`services/api/src/policy.ts:107-115`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makemanagermatrix:manager:matrix` (Klaster #194)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeManagerMatrix`](file://services/api/src/policy.ts#L117-L133) (`services/api/src/policy.ts:117-133`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makefinancematrix:finance:matrix` (Klaster #195)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeFinanceMatrix`](file://services/api/src/policy.ts#L135-L157) (`services/api/src/policy.ts:135-157`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makehrmatrix:matrix:sensitif` (Klaster #196)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeHrMatrix`](file://services/api/src/policy.ts#L159-L173) (`services/api/src/policy.ts:159-173`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makeprocurementmatrix:procurement:matrix` (Klaster #197)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeProcurementMatrix`](file://services/api/src/policy.ts#L175-L195) (`services/api/src/policy.ts:175-195`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makegudangmatrix:gudang:matrix` (Klaster #198)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeGudangMatrix`](file://services/api/src/policy.ts#L197-L213) (`services/api/src/policy.ts:197-213`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makeproyekmatrix:matrix:sensitif` (Klaster #199)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeProyekMatrix`](file://services/api/src/policy.ts#L215-L248) (`services/api/src/policy.ts:215-248`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makemekanikmatrix:mekanik:matrix` (Klaster #200)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeMekanikMatrix`](file://services/api/src/policy.ts#L250-L265) (`services/api/src/policy.ts:250-265`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makeqcmatrix:matrix:sensitif` (Klaster #201)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeQcMatrix`](file://services/api/src/policy.ts#L267-L288) (`services/api/src/policy.ts:267-288`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makesubkonmatrix:subkon:matrix` (Klaster #202)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeSubkonMatrix`](file://services/api/src/policy.ts#L290-L302) (`services/api/src/policy.ts:290-302`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makeequipmentmatrix:equipment:matrix` (Klaster #203)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeEquipmentMatrix`](file://services/api/src/policy.ts#L304-L318) (`services/api/src/policy.ts:304-318`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makedrydockmatrix:drydock:matrix` (Klaster #204)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeDrydockMatrix`](file://services/api/src/policy.ts#L320-L332) (`services/api/src/policy.ts:320-332`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `makeviewermatrix:viewer:matrix` (Klaster #205)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`makeViewerMatrix`](file://services/api/src/policy.ts#L334-L349) (`services/api/src/policy.ts:334-349`) [Tipe: `function`]
    - *Signature:* `(): Record<string, Action[]>`
    - *Deskripsi:* // Koleksi operasional non-sensitif

### Sub-sistem: `ratelimitcheck:limit:rate` (Klaster #208)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RateLimitCheck`](file://services/api/src/rateLimit.ts#L4-L7) (`services/api/src/rateLimit.ts:4-7`) [Tipe: `interface`]
    - *Signature:* `interface RateLimitCheck`

### Sub-sistem: `canwritecollection:collection:can` (Klaster #210)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`canWriteCollection`](file://services/api/src/rbac.ts#L23-L25) (`services/api/src/rbac.ts:23-25`) [Tipe: `function`]
    - *Signature:* `(role: unknown, collection: string): boolean`

### Sub-sistem: `refdef:ref:def` (Klaster #211)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RefDef`](file://services/api/src/refs.ts#L8-L13) (`services/api/src/refs.ts:8-13`) [Tipe: `interface`]
    - *Signature:* `interface RefDef`

### Sub-sistem: `manifest` (Klaster #214)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Manifest`](file://services/api/src/restore.ts#L7-L13) (`services/api/src/restore.ts:7-13`) [Tipe: `interface`]
    - *Signature:* `interface Manifest`

### Sub-sistem: `checklistitem:checklist:item` (Klaster #216)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ChecklistItem`](file://services/api/src/scoring.ts#L11-L11) (`services/api/src/scoring.ts:11-11`) [Tipe: `interface`]
    - *Signature:* `interface ChecklistItem`

### Sub-sistem: `checklisttemplate:checklist:template` (Klaster #217)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ChecklistTemplate`](file://services/api/src/scoring.ts#L12-L12) (`services/api/src/scoring.ts:12-12`) [Tipe: `interface`]
    - *Signature:* `interface ChecklistTemplate`

### Sub-sistem: `seedrow:seed:row` (Klaster #220)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SeedRow`](file://services/api/src/seedData.ts#L11-L11) (`services/api/src/seedData.ts:11-11`) [Tipe: `interface`]
    - *Signature:* `interface SeedRow`

### Sub-sistem: `wbsseed:seed:wbs` (Klaster #221)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsSeed`](file://services/api/src/seedData.ts#L13-L13) (`services/api/src/seedData.ts:13-13`) [Tipe: `interface`]
    - *Signature:* `interface WbsSeed`

### Sub-sistem: `teamseed:team:seed` (Klaster #222)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TeamSeed`](file://services/api/src/seedData.ts#L14-L14) (`services/api/src/seedData.ts:14-14`) [Tipe: `interface`]
    - *Signature:* `interface TeamSeed`

### Sub-sistem: `team:2025:012` (Klaster #223)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`S`](file://services/api/src/seedData.ts#L16-L17) (`services/api/src/seedData.ts:16-17`) [Tipe: `function`]
    - *Signature:* `(id: string, key: string, value: number, label: string, group: string): SeedRow`
    - *Deskripsi:* // - wbs/team: proyek NB-2025-012 + RP-2026-003 (selaras TEAM_SEED FE).

### Sub-sistem: `mirrors:seedteambyproject:store` (Klaster #224)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`H`](file://services/api/src/seedData.ts#L225-L228) (`services/api/src/seedData.ts:225-228`) [Tipe: `function`]
    - *Signature:* `(date: string, actor: string, from: number, to: number, note: string, photo?: string)`
    - *Deskripsi:* // Mirrors store seedTeamByProject.

### Sub-sistem: `buildwbsseeds:seeds:build` (Klaster #225)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`buildWbsSeeds`](file://services/api/src/seedData.ts#L265-L273) (`services/api/src/seedData.ts:265-273`) [Tipe: `function`]
    - *Signature:* `(): WbsSeed[]`

### Sub-sistem: `buildteamseeds:seeds:team` (Klaster #226)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`buildTeamSeeds`](file://services/api/src/seedData.ts#L275-L277) (`services/api/src/seedData.ts:275-277`) [Tipe: `function`]
    - *Signature:* `(): TeamSeed[]`

### Sub-sistem: `mirrorrow:mirror:row` (Klaster #227)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MirrorRow`](file://services/api/src/seedFeMirror.ts#L3-L8) (`services/api/src/seedFeMirror.ts:3-8`) [Tipe: `interface`]
    - *Signature:* `interface MirrorRow`

### Sub-sistem: `dijalankan:perubahan:item` (Klaster #228)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Item`](file://services/api/src/seedMirror.ts#L15-L19) (`services/api/src/seedMirror.ts:15-19`) [Tipe: `interface`]
    - *Signature:* `interface Item`
    - *Deskripsi:* // Wajib dijalankan ulang setiap ada perubahan seed FE.

### Sub-sistem: `mirrorrow:mirror:namaexport` (Klaster #229)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MirrorRow`](file://services/api/src/seedMirror.ts#L105-L110) (`services/api/src/seedMirror.ts:105-110`) [Tipe: `interface`]
    - *Signature:* `interface MirrorRow`
    - *Deskripsi:* // [namaExport, tabelBE]

### Sub-sistem: `torows:namaexport:tabelbe` (Klaster #230)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toRows`](file://services/api/src/seedMirror.ts#L112-L126) (`services/api/src/seedMirror.ts:112-126`) [Tipe: `function`]
    - *Signature:* `(table: string, items: unknown): MirrorRow[]`
    - *Deskripsi:* // [namaExport, tabelBE]

### Sub-sistem: `ratesmodule:rates:module` (Klaster #231)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RatesModule`](file://services/api/src/seedReprice.ts#L43-L46) (`services/api/src/seedReprice.ts:43-46`) [Tipe: `interface`]
    - *Signature:* `interface RatesModule`

### Sub-sistem: `row` (Klaster #232)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/seedReprice.ts#L78-L83) (`services/api/src/seedReprice.ts:78-83`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `change` (Klaster #233)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Change`](file://services/api/src/seedReprice.ts#L85-L91) (`services/api/src/seedReprice.ts:85-91`) [Tipe: `interface`]
    - *Signature:* `interface Change`

### Sub-sistem: `mulberry32:mulberry:prng` (Klaster #235)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mulberry32`](file://services/api/src/seedWhatIf.ts#L11-L19) (`services/api/src/seedWhatIf.ts:11-19`) [Tipe: `function`]
    - *Signature:* `(seed: number): () => number`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.

### Sub-sistem: `prng:stabil:antar` (Klaster #236)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/seedWhatIf.ts#L37-L37) (`services/api/src/seedWhatIf.ts:37-37`) [Tipe: `interface`]
    - *Signature:* `interface Row`
    - *Deskripsi:* // Deterministik (PRNG seed tetap) agar hasil stabil antar run.

### Sub-sistem: `row` (Klaster #239)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/serviceApproval.ts#L18-L18) (`services/api/src/serviceApproval.ts:18-18`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `scopeuser:scope:user` (Klaster #244)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ScopeUser`](file://services/api/src/teamScope.ts#L12-L12) (`services/api/src/teamScope.ts:12-12`) [Tipe: `interface`]
    - *Signature:* `interface ScopeUser`

### Sub-sistem: `demouser:demo:user` (Klaster #246)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DemoUser`](file://apps/web/src/auth/auth.tsx#L8-L15) (`apps/web/src/auth/auth.tsx:8-15`) [Tipe: `interface`]
    - *Signature:* `interface DemoUser`

### Sub-sistem: `session` (Klaster #247)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Session`](file://apps/web/src/auth/auth.tsx#L55-L69) (`apps/web/src/auth/auth.tsx:55-69`) [Tipe: `interface`]
    - *Signature:* `interface Session`

### Sub-sistem: `backendloginuser:izin:modular` (Klaster #249)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BackendLoginUser`](file://apps/web/src/auth/auth.tsx#L93-L101) (`apps/web/src/auth/auth.tsx:93-101`) [Tipe: `interface`]
    - *Signature:* `interface BackendLoginUser`
    - *Deskripsi:* /**
 * Pengecekan izin modular berbasis matriks policy server (ADR-0004 & F2-05).
 */

### Sub-sistem: `authctx:izin:modular` (Klaster #250)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuthCtx`](file://apps/web/src/auth/auth.tsx#L103-L107) (`apps/web/src/auth/auth.tsx:103-107`) [Tipe: `interface`]
    - *Signature:* `interface AuthCtx`
    - *Deskripsi:* /**
 * Pengecekan izin modular berbasis matriks policy server (ADR-0004 & F2-05).
 */

### Sub-sistem: `demorole:role:demo` (Klaster #253)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DemoRole`](file://apps/web/src/auth/demoSwitch.ts#L14-L14) (`apps/web/src/auth/demoSwitch.ts:14-14`) [Tipe: `interface`]
    - *Signature:* `interface DemoRole`

### Sub-sistem: `origin` (Klaster #254)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Origin`](file://apps/web/src/auth/demoSwitch.ts#L16-L16) (`apps/web/src/auth/demoSwitch.ts:16-16`) [Tipe: `interface`]
    - *Signature:* `interface Origin`

### Sub-sistem: `loginrole:role:login` (Klaster #258)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`LoginRole`](file://apps/web/src/auth/demoSwitch.ts#L96-L96) (`apps/web/src/auth/demoSwitch.ts:96-96`) [Tipe: `interface`]
    - *Signature:* `interface LoginRole`

### Sub-sistem: `alertprops:alert:props` (Klaster #259)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AlertProps`](file://apps/web/src/components/Alert.tsx#L15-L34) (`apps/web/src/components/Alert.tsx:15-34`) [Tipe: `interface`]
    - *Signature:* `interface AlertProps`

### Sub-sistem: `alertmodalprops:alert:props` (Klaster #261)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AlertModalProps`](file://apps/web/src/components/Alert.tsx#L167-L179) (`apps/web/src/components/Alert.tsx:167-179`) [Tipe: `interface`]
    - *Signature:* `interface AlertModalProps`

### Sub-sistem: `bannerdismiss:dismiss:banner` (Klaster #264)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BannerDismiss`](file://apps/web/src/components/AlertBanner.tsx#L168-L174) (`apps/web/src/components/AlertBanner.tsx:168-174`) [Tipe: `interface`]
    - *Signature:* `interface BannerDismiss`

### Sub-sistem: `alertrow:meta:dampak` (Klaster #267)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AlertRow`](file://apps/web/src/components/AlertBanner.tsx#L386-L411) (`apps/web/src/components/AlertBanner.tsx:386-411`) [Tipe: `function`]
    - *Signature:* `({
  item,
  style,
  onPick,
}: {
  item: ModuleAlertItem;
  style: (typeof LEVEL_STYLE)[AlertLevel];
  onPick?: (rowId: string) => void;
})`
    - *Deskripsi:* /** Baris meta kecil: dampak + umur + tenggat. Tidak ada isinya, tidak tampil. */

### Sub-sistem: `auditrow:audit:row` (Klaster #268)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditRow`](file://apps/web/src/components/ChangeHistory.tsx#L5-L11) (`apps/web/src/components/ChangeHistory.tsx:5-11`) [Tipe: `interface`]
    - *Signature:* `interface AuditRow`

### Sub-sistem: `auditchange:change:audit` (Klaster #269)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditChange`](file://apps/web/src/components/ChangeHistory.tsx#L13-L17) (`apps/web/src/components/ChangeHistory.tsx:13-17`) [Tipe: `interface`]
    - *Signature:* `interface AuditChange`

### Sub-sistem: `historyentryitem:entry:history` (Klaster #270)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`HistoryEntryItem`](file://apps/web/src/components/ChangeHistory.tsx#L50-L59) (`apps/web/src/components/ChangeHistory.tsx:50-59`) [Tipe: `interface`]
    - *Signature:* `interface HistoryEntryItem`

### Sub-sistem: `dateinput:date:input` (Klaster #273)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DateInput`](file://apps/web/src/components/DateInput.tsx#L1-L37) (`apps/web/src/components/DateInput.tsx:1-37`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  ariaLabel,
  locale = "id",
  disabled = false,
  required = false,
  min,
  max,
  className = "",
}: {
  /** Nilai tanggal selalu YYYY-MM-DD (ISO), atau string kosong. */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  locale?: "id" | "en";
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
})`

### Sub-sistem: `previewdoc:preview:doc` (Klaster #276)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PreviewDoc`](file://apps/web/src/components/DocumentPreview.tsx#L24-L31) (`apps/web/src/components/DocumentPreview.tsx:24-31`) [Tipe: `interface`]
    - *Signature:* `interface PreviewDoc`

### Sub-sistem: `documentpreviewmodal:document:preview` (Klaster #277)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DocumentPreviewModal`](file://apps/web/src/components/DocumentPreview.tsx#L230-L239) (`apps/web/src/components/DocumentPreview.tsx:230-239`) [Tipe: `function`]
    - *Signature:* `({ doc, onClose }: { doc: PreviewDoc | null; onClose: () => void })`

### Sub-sistem: `flownode:flow:node` (Klaster #278)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FlowNode`](file://apps/web/src/components/FlowTree.tsx#L9-L23) (`apps/web/src/components/FlowTree.tsx:9-23`) [Tipe: `interface`]
    - *Signature:* `interface FlowNode`

### Sub-sistem: `photouploaditem:upload:photo` (Klaster #280)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PhotoUploadItem`](file://apps/web/src/components/PhotoUploader.tsx#L6-L9) (`apps/web/src/components/PhotoUploader.tsx:6-9`) [Tipe: `interface`]
    - *Signature:* `interface PhotoUploadItem`

### Sub-sistem: `photouploaderlabels:uploader:labels` (Klaster #281)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PhotoUploaderLabels`](file://apps/web/src/components/PhotoUploader.tsx#L11-L19) (`apps/web/src/components/PhotoUploader.tsx:11-19`) [Tipe: `interface`]
    - *Signature:* `interface PhotoUploaderLabels`

### Sub-sistem: `pendingphoto:pending:photo` (Klaster #282)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PendingPhoto`](file://apps/web/src/components/PhotoUploader.tsx#L21-L25) (`apps/web/src/components/PhotoUploader.tsx:21-25`) [Tipe: `interface`]
    - *Signature:* `interface PendingPhoto`

### Sub-sistem: `searchselectoption:select:option` (Klaster #285)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SearchSelectOption`](file://apps/web/src/components/SearchSelect.tsx#L5-L9) (`apps/web/src/components/SearchSelect.tsx:5-9`) [Tipe: `interface`]
    - *Signature:* `interface SearchSelectOption`

### Sub-sistem: `servicenote:note:service` (Klaster #287)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServiceNote`](file://apps/web/src/components/ServiceNotes.tsx#L31-L36) (`apps/web/src/components/ServiceNotes.tsx:31-36`) [Tipe: `interface`]
    - *Signature:* `interface ServiceNote`

### Sub-sistem: `servicenoteslabels:labels:notes` (Klaster #288)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServiceNotesLabels`](file://apps/web/src/components/ServiceNotes.tsx#L43-L64) (`apps/web/src/components/ServiceNotes.tsx:43-64`) [Tipe: `interface`]
    - *Signature:* `interface ServiceNotesLabels`

### Sub-sistem: `servicenotesprops:notes:service` (Klaster #289)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServiceNotesProps`](file://apps/web/src/components/ServiceNotes.tsx#L66-L71) (`apps/web/src/components/ServiceNotes.tsx:66-71`) [Tipe: `interface`]
    - *Signature:* `interface ServiceNotesProps`

### Sub-sistem: `servicenotesbutton:notes:button` (Klaster #291)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServiceNotesButton`](file://apps/web/src/components/ServiceNotes.tsx#L224-L241) (`apps/web/src/components/ServiceNotes.tsx:224-241`) [Tipe: `function`]
    - *Signature:* `({
  count,
  labels,
  onClick,
}: {
  count: number;
  labels: Pick<ServiceNotesLabels, "notes" | "notesTitle">;
  onClick: () => void;
}): ReactNode`

### Sub-sistem: `statuschipoption:chip:option` (Klaster #292)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StatusChipOption`](file://apps/web/src/components/StatusChips.tsx#L4-L8) (`apps/web/src/components/StatusChips.tsx:4-8`) [Tipe: `interface`]
    - *Signature:* `interface StatusChipOption`

### Sub-sistem: `statuschips:chips:status` (Klaster #293)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StatusChips`](file://apps/web/src/components/StatusChips.tsx#L11-L70) (`apps/web/src/components/StatusChips.tsx:11-70`) [Tipe: `function`]
    - *Signature:* `({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly StatusChipOption[];
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
})`

### Sub-sistem: `toastaction:action:toast` (Klaster #294)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ToastAction`](file://apps/web/src/components/Toast.tsx#L7-L10) (`apps/web/src/components/Toast.tsx:7-10`) [Tipe: `interface`]
    - *Signature:* `interface ToastAction`

### Sub-sistem: `toastoptions:toast:options` (Klaster #295)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ToastOptions`](file://apps/web/src/components/Toast.tsx#L12-L19) (`apps/web/src/components/Toast.tsx:12-19`) [Tipe: `interface`]
    - *Signature:* `interface ToastOptions`

### Sub-sistem: `toastitem:toast:item` (Klaster #296)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ToastItem`](file://apps/web/src/components/Toast.tsx#L21-L30) (`apps/web/src/components/Toast.tsx:21-30`) [Tipe: `interface`]
    - *Signature:* `interface ToastItem`

### Sub-sistem: `toast:success:toastcardprops` (Klaster #297)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ToastCardProps`](file://apps/web/src/components/Toast.tsx#L173-L176) (`apps/web/src/components/Toast.tsx:173-176`) [Tipe: `interface`]
    - *Signature:* `interface ToastCardProps`
    - *Deskripsi:* /**
 * Menerbitkan notifikasi toast ke seluruh aplikasi.
 * Kompatibel penuh dengan signature lama: toast(message, "success" | "info")
 * serta mendukung options tambahan dan method pembantu (toast.success, toast.error, dll).
 */

### Sub-sistem: `flashstate:flash:state` (Klaster #300)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FlashState`](file://apps/web/src/components/rowHighlight.ts#L25-L30) (`apps/web/src/components/rowHighlight.ts:25-30`) [Tipe: `interface`]
    - *Signature:* `interface FlashState`

### Sub-sistem: `rowhighlightinput:highlight:input` (Klaster #301)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RowHighlightInput`](file://apps/web/src/components/rowHighlight.ts#L32-L41) (`apps/web/src/components/rowHighlight.ts:32-41`) [Tipe: `interface`]
    - *Signature:* `interface RowHighlightInput`

### Sub-sistem: `stagger` (Klaster #302)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Stagger`](file://apps/web/src/components/ui.tsx#L36-L63) (`apps/web/src/components/ui.tsx:36-63`) [Tipe: `function`]
    - *Signature:* `({
  children,
  className = "",
  id,
  animate: withMotion = true,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /* false = div biasa tanpa framer-motion. Dipakai saat elemen ini jadi
     target export PDF: motion.div menyimpan inline transform/opacity
     hasil animasi, dan html2canvas memotret apa adanya - transform sisa
     membuat konten bergeser atau transparan di dalam PDF. */
  animate?: boolean;
})`

### Sub-sistem: `staggeritem:stagger:item` (Klaster #303)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StaggerItem`](file://apps/web/src/components/ui.tsx#L65-L83) (`apps/web/src/components/ui.tsx:65-83`) [Tipe: `function`]
    - *Signature:* `({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
})`

### Sub-sistem: `card` (Klaster #304)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Card`](file://apps/web/src/components/ui.tsx#L87-L97) (`apps/web/src/components/ui.tsx:87-97`) [Tipe: `function`]
    - *Signature:* `({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
})`

### Sub-sistem: `cardheader:header:card` (Klaster #305)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CardHeader`](file://apps/web/src/components/ui.tsx#L99-L117) (`apps/web/src/components/ui.tsx:99-117`) [Tipe: `function`]
    - *Signature:* `({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
})`

### Sub-sistem: `glowcard:glow:card` (Klaster #306)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`GlowCard`](file://apps/web/src/components/ui.tsx#L119-L133) (`apps/web/src/components/ui.tsx:119-133`) [Tipe: `function`]
    - *Signature:* `({
  children,
  gradient = "gradient-hero",
  className = "",
}: {
  children: ReactNode;
  gradient?: string;
  className?: string;
})`

### Sub-sistem: `badge` (Klaster #307)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Badge`](file://apps/web/src/components/ui.tsx#L174-L208) (`apps/web/src/components/ui.tsx:174-208`) [Tipe: `function`]
    - *Signature:* `({
  children,
  tone = "gray",
  className = "",
  title,
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
  /** Tooltip native. Dipakai badge status yang butuh penjelasan (mis. why this item is low). */
  title?: string;
})`

### Sub-sistem: `statusbadge:badge:status` (Klaster #308)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StatusBadge`](file://apps/web/src/components/ui.tsx#L305-L308) (`apps/web/src/components/ui.tsx:305-308`) [Tipe: `function`]
    - *Signature:* `({ status, label }: { status: string; label?: string })`

### Sub-sistem: `donut` (Klaster #310)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Donut`](file://apps/web/src/components/ui.tsx#L423-L457) (`apps/web/src/components/ui.tsx:423-457`) [Tipe: `function`]
    - *Signature:* `({
  data,
  colors = ["#27272A", "#E61919", "#A1A1AA", "#FF8A8A", "#D4D4D8"],
  size = 140,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number }[];
  colors?: string[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
})`

### Sub-sistem: `radialgauge:radial:gauge` (Klaster #311)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RadialGauge`](file://apps/web/src/components/ui.tsx#L459-L499) (`apps/web/src/components/ui.tsx:459-499`) [Tipe: `function`]
    - *Signature:* `({
  value,
  label,
  max = 100,
  color = "#E61919",
  size = 120,
}: {
  value: number;
  label?: string;
  max?: number;
  color?: string;
  size?: number;
})`

### Sub-sistem: `charttooltip:tooltip:chart` (Klaster #312)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ChartTooltip`](file://apps/web/src/components/ui.tsx#L501-L533) (`apps/web/src/components/ui.tsx:501-533`) [Tipe: `function`]
    - *Signature:* `({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }[];
  label?: string;
  formatter?: (value: number | string, name: string) => string;
  labelFormatter?: (label: string) => string;
})`

### Sub-sistem: `pageheader:header:page` (Klaster #313)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PageHeader`](file://apps/web/src/components/ui.tsx#L559-L590) (`apps/web/src/components/ui.tsx:559-590`) [Tipe: `function`]
    - *Signature:* `({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  /** Dulu judul bergradien; kini diabaikan (ADR-0014), dipertahankan untuk kompatibilitas. */
  gradient?: boolean;
})`

### Sub-sistem: `progressbar:bar:progress` (Klaster #314)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProgressBar`](file://apps/web/src/components/ui.tsx#L593-L625) (`apps/web/src/components/ui.tsx:593-625`) [Tipe: `function`]
    - *Signature:* `({
  value,
  tone = "navy",
  className = "",
  showLabel,
}: {
  value: number;
  tone?: "navy" | "green" | "amber" | "red" | "ocean" | "teal";
  className?: string;
  showLabel?: boolean;
})`

### Sub-sistem: `tabs` (Klaster #315)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Tabs`](file://apps/web/src/components/ui.tsx#L627-L671) (`apps/web/src/components/ui.tsx:627-671`) [Tipe: `function`]
    - *Signature:* `({
  tabs,
  active,
  onChange,
  labels,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  /** Label tampil per tab id - id logika tidak berubah (aman untuk state). */
  labels?: Record<string, string>;
})`

### Sub-sistem: `emptystate:empty:state` (Klaster #316)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EmptyState`](file://apps/web/src/components/ui.tsx#L673-L689) (`apps/web/src/components/ui.tsx:673-689`) [Tipe: `function`]
    - *Signature:* `({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
})`

### Sub-sistem: `errorboundarystate:boundary:sesuai` (Klaster #317)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ErrorBoundaryState`](file://apps/web/src/components/ui.tsx#L693-L695) (`apps/web/src/components/ui.tsx:693-695`) [Tipe: `interface`]
    - *Signature:* `interface ErrorBoundaryState`
    - *Deskripsi:* /** Teks status sesuai locale aktif (nilai data tidak diubah). */

### Sub-sistem: `skeleton` (Klaster #319)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Skeleton`](file://apps/web/src/components/ui.tsx#L779-L781) (`apps/web/src/components/ui.tsx:779-781`) [Tipe: `function`]
    - *Signature:* `({ className = "" }: { className?: string })`

### Sub-sistem: `confirmmodal:modal:confirm` (Klaster #321)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ConfirmModal`](file://apps/web/src/components/ui.tsx#L900-L943) (`apps/web/src/components/ui.tsx:900-943`) [Tipe: `function`]
    - *Signature:* `({
  open,
  title,
  desc,
  confirmLabel = "Ya, lanjutkan",
  danger = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  desc: string;
  confirmLabel?: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<unknown> | unknown;
})`

### Sub-sistem: `field` (Klaster #322)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Field`](file://apps/web/src/components/ui.tsx#L945-L961) (`apps/web/src/components/ui.tsx:945-961`) [Tipe: `function`]
    - *Signature:* `({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
})`

### Sub-sistem: `formgrid:grid:form` (Klaster #323)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FormGrid`](file://apps/web/src/components/ui.tsx#L963-L965) (`apps/web/src/components/ui.tsx:963-965`) [Tipe: `function`]
    - *Signature:* `({ children }: { children: ReactNode })`

### Sub-sistem: `pickeroption:picker:option` (Klaster #325)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PickerOption`](file://apps/web/src/components/ui.tsx#L1068-L1072) (`apps/web/src/components/ui.tsx:1068-1072`) [Tipe: `interface`]
    - *Signature:* `interface PickerOption`

### Sub-sistem: `sortstate:sort:state` (Klaster #327)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SortState`](file://apps/web/src/components/ui.tsx#L1284-L1284) (`apps/web/src/components/ui.tsx:1284-1284`) [Tipe: `interface`]
    - *Signature:* `interface SortState`

### Sub-sistem: `sortth:sort` (Klaster #329)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SortTh`](file://apps/web/src/components/ui.tsx#L1332-L1365) (`apps/web/src/components/ui.tsx:1332-1365`) [Tipe: `function`]
    - *Signature:* `({
  label,
  sortKey,
  sort,
  onSort,
  title,
  rowSpan,
  colSpan,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  title?: string;
  rowSpan?: number;
  colSpan?: number;
})`

### Sub-sistem: `serverpage:page:server` (Klaster #333)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServerPage`](file://apps/web/src/components/ui.tsx#L1571-L1577) (`apps/web/src/components/ui.tsx:1571-1577`) [Tipe: `interface`]
    - *Signature:* `interface ServerPage`

### Sub-sistem: `rowaction:action:row` (Klaster #336)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RowAction`](file://apps/web/src/components/ui.tsx#L1724-L1761) (`apps/web/src/components/ui.tsx:1724-1761`) [Tipe: `function`]
    - *Signature:* `({
  icon: Icon,
  label,
  ariaLabel,
  tone = "neutral",
  onClick,
  disabled = false,
  stopPropagation = true,
  className = "",
}: {
  icon: LucideIcon;
  /** Wajib: jadi isi tooltip dan (kalau `ariaLabel` kosong) nama terbaca. */
  label: string;
  /** Nama lebih panjang untuk screen reader, mis. "Ubah movement MOV-1". */
  ariaLabel?: string;
  tone?: keyof typeof ROW_ACTION_TONE;
  onClick: () => void;
  disabled?: boolean;
  /** Set false kalau pemanggil memang mau navigasi baris ikut jalan. */
  stopPropagation?: boolean;
  className?: string;
})`

### Sub-sistem: `flowstrip:strip:flow` (Klaster #339)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FlowStrip`](file://apps/web/src/components/ui.tsx#L1943-L1993) (`apps/web/src/components/ui.tsx:1943-1993`) [Tipe: `function`]
    - *Signature:* `({
  steps,
  current,
  onSelect,
  ariaLabel,
}: {
  steps: string[];
  current: string;
  onSelect?: (step: string) => void;
  ariaLabel?: string;
})`

### Sub-sistem: `deeplinkparams:params:deep` (Klaster #342)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DeepLinkParams`](file://apps/web/src/components/useDeepLink.ts#L28-L34) (`apps/web/src/components/useDeepLink.ts:28-34`) [Tipe: `interface`]
    - *Signature:* `interface DeepLinkParams`

### Sub-sistem: `pdfdocstate:state:pdf` (Klaster #345)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PdfDocState`](file://apps/web/src/components/usePdfDoc.ts#L19-L30) (`apps/web/src/components/usePdfDoc.ts:19-30`) [Tipe: `interface`]
    - *Signature:* `interface PdfDocState`

### Sub-sistem: `coaexcel:coa:excel` (Klaster #348)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CoaExcel`](file://apps/web/src/data/financeExcel.ts#L7-L7) (`apps/web/src/data/financeExcel.ts:7-7`) [Tipe: `interface`]
    - *Signature:* `interface CoaExcel`

### Sub-sistem: `apexcel:excel` (Klaster #349)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ApExcel`](file://apps/web/src/data/financeExcel.ts#L212-L212) (`apps/web/src/data/financeExcel.ts:212-212`) [Tipe: `interface`]
    - *Signature:* `interface ApExcel`

### Sub-sistem: `arexcel:excel` (Klaster #350)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ArExcel`](file://apps/web/src/data/financeExcel.ts#L269-L269) (`apps/web/src/data/financeExcel.ts:269-269`) [Tipe: `interface`]
    - *Signature:* `interface ArExcel`

### Sub-sistem: `kasbankexcel:bank:kas` (Klaster #351)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KasBankExcel`](file://apps/web/src/data/financeExcel.ts#L338-L338) (`apps/web/src/data/financeExcel.ts:338-338`) [Tipe: `interface`]
    - *Signature:* `interface KasBankExcel`

### Sub-sistem: `laporansnapshot:laporan:snapshot` (Klaster #352)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`LaporanSnapshot`](file://apps/web/src/data/financeExcel.ts#L375-L377) (`apps/web/src/data/financeExcel.ts:375-377`) [Tipe: `interface`]
    - *Signature:* `interface LaporanSnapshot`

### Sub-sistem: `lsput:put` (Klaster #357)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`lsPut`](file://apps/web/src/data/idb.ts#L190-L198) (`apps/web/src/data/idb.ts:190-198`) [Tipe: `function`]
    - *Signature:* `(col: string, value: unknown): boolean`

### Sub-sistem: `designstage:design:stage` (Klaster #358)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DesignStage`](file://apps/web/src/data/index.ts#L13-L19) (`apps/web/src/data/index.ts:13-19`) [Tipe: `interface`]
    - *Signature:* `interface DesignStage`

### Sub-sistem: `project` (Klaster #359)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Project`](file://apps/web/src/data/index.ts#L21-L36) (`apps/web/src/data/index.ts:21-36`) [Tipe: `interface`]
    - *Signature:* `interface Project`

### Sub-sistem: `inventoryitem:inventory:item` (Klaster #360)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`InventoryItem`](file://apps/web/src/data/index.ts#L443-L460) (`apps/web/src/data/index.ts:443-460`) [Tipe: `interface`]
    - *Signature:* `interface InventoryItem`

### Sub-sistem: `servicerecord:record:service` (Klaster #361)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServiceRecord`](file://apps/web/src/data/index.ts#L563-L583) (`apps/web/src/data/index.ts:563-583`) [Tipe: `interface`]
    - *Signature:* `interface ServiceRecord`

### Sub-sistem: `materialrequest:material:request` (Klaster #362)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaterialRequest`](file://apps/web/src/data/index.ts#L597-L615) (`apps/web/src/data/index.ts:597-615`) [Tipe: `interface`]
    - *Signature:* `interface MaterialRequest`

### Sub-sistem: `bomitem:bom:item` (Klaster #363)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BomItem`](file://apps/web/src/data/index.ts#L619-L619) (`apps/web/src/data/index.ts:619-619`) [Tipe: `interface`]
    - *Signature:* `interface BomItem`

### Sub-sistem: `sparepart` (Klaster #364)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Sparepart`](file://apps/web/src/data/index.ts#L642-L655) (`apps/web/src/data/index.ts:642-655`) [Tipe: `interface`]
    - *Signature:* `interface Sparepart`

### Sub-sistem: `invoice` (Klaster #365)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Invoice`](file://apps/web/src/data/index.ts#L666-L674) (`apps/web/src/data/index.ts:666-674`) [Tipe: `interface`]
    - *Signature:* `interface Invoice`

### Sub-sistem: `activity` (Klaster #366)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Activity`](file://apps/web/src/data/index.ts#L789-L797) (`apps/web/src/data/index.ts:789-797`) [Tipe: `interface`]
    - *Signature:* `interface Activity`

### Sub-sistem: `boqitem:item` (Klaster #367)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoQItem`](file://apps/web/src/data/index.ts#L996-L1014) (`apps/web/src/data/index.ts:996-1014`) [Tipe: `interface`]
    - *Signature:* `interface BoQItem`

### Sub-sistem: `boqdoc:doc` (Klaster #368)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoQDoc`](file://apps/web/src/data/index.ts#L1040-L1056) (`apps/web/src/data/index.ts:1040-1056`) [Tipe: `interface`]
    - *Signature:* `interface BoQDoc`

### Sub-sistem: `orders:purchase` (Klaster #369)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`mk`](file://apps/web/src/data/index.ts#L1092-L1092) (`apps/web/src/data/index.ts:1092-1092`) [Tipe: `function`]
    - *Signature:* `(vs: number[])`
    - *Deskripsi:* // Purchase orders

### Sub-sistem: `checklistitemdef:def:checklist` (Klaster #370)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ChecklistItemDef`](file://apps/web/src/data/index.ts#L1122-L1122) (`apps/web/src/data/index.ts:1122-1122`) [Tipe: `interface`]
    - *Signature:* `interface ChecklistItemDef`

### Sub-sistem: `checklisttemplatedef:def:checklist` (Klaster #371)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ChecklistTemplateDef`](file://apps/web/src/data/index.ts#L1123-L1123) (`apps/web/src/data/index.ts:1123-1123`) [Tipe: `interface`]
    - *Signature:* `interface ChecklistTemplateDef`

### Sub-sistem: `offlinepersistenceio:persistence:offline` (Klaster #372)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`OfflinePersistenceIO`](file://apps/web/src/data/offlinePersistence.ts#L1-L5) (`apps/web/src/data/offlinePersistence.ts:1-5`) [Tipe: `interface`]
    - *Signature:* `interface OfflinePersistenceIO`

### Sub-sistem: `projectexistencechange:existence:change` (Klaster #375)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProjectExistenceChange`](file://apps/web/src/data/projectPullScope.ts#L1-L5) (`apps/web/src/data/projectPullScope.ts:1-5`) [Tipe: `interface`]
    - *Signature:* `interface ProjectExistenceChange`

### Sub-sistem: `smd:trm:vnd` (Klaster #377)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WO_MS`](file://apps/web/src/data/seeds.ts#L33-L34) (`apps/web/src/data/seeds.ts:33-34`) [Tipe: `function`]
    - *Signature:* `(...stages: WoStage[])`
    - *Deskripsi:* // TRM-SB / M-SB / DS-SB / SJ-SMD / TT-SMD / C-SB / VND-SB / V-SB / QT-SB / KTR-SB.

### Sub-sistem: `sessionfence:fence:session` (Klaster #378)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SessionFence`](file://apps/web/src/data/sessionFence.ts#L1-L4) (`apps/web/src/data/sessionFence.ts:1-4`) [Tipe: `interface`]
    - *Signature:* `interface SessionFence`

### Sub-sistem: `conflictholdstorage:hold:conflict` (Klaster #380)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ConflictHoldStorage`](file://apps/web/src/data/sideMapConflictHolds.ts#L3-L7) (`apps/web/src/data/sideMapConflictHolds.ts:3-7`) [Tipe: `interface`]
    - *Signature:* `interface ConflictHoldStorage`

### Sub-sistem: `storeitem:store:item` (Klaster #382)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StoreItem`](file://apps/web/src/data/store.tsx#L57-L60) (`apps/web/src/data/store.tsx:57-60`) [Tipe: `interface`]
    - *Signature:* `interface StoreItem`

### Sub-sistem: `wbsphoto:photo:wbs` (Klaster #383)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsPhoto`](file://apps/web/src/data/store.tsx#L62-L66) (`apps/web/src/data/store.tsx:62-66`) [Tipe: `interface`]
    - *Signature:* `interface WbsPhoto`

### Sub-sistem: `wbsassignee:assignee:wbs` (Klaster #384)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsAssignee`](file://apps/web/src/data/store.tsx#L68-L73) (`apps/web/src/data/store.tsx:68-73`) [Tipe: `interface`]
    - *Signature:* `interface WbsAssignee`

### Sub-sistem: `wbshistoryitem:history:wbs` (Klaster #385)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsHistoryItem`](file://apps/web/src/data/store.tsx#L75-L86) (`apps/web/src/data/store.tsx:75-86`) [Tipe: `interface`]
    - *Signature:* `interface WbsHistoryItem`

### Sub-sistem: `wbsitem:wbs:item` (Klaster #386)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsItem`](file://apps/web/src/data/store.tsx#L88-L109) (`apps/web/src/data/store.tsx:88-109`) [Tipe: `interface`]
    - *Signature:* `interface WbsItem`

### Sub-sistem: `storeshape:shape:store` (Klaster #387)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StoreShape`](file://apps/web/src/data/store.tsx#L111-L181) (`apps/web/src/data/store.tsx:111-181`) [Tipe: `interface`]
    - *Signature:* `interface StoreShape`

### Sub-sistem: `storectx:trail:menunjukkan` (Klaster #390)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StoreCtx`](file://apps/web/src/data/store.tsx#L646-L673) (`apps/web/src/data/store.tsx:646-673`) [Tipe: `interface`]
    - *Signature:* `interface StoreCtx`
    - *Deskripsi:* /** Username akun yang sedang login, untuk kolom "Aktor" jejak aktivitas.
 *  Dulu selalu "Anda", sehingga Audit Trail tidak bisa menunjukkan siapa
 *  pelakunya (catatan CTO 15 Okt). */

### Sub-sistem: `materialrequestargs:args:material` (Klaster #394)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaterialRequestArgs`](file://apps/web/src/data/useMaterialRequest.ts#L15-L24) (`apps/web/src/data/useMaterialRequest.ts:15-24`) [Tipe: `interface`]
    - *Signature:* `interface MaterialRequestArgs`

### Sub-sistem: `materialrequestresult:result:material` (Klaster #395)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaterialRequestResult`](file://apps/web/src/data/useMaterialRequest.ts#L26-L38) (`apps/web/src/data/useMaterialRequest.ts:26-38`) [Tipe: `interface`]
    - *Signature:* `interface MaterialRequestResult`

### Sub-sistem: `materialstatus:material:status` (Klaster #396)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`materialStatus`](file://apps/web/src/data/useMaterialRequest.ts#L49-L51) (`apps/web/src/data/useMaterialRequest.ts:49-51`) [Tipe: `function`]
    - *Signature:* `(issued: number, shortage: number): MaterialStatus`

### Sub-sistem: `fulfillresult:fulfill:result` (Klaster #397)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FulfillResult`](file://apps/web/src/data/useMaterialRequest.ts#L226-L232) (`apps/web/src/data/useMaterialRequest.ts:226-232`) [Tipe: `interface`]
    - *Signature:* `interface FulfillResult`

### Sub-sistem: `modulesync:module:sync` (Klaster #401)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ModuleSync`](file://apps/web/src/data/useModuleSync.ts#L97-L108) (`apps/web/src/data/useModuleSync.ts:97-108`) [Tipe: `interface`]
    - *Signature:* `interface ModuleSync`

### Sub-sistem: `receivelineargs:args:receive` (Klaster #403)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReceiveLineArgs`](file://apps/web/src/data/usePoActions.ts#L42-L42) (`apps/web/src/data/usePoActions.ts:42-42`) [Tipe: `interface`]
    - *Signature:* `interface ReceiveLineArgs`

### Sub-sistem: `receiveargs:args:receive` (Klaster #404)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReceiveArgs`](file://apps/web/src/data/usePoActions.ts#L43-L43) (`apps/web/src/data/usePoActions.ts:43-43`) [Tipe: `interface`]
    - *Signature:* `interface ReceiveArgs`

### Sub-sistem: `receiveoutcome:outcome:receive` (Klaster #405)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReceiveOutcome`](file://apps/web/src/data/usePoActions.ts#L44-L44) (`apps/web/src/data/usePoActions.ts:44-44`) [Tipe: `interface`]
    - *Signature:* `interface ReceiveOutcome`

### Sub-sistem: `returnargs:args` (Klaster #406)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReturnArgs`](file://apps/web/src/data/usePoActions.ts#L45-L45) (`apps/web/src/data/usePoActions.ts:45-45`) [Tipe: `interface`]
    - *Signature:* `interface ReturnArgs`

### Sub-sistem: `stockissueargs:args:issue` (Klaster #410)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StockIssueArgs`](file://apps/web/src/data/useStockIssue.ts#L10-L17) (`apps/web/src/data/useStockIssue.ts:10-17`) [Tipe: `interface`]
    - *Signature:* `interface StockIssueArgs`

### Sub-sistem: `langctx:lang:status` (Klaster #411)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`LangCtx`](file://apps/web/src/i18n/LanguageContext.tsx#L20-L24) (`apps/web/src/i18n/LanguageContext.tsx:20-24`) [Tipe: `interface`]
    - *Signature:* `interface LangCtx`
    - *Deskripsi:* // Status DATA tidak diterjemahkan nilainya - pakai status.ts (label saja).

### Sub-sistem: `demostep:step:demo` (Klaster #414)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DemoStep`](file://apps/web/src/i18n/n_demo.ts#L5-L9) (`apps/web/src/i18n/n_demo.ts:5-9`) [Tipe: `interface`]
    - *Signature:* `interface DemoStep`

### Sub-sistem: `demoscenario:scenario:demo` (Klaster #415)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DemoScenario`](file://apps/web/src/i18n/n_demo.ts#L11-L17) (`apps/web/src/i18n/n_demo.ts:11-17`) [Tipe: `interface`]
    - *Signature:* `interface DemoScenario`

### Sub-sistem: `dict` (Klaster #416)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Dict`](file://apps/web/src/i18n/types.ts#L6-L15) (`apps/web/src/i18n/types.ts:6-15`) [Tipe: `interface`]
    - *Signature:* `interface Dict`

### Sub-sistem: `geo` (Klaster #418)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Geo`](file://apps/web/src/security/watermark.tsx#L44-L48) (`apps/web/src/security/watermark.tsx:44-48`) [Tipe: `interface`]
    - *Signature:* `interface Geo`

### Sub-sistem: `scenario` (Klaster #423)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Scenario`](file://apps/web/src/pages/Analytics.tsx#L104-L104) (`apps/web/src/pages/Analytics.tsx:104-104`) [Tipe: `interface`]
    - *Signature:* `interface Scenario`

### Sub-sistem: `loadattentioncategory:attention:category` (Klaster #426)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`loadAttentionCategory`](file://apps/web/src/pages/Dashboard.tsx#L104-L112) (`apps/web/src/pages/Dashboard.tsx:104-112`) [Tipe: `function`]
    - *Signature:* `(): ModuleAlertKey | null`

### Sub-sistem: `branchtarget:target:branch` (Klaster #427)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BranchTarget`](file://apps/web/src/pages/Dashboard.tsx#L217-L217) (`apps/web/src/pages/Dashboard.tsx:217-217`) [Tipe: `interface`]
    - *Signature:* `interface BranchTarget`

### Sub-sistem: `cashjournalargs:journal:cash` (Klaster #430)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CashJournalArgs`](file://apps/web/src/services/autoJournal.ts#L6-L20) (`apps/web/src/services/autoJournal.ts:6-20`) [Tipe: `interface`]
    - *Signature:* `interface CashJournalArgs`

### Sub-sistem: `resolveapibase:base:resolve` (Klaster #440)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`resolveApiBase`](file://apps/web/src/services/http.ts#L88-L92) (`apps/web/src/services/http.ts:88-92`) [Tipe: `function`]
    - *Signature:* `(raw: string | undefined, origin: string | undefined): string`

### Sub-sistem: `okenvelope:envelope:bearer` (Klaster #441)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`OkEnvelope`](file://apps/web/src/services/http.ts#L103-L106) (`apps/web/src/services/http.ts:103-106`) [Tipe: `interface`]
    - *Signature:* `interface OkEnvelope`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.

### Sub-sistem: `failenvelope:fail:envelope` (Klaster #442)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FailEnvelope`](file://apps/web/src/services/http.ts#L108-L112) (`apps/web/src/services/http.ts:108-112`) [Tipe: `interface`]
    - *Signature:* `interface FailEnvelope`
    - *Deskripsi:* // - JWT dikirim sebagai `Authorization: Bearer <token>` bila ada.

### Sub-sistem: `apifetchinit:init:fetch` (Klaster #444)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ApiFetchInit`](file://apps/web/src/services/http.ts#L174-L182) (`apps/web/src/services/http.ts:174-182`) [Tipe: `interface`]
    - *Signature:* `interface ApiFetchInit`

### Sub-sistem: `newid:new` (Klaster #445)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`newId`](file://apps/web/src/services/ids.ts#L4-L10) (`apps/web/src/services/ids.ts:4-10`) [Tipe: `function`]
    - *Signature:* `(prefix = "X"): string`

### Sub-sistem: `pdfrenderresult:result:render` (Klaster #446)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PdfRenderResult`](file://apps/web/src/services/pdfClient.ts#L43-L54) (`apps/web/src/services/pdfClient.ts:43-54`) [Tipe: `interface`]
    - *Signature:* `interface PdfRenderResult`

### Sub-sistem: `pdfrequest:request:pdf` (Klaster #448)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PdfRequest`](file://apps/web/src/services/pdfClient.ts#L77-L90) (`apps/web/src/services/pdfClient.ts:77-90`) [Tipe: `interface`]
    - *Signature:* `interface PdfRequest`

### Sub-sistem: `pdfkinds:kinds:pdf` (Klaster #451)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pdfKinds`](file://apps/web/src/services/pdfClient.ts#L215-L224) (`apps/web/src/services/pdfClient.ts:215-224`) [Tipe: `function`]
    - *Signature:* `(): Promise<string[]>`

### Sub-sistem: `listfilter:list:filter` (Klaster #452)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ListFilter`](file://apps/web/src/services/repositories.ts#L16-L19) (`apps/web/src/services/repositories.ts:16-19`) [Tipe: `interface`]
    - *Signature:* `interface ListFilter`

### Sub-sistem: `pagedquery:paged:query` (Klaster #453)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PagedQuery`](file://apps/web/src/services/repositories.ts#L22-L29) (`apps/web/src/services/repositories.ts:22-29`) [Tipe: `interface`]
    - *Signature:* `interface PagedQuery`

### Sub-sistem: `pagedresult:paged:result` (Klaster #454)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PagedResult`](file://apps/web/src/services/repositories.ts#L31-L37) (`apps/web/src/services/repositories.ts:31-37`) [Tipe: `interface`]
    - *Signature:* `interface PagedResult`

### Sub-sistem: `repository` (Klaster #455)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Repository`](file://apps/web/src/services/repositories.ts#L39-L50) (`apps/web/src/services/repositories.ts:39-50`) [Tipe: `interface`]
    - *Signature:* `interface Repository`

### Sub-sistem: `snapshot` (Klaster #456)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Snapshot`](file://apps/web/src/services/repositories.ts#L52-L55) (`apps/web/src/services/repositories.ts:52-55`) [Tipe: `interface`]
    - *Signature:* `interface Snapshot`

### Sub-sistem: `backendrow:paginasi:limit` (Klaster #457)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BackendRow`](file://apps/web/src/services/repositories.ts#L59-L64) (`apps/web/src/services/repositories.ts:59-64`) [Tipe: `interface`]
    - *Signature:* `interface BackendRow`
    - *Deskripsi:* /** Query paginasi server-side (GET /api/<table>?limit=&offset=). */

### Sub-sistem: `backendpage:paginasi:limit` (Klaster #458)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BackendPage`](file://apps/web/src/services/repositories.ts#L110-L117) (`apps/web/src/services/repositories.ts:110-117`) [Tipe: `interface`]
    - *Signature:* `interface BackendPage`
    - *Deskripsi:* /** Query paginasi server-side (GET /api/<table>?limit=&offset=). */

### Sub-sistem: `alert` (Klaster #463)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Alert`](file://apps/web/src/utils/alerts.ts#L7-L12) (`apps/web/src/utils/alerts.ts:7-12`) [Tipe: `interface`]
    - *Signature:* `interface Alert`

### Sub-sistem: `auditdeleterow:delete:audit` (Klaster #465)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditDeleteRow`](file://apps/web/src/utils/audit.ts#L16-L22) (`apps/web/src/utils/audit.ts:16-22`) [Tipe: `interface`]
    - *Signature:* `interface AuditDeleteRow`

### Sub-sistem: `level:islevel:modulekey` (Klaster #467)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`isLevel`](file://apps/web/src/utils/bannerDismiss.ts#L28-L29) (`apps/web/src/utils/bannerDismiss.ts:28-29`) [Tipe: `function`]
    - *Signature:* `(v: unknown): v is AlertLevel`
    - *Deskripsi:* /** moduleKey -> level yang ditutup di sesi ini. */

### Sub-sistem: `restoreall:restore:all` (Klaster #469)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`restoreAll`](file://apps/web/src/utils/bannerDismiss.ts#L83-L88) (`apps/web/src/utils/bannerDismiss.ts:83-88`) [Tipe: `function`]
    - *Signature:* `(map: DismissMap, moduleKey: string): DismissMap`

### Sub-sistem: `planningsubclass:planning:subclass` (Klaster #471)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PlanningSubclass`](file://apps/web/src/utils/classApprovalBlockers.ts#L7-L12) (`apps/web/src/utils/classApprovalBlockers.ts:7-12`) [Tipe: `interface`]
    - *Signature:* `interface PlanningSubclass`

### Sub-sistem: `stageblocker:blocker:stage` (Klaster #472)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StageBlocker`](file://apps/web/src/utils/classApprovalBlockers.ts#L27-L35) (`apps/web/src/utils/classApprovalBlockers.ts:27-35`) [Tipe: `interface`]
    - *Signature:* `interface StageBlocker`

### Sub-sistem: `transitionblockerdata:blocker:transition` (Klaster #473)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TransitionBlockerData`](file://apps/web/src/utils/classApprovalBlockers.ts#L37-L43) (`apps/web/src/utils/classApprovalBlockers.ts:37-43`) [Tipe: `interface`]
    - *Signature:* `interface TransitionBlockerData`

### Sub-sistem: `deadreason:reason:dead` (Klaster #475)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DeadReason`](file://apps/web/src/utils/deadStock.ts#L25-L36) (`apps/web/src/utils/deadStock.ts:25-36`) [Tipe: `interface`]
    - *Signature:* `interface DeadReason`

### Sub-sistem: `deadstockrow:dead:stock` (Klaster #477)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DeadStockRow`](file://apps/web/src/utils/deadStock.ts#L187-L195) (`apps/web/src/utils/deadStock.ts:187-195`) [Tipe: `interface`]
    - *Signature:* `interface DeadStockRow`

### Sub-sistem: `attachment` (Klaster #479)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Attachment`](file://apps/web/src/utils/docAttachment.ts#L39-L44) (`apps/web/src/utils/docAttachment.ts:39-44`) [Tipe: `interface`]
    - *Signature:* `interface Attachment`

### Sub-sistem: `dayoffsets:offsets:day` (Klaster #482)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DayOffsets`](file://apps/web/src/utils/drydockBookingDates.ts#L3-L6) (`apps/web/src/utils/drydockBookingDates.ts:3-6`) [Tipe: `interface`]
    - *Signature:* `interface DayOffsets`

### Sub-sistem: `slotdatefields:fields:slot` (Klaster #483)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SlotDateFields`](file://apps/web/src/utils/drydockBookingDates.ts#L8-L13) (`apps/web/src/utils/drydockBookingDates.ts:8-13`) [Tipe: `interface`]
    - *Signature:* `interface SlotDateFields`

### Sub-sistem: `bookingdatevalues:values:booking` (Klaster #484)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BookingDateValues`](file://apps/web/src/utils/drydockBookingDates.ts#L40-L43) (`apps/web/src/utils/drydockBookingDates.ts:40-43`) [Tipe: `interface`]
    - *Signature:* `interface BookingDateValues`

### Sub-sistem: `bookingdateedits:edits:booking` (Klaster #485)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BookingDateEdits`](file://apps/web/src/utils/drydockBookingDates.ts#L45-L48) (`apps/web/src/utils/drydockBookingDates.ts:45-48`) [Tipe: `interface`]
    - *Signature:* `interface BookingDateEdits`

### Sub-sistem: `employeeoptionextra:extra:option` (Klaster #486)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EmployeeOptionExtra`](file://apps/web/src/utils/employeeOptions.ts#L30-L33) (`apps/web/src/utils/employeeOptions.ts:30-33`) [Tipe: `interface`]
    - *Signature:* `interface EmployeeOptionExtra`

### Sub-sistem: `equipmentnotificationtarget:notification:target` (Klaster #487)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EquipmentNotificationTarget`](file://apps/web/src/utils/equipmentNotifications.ts#L1-L4) (`apps/web/src/utils/equipmentNotifications.ts:1-4`) [Tipe: `interface`]
    - *Signature:* `interface EquipmentNotificationTarget`

### Sub-sistem: `excelsheet:sheet:excel` (Klaster #488)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ExcelSheet`](file://apps/web/src/utils/export.ts#L41-L46) (`apps/web/src/utils/export.ts:41-46`) [Tipe: `interface`]
    - *Signature:* `interface ExcelSheet`

### Sub-sistem: `nowiso:now:iso` (Klaster #493)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`nowIso`](file://apps/web/src/utils/format.ts#L117-L119) (`apps/web/src/utils/format.ts:117-119`) [Tipe: `function`]
    - *Signature:* `(): string`

### Sub-sistem: `warntone:warn:tone` (Klaster #494)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WarnTone`](file://apps/web/src/utils/inventoryWarn.ts#L31-L39) (`apps/web/src/utils/inventoryWarn.ts:31-39`) [Tipe: `interface`]
    - *Signature:* `interface WarnTone`

### Sub-sistem: `categoryrule:rule:category` (Klaster #495)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CategoryRule`](file://apps/web/src/utils/inventoryWarn.ts#L52-L59) (`apps/web/src/utils/inventoryWarn.ts:52-59`) [Tipe: `interface`]
    - *Signature:* `interface CategoryRule`

### Sub-sistem: `categorywarningsummary:warning:summary` (Klaster #499)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CategoryWarningSummary`](file://apps/web/src/utils/inventoryWarn.ts#L191-L202) (`apps/web/src/utils/inventoryWarn.ts:191-202`) [Tipe: `interface`]
    - *Signature:* `interface CategoryWarningSummary`

### Sub-sistem: `finditempage:find:page` (Klaster #501)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`findItemPage`](file://apps/web/src/utils/listPersistence.ts#L15-L24) (`apps/web/src/utils/listPersistence.ts:15-24`) [Tipe: `function`]
    - *Signature:* `(
  items: T[],
  itemId: string | number,
  pageSize: number,
): number | null`

### Sub-sistem: `reconcileresult:reconcile:result` (Klaster #503)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReconcileResult`](file://apps/web/src/utils/listPersistence.ts#L66-L73) (`apps/web/src/utils/listPersistence.ts:66-73`) [Tipe: `interface`]
    - *Signature:* `interface ReconcileResult`

### Sub-sistem: `preservescroll:preserve:scroll` (Klaster #504)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`preserveScroll`](file://apps/web/src/utils/listPersistence.ts#L133-L147) (`apps/web/src/utils/listPersistence.ts:133-147`) [Tipe: `function`]
    - *Signature:* `(action: () => Promise<R> | R): Promise<R>`

### Sub-sistem: `mainthistoryentry:entry:maint` (Klaster #507)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaintHistoryEntry`](file://apps/web/src/utils/maintenance.ts#L56-L62) (`apps/web/src/utils/maintenance.ts:56-62`) [Tipe: `interface`]
    - *Signature:* `interface MaintHistoryEntry`

### Sub-sistem: `maintmaterial:maint:material` (Klaster #508)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaintMaterial`](file://apps/web/src/utils/maintenance.ts#L82-L90) (`apps/web/src/utils/maintenance.ts:82-90`) [Tipe: `interface`]
    - *Signature:* `interface MaintMaterial`

### Sub-sistem: `maintcostbreakdown:breakdown:maint` (Klaster #510)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaintCostBreakdown`](file://apps/web/src/utils/maintenance.ts#L130-L138) (`apps/web/src/utils/maintenance.ts:130-138`) [Tipe: `interface`]
    - *Signature:* `interface MaintCostBreakdown`

### Sub-sistem: `stockplanitem:plan:stock` (Klaster #512)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StockPlanItem`](file://apps/web/src/utils/maintenance.ts#L174-L183) (`apps/web/src/utils/maintenance.ts:174-183`) [Tipe: `interface`]
    - *Signature:* `interface StockPlanItem`

### Sub-sistem: `modulealertitem:module:alert` (Klaster #514)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ModuleAlertItem`](file://apps/web/src/utils/moduleAlerts.ts#L44-L63) (`apps/web/src/utils/moduleAlerts.ts:44-63`) [Tipe: `interface`]
    - *Signature:* `interface ModuleAlertItem`

### Sub-sistem: `monthpoint:point:month` (Klaster #520)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MonthPoint`](file://apps/web/src/utils/monthAxis.ts#L62-L78) (`apps/web/src/utils/monthAxis.ts:62-78`) [Tipe: `interface`]
    - *Signature:* `interface MonthPoint`

### Sub-sistem: `monthaxisoptions:axis:options` (Klaster #521)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MonthAxisOptions`](file://apps/web/src/utils/monthAxis.ts#L80-L91) (`apps/web/src/utils/monthAxis.ts:80-91`) [Tipe: `interface`]
    - *Signature:* `interface MonthAxisOptions`

### Sub-sistem: `overtimerules:rules:overtime` (Klaster #524)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`OvertimeRules`](file://apps/web/src/utils/overtime.ts#L3-L3) (`apps/web/src/utils/overtime.ts:3-3`) [Tipe: `interface`]
    - *Signature:* `interface OvertimeRules`

### Sub-sistem: `boqprintitem:print:boq` (Klaster #527)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoqPrintItem`](file://apps/web/src/utils/printBoqHtml.ts#L4-L13) (`apps/web/src/utils/printBoqHtml.ts:4-13`) [Tipe: `interface`]
    - *Signature:* `interface BoqPrintItem`

### Sub-sistem: `boqprintdata:print:boq` (Klaster #528)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoqPrintData`](file://apps/web/src/utils/printBoqHtml.ts#L15-L30) (`apps/web/src/utils/printBoqHtml.ts:15-30`) [Tipe: `interface`]
    - *Signature:* `interface BoqPrintData`

### Sub-sistem: `bookingcostrow:booking:cost` (Klaster #533)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BookingCostRow`](file://apps/web/src/utils/projectCost.ts#L70-L80) (`apps/web/src/utils/projectCost.ts:70-80`) [Tipe: `interface`]
    - *Signature:* `interface BookingCostRow`

### Sub-sistem: `maintcostrow:maint:cost` (Klaster #534)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaintCostRow`](file://apps/web/src/utils/projectCost.ts#L123-L141) (`apps/web/src/utils/projectCost.ts:123-141`) [Tipe: `interface`]
    - *Signature:* `interface MaintCostRow`

### Sub-sistem: `equipmentcostsummary:summary:equipment` (Klaster #535)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EquipmentCostSummary`](file://apps/web/src/utils/projectCost.ts#L183-L198) (`apps/web/src/utils/projectCost.ts:183-198`) [Tipe: `interface`]
    - *Signature:* `interface EquipmentCostSummary`

### Sub-sistem: `projectcostpatch:cost:patch` (Klaster #537)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`projectCostPatch`](file://apps/web/src/utils/projectCost.ts#L256-L265) (`apps/web/src/utils/projectCost.ts:256-265`) [Tipe: `function`]
    - *Signature:* `(sum: EquipmentCostSummary): Record<string, number>`

### Sub-sistem: `delaywbsitem:delay:wbs` (Klaster #539)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DelayWbsItem`](file://apps/web/src/utils/projectDelay.ts#L35-L40) (`apps/web/src/utils/projectDelay.ts:35-40`) [Tipe: `interface`]
    - *Signature:* `interface DelayWbsItem`

### Sub-sistem: `projectdelaydetails:details:delay` (Klaster #540)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProjectDelayDetails`](file://apps/web/src/utils/projectDelay.ts#L42-L49) (`apps/web/src/utils/projectDelay.ts:42-49`) [Tipe: `interface`]
    - *Signature:* `interface ProjectDelayDetails`

### Sub-sistem: `target:statusoverridelike:penundaan` (Klaster #541)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StatusOverrideLike`](file://apps/web/src/utils/projectDelay.ts#L97-L102) (`apps/web/src/utils/projectDelay.ts:97-102`) [Tipe: `interface`]
    - *Signature:* `interface StatusOverrideLike`
    - *Deskripsi:* /** Sumber bersama detail penundaan: target proyek, hari lewat target, dan WBS penyebab. */

### Sub-sistem: `calcprogressoptions:calc:progress` (Klaster #542)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CalcProgressOptions`](file://apps/web/src/utils/projectProgress.ts#L5-L8) (`apps/web/src/utils/projectProgress.ts:5-8`) [Tipe: `interface`]
    - *Signature:* `interface CalcProgressOptions`

### Sub-sistem: `marketrate:market:rate` (Klaster #545)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MarketRate`](file://apps/web/src/utils/rates.ts#L15-L24) (`apps/web/src/utils/rates.ts:15-24`) [Tipe: `interface`]
    - *Signature:* `interface MarketRate`

### Sub-sistem: `fuelpriceperliter:fuel:liter` (Klaster #547)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`fuelPricePerLiter`](file://apps/web/src/utils/rates.ts#L110-L112) (`apps/web/src/utils/rates.ts:110-112`) [Tipe: `function`]
    - *Signature:* `(): number`

### Sub-sistem: `riskdraft:risk:draft` (Klaster #548)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RiskDraft`](file://apps/web/src/utils/riskAuto.ts#L24-L33) (`apps/web/src/utils/riskAuto.ts:24-33`) [Tipe: `interface`]
    - *Signature:* `interface RiskDraft`

### Sub-sistem: `riskautoresult:risk:auto` (Klaster #549)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RiskAutoResult`](file://apps/web/src/utils/riskAuto.ts#L35-L40) (`apps/web/src/utils/riskAuto.ts:35-40`) [Tipe: `interface`]
    - *Signature:* `interface RiskAutoResult`

### Sub-sistem: `task:wbs:wbstasklike` (Klaster #552)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsTaskLike`](file://apps/web/src/utils/riskAuto.ts#L100-L106) (`apps/web/src/utils/riskAuto.ts:100-106`) [Tipe: `interface`]
    - *Signature:* `interface WbsTaskLike`
    - *Deskripsi:* /** Task WBS — hanya butuh task, progress, weight, start, end. */

### Sub-sistem: `sbinvoiceinput:invoice:input` (Klaster #554)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SbInvoiceInput`](file://apps/web/src/utils/sb.ts#L22-L30) (`apps/web/src/utils/sb.ts:22-30`) [Tipe: `interface`]
    - *Signature:* `interface SbInvoiceInput`

### Sub-sistem: `sbinvoicemath:math:invoice` (Klaster #555)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SbInvoiceMath`](file://apps/web/src/utils/sb.ts#L32-L42) (`apps/web/src/utils/sb.ts:32-42`) [Tipe: `interface`]
    - *Signature:* `interface SbInvoiceMath`

### Sub-sistem: `scopeitem:scope:item` (Klaster #556)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ScopeItem`](file://apps/web/src/utils/scope.ts#L3-L7) (`apps/web/src/utils/scope.ts:3-7`) [Tipe: `interface`]
    - *Signature:* `interface ScopeItem`

### Sub-sistem: `scitem:item` (Klaster #558)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ScItem`](file://apps/web/src/utils/scoring.ts#L3-L3) (`apps/web/src/utils/scoring.ts:3-3`) [Tipe: `interface`]
    - *Signature:* `interface ScItem`

### Sub-sistem: `sctemplate:template` (Klaster #559)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ScTemplate`](file://apps/web/src/utils/scoring.ts#L4-L4) (`apps/web/src/utils/scoring.ts:4-4`) [Tipe: `interface`]
    - *Signature:* `interface ScTemplate`

### Sub-sistem: `monthseriesrow:series:month` (Klaster #561)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MonthSeriesRow`](file://apps/web/src/utils/series.ts#L22-L26) (`apps/web/src/utils/series.ts:22-26`) [Tipe: `interface`]
    - *Signature:* `interface MonthSeriesRow`

### Sub-sistem: `settinglabel:setting:label` (Klaster #563)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`settingLabel`](file://apps/web/src/utils/settings.ts#L12-L14) (`apps/web/src/utils/settings.ts:12-14`) [Tipe: `function`]
    - *Signature:* `(data: StoreShape, key: string): string`

### Sub-sistem: `stockstate:state:stock` (Klaster #564)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StockState`](file://apps/web/src/utils/stockIssue.ts#L12-L12) (`apps/web/src/utils/stockIssue.ts:12-12`) [Tipe: `interface`]
    - *Signature:* `interface StockState`

### Sub-sistem: `terminpart:part:termin` (Klaster #568)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TerminPart`](file://apps/web/src/utils/termin.ts#L7-L13) (`apps/web/src/utils/termin.ts:7-13`) [Tipe: `interface`]
    - *Signature:* `interface TerminPart`

### Sub-sistem: `terminscheme:scheme:termin` (Klaster #569)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TerminScheme`](file://apps/web/src/utils/termin.ts#L15-L18) (`apps/web/src/utils/termin.ts:15-18`) [Tipe: `interface`]
    - *Signature:* `interface TerminScheme`

### Sub-sistem: `terminline:termin:line` (Klaster #570)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TerminLine`](file://apps/web/src/utils/termin.ts#L20-L20) (`apps/web/src/utils/termin.ts:20-20`) [Tipe: `interface`]
    - *Signature:* `interface TerminLine`

### Sub-sistem: `unitconversiondimensions:dimensions:unit` (Klaster #577)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UnitConversionDimensions`](file://apps/web/src/utils/unitConversion.ts#L3-L8) (`apps/web/src/utils/unitConversion.ts:3-8`) [Tipe: `interface`]
    - *Signature:* `interface UnitConversionDimensions`

### Sub-sistem: `unitconversion:unit:conversion` (Klaster #578)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UnitConversion`](file://apps/web/src/utils/unitConversion.ts#L11-L15) (`apps/web/src/utils/unitConversion.ts:11-15`) [Tipe: `interface`]
    - *Signature:* `interface UnitConversion`

### Sub-sistem: `unitconversiondraft:draft:unit` (Klaster #579)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UnitConversionDraft`](file://apps/web/src/utils/unitConversion.ts#L17-L24) (`apps/web/src/utils/unitConversion.ts:17-24`) [Tipe: `interface`]
    - *Signature:* `interface UnitConversionDraft`

### Sub-sistem: `unitconversionrule:rule:unit` (Klaster #580)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UnitConversionRule`](file://apps/web/src/utils/unitConversion.ts#L26-L29) (`apps/web/src/utils/unitConversion.ts:26-29`) [Tipe: `interface`]
    - *Signature:* `interface UnitConversionRule`

### Sub-sistem: `existingunitconversionstate:existing:unit` (Klaster #584)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ExistingUnitConversionState`](file://apps/web/src/utils/unitConversion.ts#L123-L130) (`apps/web/src/utils/unitConversion.ts:123-130`) [Tipe: `interface`]
    - *Signature:* `interface ExistingUnitConversionState`

### Sub-sistem: `urlparamcodec:codec:param` (Klaster #587)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UrlParamCodec`](file://apps/web/src/utils/urlParam.ts#L20-L25) (`apps/web/src/utils/urlParam.ts:20-25`) [Tipe: `interface`]
    - *Signature:* `interface UrlParamCodec`

### Sub-sistem: `warehouse` (Klaster #589)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Warehouse`](file://apps/web/src/utils/warehouse.ts#L20-L31) (`apps/web/src/utils/warehouse.ts:20-31`) [Tipe: `interface`]
    - *Signature:* `interface Warehouse`

### Sub-sistem: `warehousestock:warehouse:stock` (Klaster #593)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WarehouseStock`](file://apps/web/src/utils/warehouse.ts#L139-L151) (`apps/web/src/utils/warehouse.ts:139-151`) [Tipe: `interface`]
    - *Signature:* `interface WarehouseStock`

### Sub-sistem: `movementwarehouseflow:movement:warehouse` (Klaster #594)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MovementWarehouseFlow`](file://apps/web/src/utils/warehouse.ts#L182-L191) (`apps/web/src/utils/warehouse.ts:182-191`) [Tipe: `interface`]
    - *Signature:* `interface MovementWarehouseFlow`

### Sub-sistem: `womilestone:milestone` (Klaster #596)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WoMilestone`](file://apps/web/src/utils/woMilestones.ts#L21-L27) (`apps/web/src/utils/woMilestones.ts:21-27`) [Tipe: `interface`]
    - *Signature:* `interface WoMilestone`

### Sub-sistem: `pdf` (Klaster #599)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pdf`](file://services/api/src/__tests__/files.test.ts#L13-L13) (`services/api/src/__tests__/files.test.ts:13-13`) [Tipe: `function`]
    - *Signature:* `(body: string): Buffer`

### Sub-sistem: `pdf` (Klaster #600)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pdf`](file://services/api/src/__tests__/pure.test.ts#L24-L24) (`services/api/src/__tests__/pure.test.ts:24-24`) [Tipe: `function`]
    - *Signature:* `(body: string): Buffer`

### Sub-sistem: `ctx` (Klaster #601)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Ctx`](file://services/api/src/pdf/blocks.ts#L31-L43) (`services/api/src/pdf/blocks.ts:31-43`) [Tipe: `interface`]
    - *Signature:* `interface Ctx`

### Sub-sistem: `drawrecord:draw:record` (Klaster #602)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DrawRecord`](file://services/api/src/pdf/blocks.ts#L46-L58) (`services/api/src/pdf/blocks.ts:46-58`) [Tipe: `interface`]
    - *Signature:* `interface DrawRecord`

### Sub-sistem: `textopts:opts:text` (Klaster #603)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TextOpts`](file://services/api/src/pdf/blocks.ts#L60-L68) (`services/api/src/pdf/blocks.ts:60-68`) [Tipe: `interface`]
    - *Signature:* `interface TextOpts`

### Sub-sistem: `segment` (Klaster #605)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Segment`](file://services/api/src/pdf/blocks.ts#L156-L160) (`services/api/src/pdf/blocks.ts:156-160`) [Tipe: `interface`]
    - *Signature:* `interface Segment`

### Sub-sistem: `blockplan:block:plan` (Klaster #606)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BlockPlan`](file://services/api/src/pdf/blocks.ts#L162-L169) (`services/api/src/pdf/blocks.ts:162-169`) [Tipe: `interface`]
    - *Signature:* `interface BlockPlan`

### Sub-sistem: `block` (Klaster #607)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Block`](file://services/api/src/pdf/blocks.ts#L171-L180) (`services/api/src/pdf/blocks.ts:171-180`) [Tipe: `interface`]
    - *Signature:* `interface Block`

### Sub-sistem: `kopspec:kop:spec` (Klaster #608)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KopSpec`](file://services/api/src/pdf/blocks.ts#L186-L193) (`services/api/src/pdf/blocks.ts:186-193`) [Tipe: `interface`]
    - *Signature:* `interface KopSpec`

### Sub-sistem: `paragraphspec:paragraph:spec` (Klaster #609)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ParagraphSpec`](file://services/api/src/pdf/blocks.ts#L327-L336) (`services/api/src/pdf/blocks.ts:327-336`) [Tipe: `interface`]
    - *Signature:* `interface ParagraphSpec`

### Sub-sistem: `kvspec:spec` (Klaster #610)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KvSpec`](file://services/api/src/pdf/blocks.ts#L373-L380) (`services/api/src/pdf/blocks.ts:373-380`) [Tipe: `interface`]
    - *Signature:* `interface KvSpec`

### Sub-sistem: `tablespec:table:spec` (Klaster #611)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TableSpec`](file://services/api/src/pdf/blocks.ts#L440-L456) (`services/api/src/pdf/blocks.ts:440-456`) [Tipe: `interface`]
    - *Signature:* `interface TableSpec`

### Sub-sistem: `laidcell:laid:dijamin` (Klaster #612)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`LaidCell`](file://services/api/src/pdf/blocks.ts#L475-L478) (`services/api/src/pdf/blocks.ts:475-478`) [Tipe: `interface`]
    - *Signature:* `interface LaidCell`
    - *Deskripsi:* /** Lebar efektif tiap kolom; dijamin >= MIN_COL_MM. */

### Sub-sistem: `laidrow:laid:dijamin` (Klaster #613)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`LaidRow`](file://services/api/src/pdf/blocks.ts#L480-L484) (`services/api/src/pdf/blocks.ts:480-484`) [Tipe: `interface`]
    - *Signature:* `interface LaidRow`
    - *Deskripsi:* /** Lebar efektif tiap kolom; dijamin >= MIN_COL_MM. */

### Sub-sistem: `signaturespec:signature:spec` (Klaster #614)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SignatureSpec`](file://services/api/src/pdf/blocks.ts#L736-L741) (`services/api/src/pdf/blocks.ts:736-741`) [Tipe: `interface`]
    - *Signature:* `interface SignatureSpec`

### Sub-sistem: `imagespec:image:spec` (Klaster #615)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ImageSpec`](file://services/api/src/pdf/blocks.ts#L798-L806) (`services/api/src/pdf/blocks.ts:798-806`) [Tipe: `interface`]
    - *Signature:* `interface ImageSpec`

### Sub-sistem: `chartctx:chart:ctx` (Klaster #616)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ChartCtx`](file://services/api/src/pdf/chart.ts#L23-L31) (`services/api/src/pdf/chart.ts:23-31`) [Tipe: `interface`]
    - *Signature:* `interface ChartCtx`

### Sub-sistem: `series` (Klaster #617)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Series`](file://services/api/src/pdf/chart.ts#L33-L37) (`services/api/src/pdf/chart.ts:33-37`) [Tipe: `interface`]
    - *Signature:* `interface Series`

### Sub-sistem: `axes:sumbu:secara` (Klaster #619)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Axes`](file://services/api/src/pdf/chart.ts#L187-L194) (`services/api/src/pdf/chart.ts:187-194`) [Tipe: `interface`]
    - *Signature:* `interface Axes`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `categoryseries:series:sumbu` (Klaster #620)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CategorySeries`](file://services/api/src/pdf/chart.ts#L196-L200) (`services/api/src/pdf/chart.ts:196-200`) [Tipe: `interface`]
    - *Signature:* `interface CategorySeries`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `stackedspec:stacked:sumbu` (Klaster #621)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StackedSpec`](file://services/api/src/pdf/chart.ts#L202-L204) (`services/api/src/pdf/chart.ts:202-204`) [Tipe: `interface`]
    - *Signature:* `interface StackedSpec`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `linespec:sumbu:secara` (Klaster #622)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`LineSpec`](file://services/api/src/pdf/chart.ts#L206-L211) (`services/api/src/pdf/chart.ts:206-211`) [Tipe: `interface`]
    - *Signature:* `interface LineSpec`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `donutspec:donut:sumbu` (Klaster #623)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DonutSpec`](file://services/api/src/pdf/chart.ts#L213-L219) (`services/api/src/pdf/chart.ts:213-219`) [Tipe: `interface`]
    - *Signature:* `interface DonutSpec`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `hbarspec:hbar:sumbu` (Klaster #624)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`HbarSpec`](file://services/api/src/pdf/chart.ts#L221-L226) (`services/api/src/pdf/chart.ts:221-226`) [Tipe: `interface`]
    - *Signature:* `interface HbarSpec`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `paretospec:pareto:sumbu` (Klaster #625)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ParetoSpec`](file://services/api/src/pdf/chart.ts#L228-L233) (`services/api/src/pdf/chart.ts:228-233`) [Tipe: `interface`]
    - *Signature:* `interface ParetoSpec`
    - *Deskripsi:* /** Label sumbu X; secara otomatis diskip agar tidak bertumpuk. */

### Sub-sistem: `docoptions:options:doc` (Klaster #627)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DocOptions`](file://services/api/src/pdf/document.ts#L25-L41) (`services/api/src/pdf/document.ts:25-41`) [Tipe: `interface`]
    - *Signature:* `interface DocOptions`

### Sub-sistem: `renderresult:result:render` (Klaster #628)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RenderResult`](file://services/api/src/pdf/document.ts#L43-L60) (`services/api/src/pdf/document.ts:43-60`) [Tipe: `interface`]
    - *Signature:* `interface RenderResult`

### Sub-sistem: `doc` (Klaster #630)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`doc`](file://services/api/src/pdf/document.ts#L273-L275) (`services/api/src/pdf/document.ts:273-275`) [Tipe: `function`]
    - *Signature:* `(opts: DocOptions = {}): Document`

### Sub-sistem: `geometryproblem:problem:geometry` (Klaster #631)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`GeometryProblem`](file://services/api/src/pdf/document.ts#L286-L294) (`services/api/src/pdf/document.ts:286-294`) [Tipe: `interface`]
    - *Signature:* `interface GeometryProblem`

### Sub-sistem: `fontspec:font:spec` (Klaster #632)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FontSpec`](file://services/api/src/pdf/font.ts#L27-L32) (`services/api/src/pdf/font.ts:27-32`) [Tipe: `interface`]
    - *Signature:* `interface FontSpec`

### Sub-sistem: `metrics` (Klaster #634)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Metrics`](file://services/api/src/pdf/measure.ts#L44-L49) (`services/api/src/pdf/measure.ts:44-49`) [Tipe: `interface`]
    - *Signature:* `interface Metrics`

### Sub-sistem: `lineheight:height:line` (Klaster #636)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`lineHeight`](file://services/api/src/pdf/measure.ts#L151-L153) (`services/api/src/pdf/measure.ts:151-153`) [Tipe: `function`]
    - *Signature:* `(size: number): number`

### Sub-sistem: `rendercontext:context:render` (Klaster #637)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RenderContext`](file://services/api/src/pdf/registry.ts#L85-L92) (`services/api/src/pdf/registry.ts:85-92`) [Tipe: `interface`]
    - *Signature:* `interface RenderContext`

### Sub-sistem: `recipe` (Klaster #638)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Recipe`](file://services/api/src/pdf/registry.ts#L95-L110) (`services/api/src/pdf/registry.ts:95-110`) [Tipe: `interface`]
    - *Signature:* `interface Recipe`

### Sub-sistem: `recipeview:recipe:view` (Klaster #643)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RecipeView`](file://services/api/src/pdf/registry.ts#L1346-L1354) (`services/api/src/pdf/registry.ts:1346-1354`) [Tipe: `interface`]
    - *Signature:* `interface RecipeView`

### Sub-sistem: `tipe:view:unknown` (Klaster #644)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`view`](file://services/api/src/pdf/registry.ts#L1356-L1358) (`services/api/src/pdf/registry.ts:1356-1358`) [Tipe: `function`]
    - *Signature:* `(r: Recipe<T>): RecipeView`
    - *Deskripsi:* /**
 * Tampilan recipe tanpa parameter tipe - yang dilihat route.
 *
 * Tiap recipe tetap diketik penuh di atas (factory-nya Receive input
 * konkret, bukan `unknown`). Erasure dilakukan tepat satu kali di `view()`:
 * route memang tidak bisa memeriksa tipe model dari snapshot JSON, dan
 * memaksakan `unknown` ke setiap factory akan membuang tipe yang baru saja
 * diketik di atas.
 */

### Sub-sistem: `rendermodelrow:model:render` (Klaster #646)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RenderModelRow`](file://services/api/src/pdf/renderStore.ts#L22-L36) (`services/api/src/pdf/renderStore.ts:22-36`) [Tipe: `interface`]
    - *Signature:* `interface RenderModelRow`

### Sub-sistem: `rendermodelinput:model:render` (Klaster #647)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RenderModelInput`](file://services/api/src/pdf/renderStore.ts#L38-L49) (`services/api/src/pdf/renderStore.ts:38-49`) [Tipe: `interface`]
    - *Signature:* `interface RenderModelInput`

### Sub-sistem: `snapshot:rawrow:best` (Klaster #648)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RawRow`](file://services/api/src/pdf/renderStore.ts#L113-L127) (`services/api/src/pdf/renderStore.ts:113-127`) [Tipe: `interface`]
    - *Signature:* `interface RawRow`
    - *Deskripsi:* /**
 * Simpan snapshot. Best-effort: kegagalan menulis snapshot tidak boleh
 * membatalkan cetakan yang sedang diminta - pengguna sudah menekan tombol,
 * dan dokumennya tetap sah karena dirakit dari DB, bukan dari model.
 */

### Sub-sistem: `listrenderhistory:history:list` (Klaster #649)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`listRenderHistory`](file://services/api/src/pdf/renderStore.ts#L163-L183) (`services/api/src/pdf/renderStore.ts:163-183`) [Tipe: `function`]
    - *Signature:* `(kind: string, entityId: string, limit = 20): Promise<RenderModelRow[]>`

### Sub-sistem: `stamp` (Klaster #651)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`stamp`](file://services/api/src/pdf/reports.ts#L81-L83) (`services/api/src/pdf/reports.ts:81-83`) [Tipe: `function`]
    - *Signature:* `(iso: string): string`

### Sub-sistem: `monthpoint:point:month` (Klaster #652)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MonthPoint`](file://services/api/src/pdf/reports.ts#L129-L140) (`services/api/src/pdf/reports.ts:129-140`) [Tipe: `interface`]
    - *Signature:* `interface MonthPoint`

### Sub-sistem: `collections` (Klaster #653)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Collections`](file://services/api/src/pdf/reports.ts#L142-L169) (`services/api/src/pdf/reports.ts:142-169`) [Tipe: `interface`]
    - *Signature:* `interface Collections`

### Sub-sistem: `portfoliokpi:portfolio:kpi` (Klaster #654)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PortfolioKpi`](file://services/api/src/pdf/reports.ts#L195-L214) (`services/api/src/pdf/reports.ts:195-214`) [Tipe: `interface`]
    - *Signature:* `interface PortfolioKpi`

### Sub-sistem: `periodcash:period:cash` (Klaster #655)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PeriodCash`](file://services/api/src/pdf/reports.ts#L258-L284) (`services/api/src/pdf/reports.ts:258-284`) [Tipe: `interface`]
    - *Signature:* `interface PeriodCash`

### Sub-sistem: `projectreport:report:project` (Klaster #656)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProjectReport`](file://services/api/src/pdf/reports.ts#L324-L353) (`services/api/src/pdf/reports.ts:324-353`) [Tipe: `interface`]
    - *Signature:* `interface ProjectReport`

### Sub-sistem: `equipmentcost:equipment:cost` (Klaster #657)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EquipmentCost`](file://services/api/src/pdf/reports.ts#L399-L404) (`services/api/src/pdf/reports.ts:399-404`) [Tipe: `interface`]
    - *Signature:* `interface EquipmentCost`

### Sub-sistem: `payrollrecap:recap:payroll` (Klaster #658)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PayrollRecap`](file://services/api/src/pdf/reports.ts#L457-L474) (`services/api/src/pdf/reports.ts:457-474`) [Tipe: `interface`]
    - *Signature:* `interface PayrollRecap`

### Sub-sistem: `thrrecap:thr:recap` (Klaster #659)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ThrRecap`](file://services/api/src/pdf/reports.ts#L518-L524) (`services/api/src/pdf/reports.ts:518-524`) [Tipe: `interface`]
    - *Signature:* `interface ThrRecap`

### Sub-sistem: `ncrbucket:bucket:ncr` (Klaster #660)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`NcrBucket`](file://services/api/src/pdf/reports.ts#L558-L565) (`services/api/src/pdf/reports.ts:558-565`) [Tipe: `interface`]
    - *Signature:* `interface NcrBucket`

### Sub-sistem: `profitrow:profit:row` (Klaster #661)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProfitRow`](file://services/api/src/pdf/reports.ts#L585-L591) (`services/api/src/pdf/reports.ts:585-591`) [Tipe: `interface`]
    - *Signature:* `interface ProfitRow`

### Sub-sistem: `pagespec:page:spec` (Klaster #662)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PageSpec`](file://services/api/src/pdf/theme.ts#L13-L17) (`services/api/src/pdf/theme.ts:13-17`) [Tipe: `interface`]
    - *Signature:* `interface PageSpec`

### Sub-sistem: `ingestresult:ingest:result` (Klaster #665)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`IngestResult`](file://services/api/src/routes/attendanceIngest.ts#L47-L47) (`services/api/src/routes/attendanceIngest.ts:47-47`) [Tipe: `interface`]
    - *Signature:* `interface IngestResult`

### Sub-sistem: `auditrow:audit:row` (Klaster #667)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditRow`](file://services/api/src/routes/audit.ts#L7-L16) (`services/api/src/routes/audit.ts:7-16`) [Tipe: `interface`]
    - *Signature:* `interface AuditRow`

### Sub-sistem: `stalewriteerror:stale:antara` (Klaster #669)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StaleWriteError`](file://services/api/src/routes/crud.ts#L35-L35) (`services/api/src/routes/crud.ts:35-35`) [Tipe: `class`]
    - *Signature:* `class StaleWriteError`
    - *Deskripsi:* /** Baris berubah di antara baca dan tulis (F4-01). */

### Sub-sistem: `row:parsial:divalidasi` (Klaster #670)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/routes/crud.ts#L188-L193) (`services/api/src/routes/crud.ts:188-193`) [Tipe: `interface`]
    - *Signature:* `interface Row`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).

### Sub-sistem: `drydockrange:parsial:drydock` (Klaster #672)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DrydockRange`](file://services/api/src/routes/crud.ts#L261-L261) (`services/api/src/routes/crud.ts:261-261`) [Tipe: `interface`]
    - *Signature:* `interface DrydockRange`
    - *Deskripsi:* // PATCH parsial tidak divalidasi isi (sengaja).

### Sub-sistem: `pagecursor:cursor:page` (Klaster #677)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PageCursor`](file://services/api/src/routes/crudCursor.ts#L15-L18) (`services/api/src/routes/crudCursor.ts:15-18`) [Tipe: `interface`]
    - *Signature:* `interface PageCursor`

### Sub-sistem: `userrow:user:row` (Klaster #678)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UserRow`](file://services/api/src/routes/demoSwitch.ts#L33-L42) (`services/api/src/routes/demoSwitch.ts:33-42`) [Tipe: `interface`]
    - *Signature:* `interface UserRow`

### Sub-sistem: `renderbody:body:render` (Klaster #683)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RenderBody`](file://services/api/src/routes/pdf.ts#L25-L35) (`services/api/src/routes/pdf.ts:25-35`) [Tipe: `interface`]
    - *Signature:* `interface RenderBody`

### Sub-sistem: `realdate:satu:real` (Klaster #687)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`realDate`](file://services/api/src/routes/publicLeave.ts#L35-L35) (`services/api/src/routes/publicLeave.ts:35-35`) [Tipe: `function`]
    - *Signature:* `(d: string): boolean`
    - *Deskripsi:* // Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.

### Sub-sistem: `qrrecord:satu:bengkel` (Klaster #690)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`QrRecord`](file://services/api/src/routes/publicLeave.ts#L66-L66) (`services/api/src/routes/publicLeave.ts:66-66`) [Tipe: `interface`]
    - *Signature:* `interface QrRecord`
    - *Deskripsi:* // Pratinjau NIK dipisah dari kuota kirim: satu bengkel biasanya berbagi satu IP.

### Sub-sistem: `wbsphotorow:photo:wbs` (Klaster #692)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsPhotoRow`](file://services/api/src/routes/readModels.ts#L17-L17) (`services/api/src/routes/readModels.ts:17-17`) [Tipe: `interface`]
    - *Signature:* `interface WbsPhotoRow`

### Sub-sistem: `userrow:jalur:lain` (Klaster #694)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`UserRow`](file://services/api/src/routes/users.ts#L21-L31) (`services/api/src/routes/users.ts:21-31`) [Tipe: `interface`]
    - *Signature:* `interface UserRow`
    - *Deskripsi:* // di jalur lain).

### Sub-sistem: `topublic:jalur:lain` (Klaster #695)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`toPublic`](file://services/api/src/routes/users.ts#L33-L51) (`services/api/src/routes/users.ts:33-51`) [Tipe: `function`]
    - *Signature:* `(row: UserRow): {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
  isActive: boolean;
  employeeId: string | null;
}`
    - *Deskripsi:* // di jalur lain).

### Sub-sistem: `siderow:side:row` (Klaster #696)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SideRow`](file://services/api/src/routes/wbs.ts#L19-L22) (`services/api/src/routes/wbs.ts:19-22`) [Tipe: `interface`]
    - *Signature:* `interface SideRow`

### Sub-sistem: `sidewriteoutcome:outcome:side` (Klaster #697)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SideWriteOutcome`](file://services/api/src/routes/wbs.ts#L24-L30) (`services/api/src/routes/wbs.ts:24-30`) [Tipe: `interface`]
    - *Signature:* `interface SideWriteOutcome`

### Sub-sistem: `projectscopeuser:scope:user` (Klaster #698)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProjectScopeUser`](file://services/api/src/routes/wbs.ts#L32-L36) (`services/api/src/routes/wbs.ts:32-36`) [Tipe: `interface`]
    - *Signature:* `interface ProjectScopeUser`

### Sub-sistem: `nodeglobalscope:global:node` (Klaster #700)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`NodeGlobalScope`](file://apps/web/src/components/__tests__/toastAlert.test.ts#L7-L10) (`apps/web/src/components/__tests__/toastAlert.test.ts:7-10`) [Tipe: `interface`]
    - *Signature:* `interface NodeGlobalScope`

### Sub-sistem: `constructor` (Klaster #701)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`constructor`](file://apps/web/src/components/__tests__/toastAlert.test.ts#L19-L22) (`apps/web/src/components/__tests__/toastAlert.test.ts:19-22`) [Tipe: `method`]
    - *Signature:* `(type: string, init?: { detail?: T })`

### Sub-sistem: `toasteventdetail:event:toast` (Klaster #702)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ToastEventDetail`](file://apps/web/src/components/__tests__/toastAlert.test.ts#L26-L33) (`apps/web/src/components/__tests__/toastAlert.test.ts:26-33`) [Tipe: `interface`]
    - *Signature:* `interface ToastEventDetail`

### Sub-sistem: `catatrow:catat:row` (Klaster #703)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CatatRow`](file://apps/web/src/pages/absensi/Absensi.tsx#L51-L56) (`apps/web/src/pages/absensi/Absensi.tsx:51-56`) [Tipe: `interface`]
    - *Signature:* `interface CatatRow`

### Sub-sistem: `punch:dianggap:butuh` (Klaster #705)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Punch`](file://apps/web/src/pages/absensi/DeviceImport.tsx#L12-L12) (`apps/web/src/pages/absensi/DeviceImport.tsx:12-12`) [Tipe: `interface`]
    - *Signature:* `interface Punch`
    - *Deskripsi:* // atau "YYYY-MM-DD HH:MM" yang dianggap WITA). Butuh server.

### Sub-sistem: `qline:line` (Klaster #709)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`QLine`](file://apps/web/src/pages/crm/QuotationDetail.tsx#L28-L32) (`apps/web/src/pages/crm/QuotationDetail.tsx:28-32`) [Tipe: `interface`]
    - *Signature:* `interface QLine`

### Sub-sistem: `serverauditrow:diketahui:selain` (Klaster #712)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ServerAuditRow`](file://apps/web/src/pages/audit/Audit.tsx#L51-L58) (`apps/web/src/pages/audit/Audit.tsx:51-58`) [Tipe: `interface`]
    - *Signature:* `interface ServerAuditRow`
    - *Deskripsi:* /** Tampilan kolom Waktu: tanggal + jam bila waktunya diketahui, selain itu
 *  label relatif lama apa adanya (mis. jejak seed "5 menit lalu"). */

### Sub-sistem: `storeitemlike:diketahui:selain` (Klaster #713)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`StoreItemLike`](file://apps/web/src/pages/audit/Audit.tsx#L60-L69) (`apps/web/src/pages/audit/Audit.tsx:60-69`) [Tipe: `interface`]
    - *Signature:* `interface StoreItemLike`
    - *Deskripsi:* /** Tampilan kolom Waktu: tanggal + jam bila waktunya diketahui, selain itu
 *  label relatif lama apa adanya (mis. jejak seed "5 menit lalu"). */

### Sub-sistem: `boqdetailmodalprops:detail:props` (Klaster #715)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoqDetailModalProps`](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L19-L28) (`apps/web/src/pages/dokumen/BoqDetailModal.tsx:19-28`) [Tipe: `interface`]
    - *Signature:* `interface BoqDetailModalProps`

### Sub-sistem: `maintform:maint:form` (Klaster #722)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaintForm`](file://apps/web/src/pages/equipment/Equipment.tsx#L98-L113) (`apps/web/src/pages/equipment/Equipment.tsx:98-113`) [Tipe: `interface`]
    - *Signature:* `interface MaintForm`

### Sub-sistem: `pscrow:psc:row` (Klaster #725)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PscRow`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L53-L58) (`apps/web/src/pages/kapal/VesselDetail.tsx:53-58`) [Tipe: `interface`]
    - *Signature:* `interface PscRow`

### Sub-sistem: `dockhistoryrow:dock:history` (Klaster #726)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DockHistoryRow`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L60-L66) (`apps/web/src/pages/kapal/VesselDetail.tsx:60-66`) [Tipe: `interface`]
    - *Signature:* `interface DockHistoryRow`

### Sub-sistem: `planrow:plan:row` (Klaster #727)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PlanRow`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L68-L72) (`apps/web/src/pages/kapal/VesselDetail.tsx:68-72`) [Tipe: `interface`]
    - *Signature:* `interface PlanRow`

### Sub-sistem: `bunkerrow:bunker:row` (Klaster #728)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BunkerRow`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L74-L79) (`apps/web/src/pages/kapal/VesselDetail.tsx:74-79`) [Tipe: `interface`]
    - *Signature:* `interface BunkerRow`

### Sub-sistem: `crewrow:crew:row` (Klaster #729)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CrewRow`](file://apps/web/src/pages/kapal/VesselDetail.tsx#L81-L84) (`apps/web/src/pages/kapal/VesselDetail.tsx:81-84`) [Tipe: `interface`]
    - *Signature:* `interface CrewRow`

### Sub-sistem: `diam:compliancerow:compliance` (Klaster #731)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ComplianceRow`](file://apps/web/src/pages/kapal/Vessels.tsx#L43-L47) (`apps/web/src/pages/kapal/Vessels.tsx:43-47`) [Tipe: `interface`]
    - *Signature:* `interface ComplianceRow`
    - *Deskripsi:* /** Kapal lama bisa ber-class lain (ABS, DNV, …): tetap jadi pilihan supaya tidak tertimpa diam-diam. */

### Sub-sistem: `reservation` (Klaster #738)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Reservation`](file://apps/web/src/pages/inventori/Inventory.tsx#L160-L160) (`apps/web/src/pages/inventori/Inventory.tsx:160-160`) [Tipe: `interface`]
    - *Signature:* `interface Reservation`

### Sub-sistem: `batchrow:batch:row` (Klaster #739)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BatchRow`](file://apps/web/src/pages/inventori/Inventory.tsx#L161-L161) (`apps/web/src/pages/inventori/Inventory.tsx:161-161`) [Tipe: `interface`]
    - *Signature:* `interface BatchRow`

### Sub-sistem: `detectedbarcode:detected:barcode` (Klaster #740)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DetectedBarcode`](file://apps/web/src/pages/inventori/Inventory.tsx#L173-L175) (`apps/web/src/pages/inventori/Inventory.tsx:173-175`) [Tipe: `interface`]
    - *Signature:* `interface DetectedBarcode`

### Sub-sistem: `barcodedetectorinstance:detector:barcode` (Klaster #741)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BarcodeDetectorInstance`](file://apps/web/src/pages/inventori/Inventory.tsx#L177-L179) (`apps/web/src/pages/inventori/Inventory.tsx:177-179`) [Tipe: `interface`]
    - *Signature:* `interface BarcodeDetectorInstance`

### Sub-sistem: `histfilter:hist:filter` (Klaster #749)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`HistFilter`](file://apps/web/src/pages/keuangan/Finance.tsx#L87-L87) (`apps/web/src/pages/keuangan/Finance.tsx:87-87`) [Tipe: `interface`]
    - *Signature:* `interface HistFilter`

### Sub-sistem: `muka:uang:invline` (Klaster #753)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`InvLine`](file://apps/web/src/pages/keuangan/Finance.tsx#L324-L332) (`apps/web/src/pages/keuangan/Finance.tsx:324-332`) [Tipe: `interface`]
    - *Signature:* `interface InvLine`
    - *Deskripsi:* /** DP = uang muka: tanpa retensi, dan menandai proyek punya uang muka. */

### Sub-sistem: `allowsum:allow:bruto` (Klaster #754)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`allowSum`](file://apps/web/src/pages/keuangan/Finance.tsx#L353-L357) (`apps/web/src/pages/keuangan/Finance.tsx:353-357`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem): number`
    - *Deskripsi:* // potongan = bruto - net (PPh21 + BPJS karyawan), selalu seimbang.

### Sub-sistem: `emptymodul:modul:empty` (Klaster #763)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EmptyModul`](file://apps/web/src/pages/laporan/Laporan.tsx#L29-L36) (`apps/web/src/pages/laporan/Laporan.tsx:29-36`) [Tipe: `function`]
    - *Signature:* `({ modul, to, label }: { modul: string; to: string; label: string })`

### Sub-sistem: `reporttpl:tpl:report` (Klaster #765)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReportTpl`](file://apps/web/src/pages/laporan/Laporan.tsx#L76-L76) (`apps/web/src/pages/laporan/Laporan.tsx:76-76`) [Tipe: `interface`]
    - *Signature:* `interface ReportTpl`

### Sub-sistem: `reportarc:arc:report` (Klaster #766)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ReportArc`](file://apps/web/src/pages/laporan/Laporan.tsx#L77-L77) (`apps/web/src/pages/laporan/Laporan.tsx:77-77`) [Tipe: `interface`]
    - *Signature:* `interface ReportArc`

### Sub-sistem: `notifitem:notif:item` (Klaster #768)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`NotifItem`](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L16-L27) (`apps/web/src/pages/notifikasi/Notifikasi.tsx:16-27`) [Tipe: `interface`]
    - *Signature:* `interface NotifItem`

### Sub-sistem: `allowanceline:allowance:line` (Klaster #770)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AllowanceLine`](file://apps/web/src/pages/payroll/Payroll.tsx#L101-L104) (`apps/web/src/pages/payroll/Payroll.tsx:101-104`) [Tipe: `interface`]
    - *Signature:* `interface AllowanceLine`

### Sub-sistem: `payrollrates:rates:payroll` (Klaster #771)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PayrollRates`](file://apps/web/src/pages/payroll/Payroll.tsx#L108-L124) (`apps/web/src/pages/payroll/Payroll.tsx:108-124`) [Tipe: `interface`]
    - *Signature:* `interface PayrollRates`

### Sub-sistem: `poline:line` (Klaster #777)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`POLine`](file://apps/web/src/pages/procurement/Procurement.tsx#L48-L48) (`apps/web/src/pages/procurement/Procurement.tsx:48-48`) [Tipe: `interface`]
    - *Signature:* `interface POLine`

### Sub-sistem: `quote` (Klaster #778)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Quote`](file://apps/web/src/pages/procurement/Procurement.tsx#L49-L49) (`apps/web/src/pages/procurement/Procurement.tsx:49-49`) [Tipe: `interface`]
    - *Signature:* `interface Quote`

### Sub-sistem: `approval` (Klaster #779)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Approval`](file://apps/web/src/pages/procurement/Procurement.tsx#L50-L50) (`apps/web/src/pages/procurement/Procurement.tsx:50-50`) [Tipe: `interface`]
    - *Signature:* `interface Approval`

### Sub-sistem: `vendorscore:vendor:score` (Klaster #780)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`VendorScore`](file://apps/web/src/pages/procurement/Procurement.tsx#L51-L51) (`apps/web/src/pages/procurement/Procurement.tsx:51-51`) [Tipe: `interface`]
    - *Signature:* `interface VendorScore`

### Sub-sistem: `manageduser:managed:tanpa` (Klaster #786)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ManagedUser`](file://apps/web/src/pages/pengaturan/Peran.tsx#L227-L235) (`apps/web/src/pages/pengaturan/Peran.tsx:227-235`) [Tipe: `interface`]
    - *Signature:* `interface ManagedUser`
    - *Deskripsi:* /** Matriks RBAC display: sel yang tidak tercantum = tanpa akses. Read-only tanpa backend. */

### Sub-sistem: `sessionrow:tanpa:rbac` (Klaster #787)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SessionRow`](file://apps/web/src/pages/pengaturan/Peran.tsx#L237-L246) (`apps/web/src/pages/pengaturan/Peran.tsx:237-246`) [Tipe: `interface`]
    - *Signature:* `interface SessionRow`
    - *Deskripsi:* /** Matriks RBAC display: sel yang tidak tercantum = tanpa akses. Read-only tanpa backend. */

### Sub-sistem: `tanpa:auditrow:rbac` (Klaster #788)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AuditRow`](file://apps/web/src/pages/pengaturan/Peran.tsx#L248-L253) (`apps/web/src/pages/pengaturan/Peran.tsx:248-253`) [Tipe: `interface`]
    - *Signature:* `interface AuditRow`
    - *Deskripsi:* /** Matriks RBAC display: sel yang tidak tercantum = tanpa akses. Read-only tanpa backend. */

### Sub-sistem: `constinfo:info` (Klaster #791)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ConstInfo`](file://apps/web/src/pages/pengaturan/Settings.tsx#L14-L14) (`apps/web/src/pages/pengaturan/Settings.tsx:14-14`) [Tipe: `interface`]
    - *Signature:* `interface ConstInfo`

### Sub-sistem: `preview:jabatan:departemen` (Klaster #793)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Preview`](file://apps/web/src/pages/publik/CutiQr.tsx#L13-L13) (`apps/web/src/pages/publik/CutiQr.tsx:13-13`) [Tipe: `interface`]
    - *Signature:* `interface Preview`
    - *Deskripsi:* // mengembalikan nama, jabatan, dan departemen untuk verifikasi sebelum kirim.

### Sub-sistem: `pricehist:price:hist` (Klaster #795)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PriceHist`](file://apps/web/src/pages/proyek/BoQSection.tsx#L52-L52) (`apps/web/src/pages/proyek/BoQSection.tsx:52-52`) [Tipe: `interface`]
    - *Signature:* `interface PriceHist`

### Sub-sistem: `props` (Klaster #796)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/proyek/BoQSection.tsx#L114-L122) (`apps/web/src/pages/proyek/BoQSection.tsx:114-122`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `docrow:doc:row` (Klaster #798)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DocRow`](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L30-L44) (`apps/web/src/pages/proyek/BoqDocsSection.tsx:30-44`) [Tipe: `interface`]
    - *Signature:* `interface DocRow`

### Sub-sistem: `attentionitem:attention:item` (Klaster #800)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AttentionItem`](file://apps/web/src/pages/proyek/Monitoring.tsx#L36-L41) (`apps/web/src/pages/proyek/Monitoring.tsx:36-41`) [Tipe: `interface`]
    - *Signature:* `interface AttentionItem`

### Sub-sistem: `feedentry:feed:entry` (Klaster #802)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`FeedEntry`](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L15-L29) (`apps/web/src/pages/proyek/MonitoringFeed.tsx:15-29`) [Tipe: `interface`]
    - *Signature:* `interface FeedEntry`

### Sub-sistem: `props` (Klaster #803)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L31-L36) (`apps/web/src/pages/proyek/MonitoringFeed.tsx:31-36`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `wbsbaseline:baseline:wbs` (Klaster #805)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`WbsBaseline`](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L91-L91) (`apps/web/src/pages/proyek/ProjectDetail.tsx:91-91`) [Tipe: `interface`]
    - *Signature:* `interface WbsBaseline`

### Sub-sistem: `props` (Klaster #809)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/proyek/ReportSection.tsx#L13-L15) (`apps/web/src/pages/proyek/ReportSection.tsx:13-15`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `props` (Klaster #811)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L33-L37) (`apps/web/src/pages/proyek/SparepartServiceSection.tsx:33-37`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `photo:kembali:ditampilkan` (Klaster #813)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Photo`](file://apps/web/src/pages/proyek/WbsTree.tsx#L13-L13) (`apps/web/src/pages/proyek/WbsTree.tsx:13-13`) [Tipe: `interface`]
    - *Signature:* `interface Photo`
    - *Deskripsi:* // kembali dari WBS proyek dan ditampilkan sebagai thumbnail; klik = perbesar.

### Sub-sistem: `edititem:edit:item` (Klaster #815)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EditItem`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L18-L18) (`apps/web/src/pages/qc/ChecklistTab.tsx:18-18`) [Tipe: `interface`]
    - *Signature:* `interface EditItem`

### Sub-sistem: `editsection:section:edit` (Klaster #816)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EditSection`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L19-L19) (`apps/web/src/pages/qc/ChecklistTab.tsx:19-19`) [Tipe: `interface`]
    - *Signature:* `interface EditSection`

### Sub-sistem: `edittemplate:template:edit` (Klaster #817)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EditTemplate`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L20-L20) (`apps/web/src/pages/qc/ChecklistTab.tsx:20-20`) [Tipe: `interface`]
    - *Signature:* `interface EditTemplate`

### Sub-sistem: `uid` (Klaster #818)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`uid`](file://apps/web/src/pages/qc/ChecklistTab.tsx#L22-L22) (`apps/web/src/pages/qc/ChecklistTab.tsx:22-22`) [Tipe: `function`]
    - *Signature:* `()`

### Sub-sistem: `empcert:emp:cert` (Klaster #821)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EmpCert`](file://apps/web/src/pages/sdm/HR.tsx#L78-L81) (`apps/web/src/pages/sdm/HR.tsx:78-81`) [Tipe: `interface`]
    - *Signature:* `interface EmpCert`

### Sub-sistem: `akunlogin:akun:login` (Klaster #825)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AkunLogin`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L42-L63) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:42-63`) [Tipe: `function`]
    - *Signature:* `({ employeeId }: { employeeId: string })`

### Sub-sistem: `empcert:emp:cert` (Klaster #826)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`EmpCert`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L65-L72) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:65-72`) [Tipe: `interface`]
    - *Signature:* `interface EmpCert`

### Sub-sistem: `skilllevel:skill:level` (Klaster #827)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SkillLevel`](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L74-L74) (`apps/web/src/pages/sdm/KaryawanDetail.tsx:74-74`) [Tipe: `interface`]
    - *Signature:* `interface SkillLevel`

### Sub-sistem: `potonganof:hutang:kata` (Klaster #830)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`potonganOf`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L96-L96) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:96-96`) [Tipe: `function`]
    - *Signature:* `(p: StoreItem, pphFallback = 2): number`
    - *Deskripsi:* /** Teks tarif untuk tampilan & catatan hutang: "0.5%" atau kata "manual". */

### Sub-sistem: `milestone:hutang:kata` (Klaster #832)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Milestone`](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L134-L134) (`apps/web/src/pages/subkontraktor/Subcontractor.tsx:134-134`) [Tipe: `interface`]
    - *Signature:* `interface Milestone`
    - *Deskripsi:* /** Teks tarif untuk tampilan & catatan hutang: "0.5%" atau kata "manual". */

### Sub-sistem: `row` (Klaster #834)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`row`](file://apps/web/src/services/__tests__/repositories.test.ts#L34-L34) (`apps/web/src/services/__tests__/repositories.test.ts:34-34`) [Tipe: `function`]
    - *Signature:* `(id: string, createdAt: string | undefined, updated_at: string)`

### Sub-sistem: `listwith:list` (Klaster #835)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`listWith`](file://apps/web/src/services/__tests__/repositories.test.ts#L35-L39) (`apps/web/src/services/__tests__/repositories.test.ts:35-39`) [Tipe: `function`]
    - *Signature:* `(rows: unknown[]): Promise<string[]>`

### Sub-sistem: `subsystem-836` (Klaster #836)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`sp`](file://apps/web/src/utils/__tests__/format.test.ts#L30-L30) (`apps/web/src/utils/__tests__/format.test.ts:30-30`) [Tipe: `function`]
    - *Signature:* `(x: string)`

### Sub-sistem: `testpurchaseorder:purchase:test` (Klaster #837)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TestPurchaseOrder`](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L10-L20) (`apps/web/src/utils/__tests__/listPersistence.test.ts:10-20`) [Tipe: `interface`]
    - *Signature:* `interface TestPurchaseOrder`

### Sub-sistem: `testinspection:inspection:test` (Klaster #838)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TestInspection`](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L22-L29) (`apps/web/src/utils/__tests__/listPersistence.test.ts:22-29`) [Tipe: `interface`]
    - *Signature:* `interface TestInspection`

### Sub-sistem: `getval:val:get` (Klaster #839)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`getVal`](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L107-L107) (`apps/web/src/utils/__tests__/listPersistence.test.ts:107-107`) [Tipe: `function`]
    - *Signature:* `(r: TestPurchaseOrder, k: string)`

### Sub-sistem: `pending:filter:filterpending` (Klaster #840)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`filterPending`](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L140-L140) (`apps/web/src/utils/__tests__/listPersistence.test.ts:140-140`) [Tipe: `function`]
    - *Signature:* `(i: TestInspection)`
    - *Deskripsi:* // Filter aktif: hanya yang status === 'Pending'

### Sub-sistem: `bastinput:bast:input` (Klaster #841)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BastInput`](file://services/api/src/pdf/documents/bast.ts#L16-L32) (`services/api/src/pdf/documents/bast.ts:16-32`) [Tipe: `interface`]
    - *Signature:* `interface BastInput`

### Sub-sistem: `boqdocinput:boq:doc` (Klaster #842)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BoqDocInput`](file://services/api/src/pdf/documents/boq.ts#L10-L25) (`services/api/src/pdf/documents/boq.ts:10-25`) [Tipe: `interface`]
    - *Signature:* `interface BoqDocInput`

### Sub-sistem: `garansiinput:garansi:input` (Klaster #843)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`GaransiInput`](file://services/api/src/pdf/documents/boq.ts#L75-L88) (`services/api/src/pdf/documents/boq.ts:75-88`) [Tipe: `interface`]
    - *Signature:* `interface GaransiInput`

### Sub-sistem: `deliveryorderinput:delivery:order` (Klaster #844)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DeliveryOrderInput`](file://services/api/src/pdf/documents/deliveryOrder.ts#L10-L26) (`services/api/src/pdf/documents/deliveryOrder.ts:10-26`) [Tipe: `interface`]
    - *Signature:* `interface DeliveryOrderInput`

### Sub-sistem: `cutidocinput:cuti:doc` (Klaster #845)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CutiDocInput`](file://services/api/src/pdf/documents/hr.ts#L20-L40) (`services/api/src/pdf/documents/hr.ts:20-40`) [Tipe: `interface`]
    - *Signature:* `interface CutiDocInput`

### Sub-sistem: `surathrinput:surat:input` (Klaster #846)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SuratHrInput`](file://services/api/src/pdf/documents/hr.ts#L161-L183) (`services/api/src/pdf/documents/hr.ts:161-183`) [Tipe: `interface`]
    - *Signature:* `interface SuratHrInput`

### Sub-sistem: `invoiceline:invoice:line` (Klaster #847)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`InvoiceLine`](file://services/api/src/pdf/documents/invoice.ts#L27-L36) (`services/api/src/pdf/documents/invoice.ts:27-36`) [Tipe: `interface`]
    - *Signature:* `interface InvoiceLine`

### Sub-sistem: `invoiceinput:invoice:input` (Klaster #848)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`InvoiceInput`](file://services/api/src/pdf/documents/invoice.ts#L38-L71) (`services/api/src/pdf/documents/invoice.ts:38-71`) [Tipe: `interface`]
    - *Signature:* `interface InvoiceInput`

### Sub-sistem: `koppenawaraninput:penawaran:kop` (Klaster #849)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KopPenawaranInput`](file://services/api/src/pdf/documents/kopPenawaran.ts#L10-L20) (`services/api/src/pdf/documents/kopPenawaran.ts:10-20`) [Tipe: `interface`]
    - *Signature:* `interface KopPenawaranInput`

### Sub-sistem: `kwitansiinput:kwitansi:input` (Klaster #850)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KwitansiInput`](file://services/api/src/pdf/documents/kwitansi.ts#L22-L35) (`services/api/src/pdf/documents/kwitansi.ts:22-35`) [Tipe: `interface`]
    - *Signature:* `interface KwitansiInput`

### Sub-sistem: `finding` (Klaster #852)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Finding`](file://services/api/src/pdf/documents/laporan.ts#L37-L44) (`services/api/src/pdf/documents/laporan.ts:37-44`) [Tipe: `interface`]
    - *Signature:* `interface Finding`

### Sub-sistem: `cashreportmodel:cash:report` (Klaster #853)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CashReportModel`](file://services/api/src/pdf/documents/laporan.ts#L46-L60) (`services/api/src/pdf/documents/laporan.ts:46-60`) [Tipe: `interface`]
    - *Signature:* `interface CashReportModel`

### Sub-sistem: `projectreportmodel:report:model` (Klaster #854)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProjectReportModel`](file://services/api/src/pdf/documents/laporan.ts#L62-L71) (`services/api/src/pdf/documents/laporan.ts:62-71`) [Tipe: `interface`]
    - *Signature:* `interface ProjectReportModel`

### Sub-sistem: `analyticmodel:analytic:model` (Klaster #855)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AnalyticModel`](file://services/api/src/pdf/documents/laporan.ts#L73-L121) (`services/api/src/pdf/documents/laporan.ts:73-121`) [Tipe: `interface`]
    - *Signature:* `interface AnalyticModel`

### Sub-sistem: `payrollreportmodel:payroll:report` (Klaster #856)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PayrollReportModel`](file://services/api/src/pdf/documents/laporan.ts#L123-L129) (`services/api/src/pdf/documents/laporan.ts:123-129`) [Tipe: `interface`]
    - *Signature:* `interface PayrollReportModel`

### Sub-sistem: `poinput:input` (Klaster #857)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`PoInput`](file://services/api/src/pdf/documents/po.ts#L16-L41) (`services/api/src/pdf/documents/po.ts:16-41`) [Tipe: `interface`]
    - *Signature:* `interface PoInput`

### Sub-sistem: `qty` (Klaster #859)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`qty`](file://services/api/src/pdf/documents/shared.ts#L117-L122) (`services/api/src/pdf/documents/shared.ts:117-122`) [Tipe: `function`]
    - *Signature:* `(v: unknown, unit = ""): string`

### Sub-sistem: `pct` (Klaster #860)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`pct`](file://services/api/src/pdf/documents/shared.ts#L125-L128) (`services/api/src/pdf/documents/shared.ts:125-128`) [Tipe: `function`]
    - *Signature:* `(v: unknown, decimals = 1): string`

### Sub-sistem: `row` (Klaster #861)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/pdf/documents/shared.ts#L141-L146) (`services/api/src/pdf/documents/shared.ts:141-146`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `rowspec:spec:row` (Klaster #862)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RowSpec`](file://services/api/src/pdf/documents/shared.ts#L153-L158) (`services/api/src/pdf/documents/shared.ts:153-158`) [Tipe: `interface`]
    - *Signature:* `interface RowSpec`

### Sub-sistem: `trimitems:trim:items` (Klaster #864)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`trimItems`](file://services/api/src/pdf/documents/shared.ts#L307-L309) (`services/api/src/pdf/documents/shared.ts:307-309`) [Tipe: `function`]
    - *Signature:* `(items: Array<{ name: string; qty: string }>): Array<{ name: string; qty: string }>`

### Sub-sistem: `doctitle:title:doc` (Klaster #865)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`DocTitle`](file://services/api/src/pdf/documents/shared.ts#L315-L320) (`services/api/src/pdf/documents/shared.ts:315-320`) [Tipe: `interface`]
    - *Signature:* `interface DocTitle`

### Sub-sistem: `slipgajiinput:gaji:slip` (Klaster #866)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SlipGajiInput`](file://services/api/src/pdf/documents/slipGaji.ts#L10-L20) (`services/api/src/pdf/documents/slipGaji.ts:10-20`) [Tipe: `interface`]
    - *Signature:* `interface SlipGajiInput`

### Sub-sistem: `spkinput:spk:input` (Klaster #867)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SpkInput`](file://services/api/src/pdf/documents/spk.ts#L16-L32) (`services/api/src/pdf/documents/spk.ts:16-32`) [Tipe: `interface`]
    - *Signature:* `interface SpkInput`

### Sub-sistem: `sptrow:spt:row` (Klaster #868)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SptRow`](file://services/api/src/pdf/documents/spt.ts#L18-L25) (`services/api/src/pdf/documents/spt.ts:18-25`) [Tipe: `interface`]
    - *Signature:* `interface SptRow`

### Sub-sistem: `sptinput:spt:input` (Klaster #869)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SptInput`](file://services/api/src/pdf/documents/spt.ts#L27-L49) (`services/api/src/pdf/documents/spt.ts:27-49`) [Tipe: `interface`]
    - *Signature:* `interface SptInput`

### Sub-sistem: `suratjalaninput:jalan:surat` (Klaster #870)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`SuratJalanInput`](file://services/api/src/pdf/documents/suratJalan.ts#L11-L24) (`services/api/src/pdf/documents/suratJalan.ts:11-24`) [Tipe: `interface`]
    - *Signature:* `interface SuratJalanInput`

### Sub-sistem: `tandaterimainput:tanda:terima` (Klaster #871)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TandaTerimaInput`](file://services/api/src/pdf/documents/tandaTerima.ts#L10-L22) (`services/api/src/pdf/documents/tandaTerima.ts:10-22`) [Tipe: `interface`]
    - *Signature:* `interface TandaTerimaInput`

### Sub-sistem: `transmittalinput:transmittal:input` (Klaster #872)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TransmittalInput`](file://services/api/src/pdf/documents/transmittal.ts#L10-L20) (`services/api/src/pdf/documents/transmittal.ts:10-20`) [Tipe: `interface`]
    - *Signature:* `interface TransmittalInput`

### Sub-sistem: `materialformvalues:values:form` (Klaster #873)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`MaterialFormValues`](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L18-L34) (`apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx:18-34`) [Tipe: `interface`]
    - *Signature:* `interface MaterialFormValues`

### Sub-sistem: `props` (Klaster #874)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L36-L50) (`apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx:36-50`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `coatreenode:tree:coa` (Klaster #876)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CoaTreeNode`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L9-L21) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:9-21`) [Tipe: `interface`]
    - *Signature:* `interface CoaTreeNode`

### Sub-sistem: `coatabprops:coa:props` (Klaster #877)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`CoaTabProps`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L23-L28) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:23-28`) [Tipe: `interface`]
    - *Signature:* `interface CoaTabProps`

### Sub-sistem: `treenoderowprops:bangun:pohon` (Klaster #880)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`TreeNodeRowProps`](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L346-L354) (`apps/web/src/pages/keuangan/tabs/CoaTab.tsx:346-354`) [Tipe: `interface`]
    - *Signature:* `interface TreeNodeRowProps`
    - *Deskripsi:* /** Bangun pohon hierarki lengkap dari daftar baris CoA. */

### Sub-sistem: `resolvebranch:resolve:branch` (Klaster #881)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`resolveBranch`](file://apps/web/src/pages/qc/__tests__/QCChecklist.test.ts#L6-L9) (`apps/web/src/pages/qc/__tests__/QCChecklist.test.ts:6-9`) [Tipe: `function`]
    - *Signature:* `(activeBranch?: string, userBranch?: string)`

### Sub-sistem: `row` (Klaster #882)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Row`](file://services/api/src/inventoryAdditional.ts#L10-L10) (`services/api/src/inventoryAdditional.ts:10-10`) [Tipe: `interface`]
    - *Signature:* `interface Row`

### Sub-sistem: `additionalinput:additional:input` (Klaster #884)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`AdditionalInput`](file://services/api/src/inventoryAdditional.ts#L16-L23) (`services/api/src/inventoryAdditional.ts:16-23`) [Tipe: `interface`]
    - *Signature:* `interface AdditionalInput`

### Sub-sistem: `routeentry:route:entry` (Klaster #893)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`RouteEntry`](file://services/api/src/routeList.ts#L6-L6) (`services/api/src/routeList.ts:6-6`) [Tipe: `interface`]
    - *Signature:* `interface RouteEntry`

### Sub-sistem: `importpreviewrow:preview:row` (Klaster #896)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ImportPreviewRow`](file://apps/web/src/components/ImportPreviewModal.tsx#L10-L16) (`apps/web/src/components/ImportPreviewModal.tsx:10-16`) [Tipe: `interface`]
    - *Signature:* `interface ImportPreviewRow`

### Sub-sistem: `props` (Klaster #897)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/components/ImportPreviewModal.tsx#L18-L26) (`apps/web/src/components/ImportPreviewModal.tsx:18-26`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `kasbonpotongan:kasbon:potongan` (Klaster #899)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KasbonPotongan`](file://apps/web/src/utils/kasbon.ts#L8-L13) (`apps/web/src/utils/kasbon.ts:8-13`) [Tipe: `interface`]
    - *Signature:* `interface KasbonPotongan`

### Sub-sistem: `kasbonentry:kasbon:entry` (Klaster #900)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`KasbonEntry`](file://apps/web/src/utils/kasbon.ts#L15-L22) (`apps/web/src/utils/kasbon.ts:15-22`) [Tipe: `interface`]
    - *Signature:* `interface KasbonEntry`

### Sub-sistem: `projectfee:fee:project` (Klaster #901)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`ProjectFee`](file://apps/web/src/utils/projectFee.ts#L4-L13) (`apps/web/src/utils/projectFee.ts:4-13`) [Tipe: `interface`]
    - *Signature:* `interface ProjectFee`

### Sub-sistem: `link` (Klaster #908)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Link`](file://services/api/src/routes/relations.ts#L22-L22) (`services/api/src/routes/relations.ts:22-22`) [Tipe: `interface`]
    - *Signature:* `interface Link`

### Sub-sistem: `props` (Klaster #913)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L12-L17) (`apps/web/src/pages/proyek/DockPlanCard.tsx:12-17`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `props` (Klaster #915)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`Props`](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L15-L21) (`apps/web/src/pages/proyek/FeeProjectCard.tsx:15-21`) [Tipe: `interface`]
    - *Signature:* `interface Props`

### Sub-sistem: `bomallocation:allocation:bom` (Klaster #917)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`BomAllocation`](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L15-L15) (`apps/web/src/pages/proyek/WbsMaterialModal.tsx:15-15`) [Tipe: `interface`]
    - *Signature:* `interface BomAllocation`

### Sub-sistem: `subsystem-920` (Klaster #920)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`k`](file://apps/web/src/utils/__tests__/kasbon.test.ts#L4-L4) (`apps/web/src/utils/__tests__/kasbon.test.ts:4-4`) [Tipe: `function`]
    - *Signature:* `(over: Partial<KasbonEntry> = {}): KasbonEntry`

### Sub-sistem: `slip` (Klaster #921)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`slip`](file://apps/web/src/utils/__tests__/kasbon.test.ts#L5-L5) (`apps/web/src/utils/__tests__/kasbon.test.ts:5-5`) [Tipe: `function`]
    - *Signature:* `(id: string, period: string)`

### Sub-sistem: `subsystem-922` (Klaster #922)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`p`](file://apps/web/src/utils/__tests__/projectStages.test.ts#L5-L5) (`apps/web/src/utils/__tests__/projectStages.test.ts:5-5`) [Tipe: `function`]
    - *Signature:* `(o: Record<string, unknown>): StoreItem`

### Sub-sistem: `voucherinput:voucher:input` (Klaster #924)
- **Kepadatan Simbol:** 1 simbol.
- **Komponen Inti / Simbol Penghubung (Top Centrality Hubs):**
  - [`VoucherInput`](file://services/api/src/pdf/documents/voucher.ts#L9-L17) (`services/api/src/pdf/documents/voucher.ts:9-17`) [Tipe: `interface`]
    - *Signature:* `interface VoucherInput`

---

## 2. Titik Masuk Utama & Titik Interaksi Eksternal (Entry Points)

Berikut adalah simbol-simbol yang berfungsi sebagai pintu masuk (entry points, routes, atau pengendali utama) yang menerima pemicu dari luar atau CLI/HTTP:

*Tidak terdeteksi entry point publik spesifik; sistem kemungkinan berupa modul perpustakaan (library).*

---

## 3. Audit Titik Rawan Bencana ("Emotional Damage" Technical Debt Audit)

> [!WARNING]
> Analisis tanpa kompromi terhadap simpul-simpul berisiko tinggi. Jika salah satu komponen di bawah ini diubah tanpa mitigasi uji komprehensif, efek domino (*blast radius*) dapat melumpuhkan sistem.

### Titik Kemacetan Sentral (Single Points of Failure)
Komponen-komponen berikut dipanggil oleh banyak modul lain secara bersamaan:

- **Simbol Kritis:** [`exec`](file://services/api/src/db.ts#L95-L97) (`services/api/src/db.ts:95-97`)
  - **Beban Pemanggil (Blast Radius Inbound):** Dipanggil langsung oleh **173** modul/fungsi lain.
  - **Tingkat Keyakinan Relasi Bayesian:** `53.3%`
  - **Peringatan Dampak:** Setiap perubahan *signature* atau perilaku kembalian (*return type*) pada [`exec`](file://services/api/src/db.ts#L95-L97) (`services/api/src/db.ts:95-97`) berpotensi memicu galat runtime pada setidaknya 173 titik downstream.

- **Simbol Kritis:** [`push`](file://apps/web/src/utils/woMilestones.ts#L120-L125) (`apps/web/src/utils/woMilestones.ts:120-125`)
  - **Beban Pemanggil (Blast Radius Inbound):** Dipanggil langsung oleh **160** modul/fungsi lain.
  - **Tingkat Keyakinan Relasi Bayesian:** `21.4%`
  - **Peringatan Dampak:** Setiap perubahan *signature* atau perilaku kembalian (*return type*) pada [`push`](file://apps/web/src/utils/woMilestones.ts#L120-L125) (`apps/web/src/utils/woMilestones.ts:120-125`) berpotensi memicu galat runtime pada setidaknya 160 titik downstream.

- **Simbol Kritis:** [`push`](file://services/api/src/routes/readModels.ts#L24-L29) (`services/api/src/routes/readModels.ts:24-29`)
  - **Beban Pemanggil (Blast Radius Inbound):** Dipanggil langsung oleh **160** modul/fungsi lain.
  - **Tingkat Keyakinan Relasi Bayesian:** `21.4%`
  - **Peringatan Dampak:** Setiap perubahan *signature* atau perilaku kembalian (*return type*) pada [`push`](file://services/api/src/routes/readModels.ts#L24-L29) (`services/api/src/routes/readModels.ts:24-29`) berpotensi memicu galat runtime pada setidaknya 160 titik downstream.

- **Simbol Kritis:** [`push`](file://apps/web/src/pages/proyek/WbsTree.tsx#L19-L19) (`apps/web/src/pages/proyek/WbsTree.tsx:19-19`)
  - **Beban Pemanggil (Blast Radius Inbound):** Dipanggil langsung oleh **160** modul/fungsi lain.
  - **Tingkat Keyakinan Relasi Bayesian:** `21.4%`
  - **Peringatan Dampak:** Setiap perubahan *signature* atau perilaku kembalian (*return type*) pada [`push`](file://apps/web/src/pages/proyek/WbsTree.tsx#L19-L19) (`apps/web/src/pages/proyek/WbsTree.tsx:19-19`) berpotensi memicu galat runtime pada setidaknya 160 titik downstream.

- **Simbol Kritis:** [`push`](file://apps/web/src/utils/usages.ts#L13-L15) (`apps/web/src/utils/usages.ts:13-15`)
  - **Beban Pemanggil (Blast Radius Inbound):** Dipanggil langsung oleh **158** modul/fungsi lain.
  - **Tingkat Keyakinan Relasi Bayesian:** `20.9%`
  - **Peringatan Dampak:** Setiap perubahan *signature* atau perilaku kembalian (*return type*) pada [`push`](file://apps/web/src/utils/usages.ts#L13-L15) (`apps/web/src/utils/usages.ts:13-15`) berpotensi memicu galat runtime pada setidaknya 158 titik downstream.

### Relasi Ambigius / Panggilan Dinamis
Ditemukan **2466** relasi pemanggilan dengan derajat keyakinan Bayesian $< 60%$ (misalnya pemanggilan dinamis via *magic method* atau polimorfisme PHP/TS). Perlu pengujian manual ekstra pada lintasan ini.

---

## 4. Matriks Ketertelusuran Sitasi Kode (Zero Uncited Claims Audit)

Daftar lengkap seluruh simbol yang dikutip dalam dokumen ini beserta koordinat presisi berkas dan baris kodenya:

| Simbol | Tipe Simbol | Berkas Sumber | Baris Mulai | Baris Selesai |
| :--- | :--- | :--- | :--- | :--- |
| `sptNumOf` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L596-L599) | `596` | `599` |
| `taxManualOf` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L606-L607) | `606` | `607` |
| `bump` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L1881-L1885) | `1881` | `1885` |
| `amtD` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L2438-L2438) | `2438` | `2438` |
| `closeAst` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L2412-L2416) | `2412` | `2416` |
| `onPhotoFile` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L1355-L1369) | `1355` | `1369` |
| `setF` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L1310-L1328) | `1310` | `1328` |
| `handleImportFile` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L1876-L1912) | `1876` | `1912` |
| `auditOf` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L913-L917) | `913` | `917` |
| `openEdit` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L1400-L1424) | `1400` | `1424` |
| `todayISO` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L104-L109) | `104` | `109` |
| `parseJam` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L86-L91) | `86` | `91` |
| `projOf` | `function` | [apps/web/src/pages/equipment/Equipment.tsx](file://apps/web/src/pages/equipment/Equipment.tsx#L444-L445) | `444` | `445` |
| `saveUtilOverride` | `function` | [apps/web/src/pages/equipment/Equipment.tsx](file://apps/web/src/pages/equipment/Equipment.tsx#L1556-L1570) | `1556` | `1570` |
| `adjustMaintMaterials` | `function` | [apps/web/src/pages/equipment/Equipment.tsx](file://apps/web/src/pages/equipment/Equipment.tsx#L1071-L1118) | `1071` | `1118` |
| `witaTodayISO` | `function` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L16-L21) | `16` | `21` |
| `isoDayNumber` | `function` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L23-L28) | `23` | `28` |
| `slotDateOffsets` | `function` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L101-L114) | `101` | `114` |
| `bookingDateOffsets` | `function` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L88-L98) | `88` | `98` |
| `dayToISO` | `function` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L34-L38) | `34` | `38` |
| `handleSelectTermWo` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L379-L430) | `379` | `430` |
| `recordPenalty` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L580-L592) | `580` | `592` |
| `removeMilestone` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L525-L533) | `525` | `533` |
| `hoursByWo` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L447-L448) | `447` | `448` |
| `approveTimesheet` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L1154-L1160) | `1154` | `1160` |
| `signKeys` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L1109-L1109) | `1109` | `1109` |
| `pickNotifIds` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L639-L656) | `639` | `656` |
| `doPoStatus` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L848-L857) | `848` | `857` |
| `maxRet` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L1379-L1380) | `1379` | `1380` |
| `cetakPo` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L1131-L1160) | `1131` | `1160` |
| `getJwt` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L65-L71) | `65` | `71` |
| `loadSideMapConflictHolds` | `function` | [apps/web/src/data/sideMapConflictHolds.ts](file://apps/web/src/data/sideMapConflictHolds.ts#L14-L21) | `14` | `21` |
| `persistSideMapConflictHolds` | `function` | [apps/web/src/data/sideMapConflictHolds.ts](file://apps/web/src/data/sideMapConflictHolds.ts#L23-L31) | `23` | `31` |
| `storedCacheOwnerId` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L612-L618) | `612` | `618` |
| `currentSessionOwnerId` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L585-L594) | `585` | `594` |
| `reworkCost` | `function` | [apps/web/src/pages/qc/QCSafety.tsx](file://apps/web/src/pages/qc/QCSafety.tsx#L396-L397) | `396` | `397` |
| `certsOfInspector` | `function` | [apps/web/src/pages/qc/QCSafety.tsx](file://apps/web/src/pages/qc/QCSafety.tsx#L379-L382) | `379` | `382` |
| `needsFollowUp` | `function` | [apps/web/src/pages/qc/QCSafety.tsx](file://apps/web/src/pages/qc/QCSafety.tsx#L389-L393) | `389` | `393` |
| `mark` | `function` | [apps/web/src/pages/qc/QCSafety.tsx](file://apps/web/src/pages/qc/QCSafety.tsx#L157-L160) | `157` | `160` |
| `toTab` | `function` | [apps/web/src/pages/qc/QCSafety.tsx](file://apps/web/src/pages/qc/QCSafety.tsx#L161-L165) | `161` | `165` |
| `docUrlOf` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L101-L103) | `101` | `103` |
| `patch` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L3069-L3069) | `3069` | `3069` |
| `advanceBast` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L935-L1009) | `935` | `1009` |
| `riskScore` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L614-L615) | `614` | `615` |
| `nextMilestoneInvId` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L883-L901) | `883` | `901` |
| `contractDays` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L398-L398) | `398` | `398` |
| `importCSV` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L1303-L1425) | `1303` | `1425` |
| `empNameOf` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L911-L911) | `911` | `911` |
| `openTrainingEdit` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L1006-L1015) | `1006` | `1015` |
| `pickNotifIds` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L450-L467) | `450` | `467` |
| `add` | `method` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L169-L225) | `169` | `225` |
| `add` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L200-L206) | `200` | `206` |
| `add` | `function` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L82-L105) | `82` | `105` |
| `money` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L99-L107) | `99` | `107` |
| `rupiah` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L110-L114) | `110` | `114` |
| `str` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L244-L250) | `244` | `250` |
| `arr` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L276-L294) | `276` | `294` |
| `round1` | `function` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L118-L120) | `118` | `120` |
| `allowanceTotal` | `function` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L106-L111) | `106` | `111` |
| `prepare` | `method` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L1318-L1329) | `1318` | `1329` |
| `looksLikeUrl` | `function` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L30-L37) | `30` | `37` |
| `setF` | `function` | [apps/web/src/pages/dokumen/Documents.tsx](file://apps/web/src/pages/dokumen/Documents.tsx#L677-L677) | `677` | `677` |
| `maxSeq` | `function` | [apps/web/src/utils/sb.ts](file://apps/web/src/utils/sb.ts#L59-L70) | `59` | `70` |
| `flowTo` | `function` | [apps/web/src/pages/dokumen/Documents.tsx](file://apps/web/src/pages/dokumen/Documents.tsx#L613-L623) | `613` | `623` |
| `openDetail` | `function` | [apps/web/src/pages/dokumen/Documents.tsx](file://apps/web/src/pages/dokumen/Documents.tsx#L464-L474) | `464` | `474` |
| `dispStage` | `function` | [apps/web/src/pages/crm/CRM.tsx](file://apps/web/src/pages/crm/CRM.tsx#L82-L82) | `82` | `82` |
| `toggleSurvey` | `function` | [apps/web/src/pages/crm/CRM.tsx](file://apps/web/src/pages/crm/CRM.tsx#L129-L130) | `129` | `130` |
| `nextProjectCode` | `function` | [apps/web/src/pages/crm/CRM.tsx](file://apps/web/src/pages/crm/CRM.tsx#L195-L204) | `195` | `204` |
| `openSend` | `function` | [apps/web/src/pages/crm/CRM.tsx](file://apps/web/src/pages/crm/CRM.tsx#L313-L317) | `313` | `317` |
| `dispType` | `function` | [apps/web/src/pages/crm/CRM.tsx](file://apps/web/src/pages/crm/CRM.tsx#L85-L85) | `85` | `85` |
| `askAdvance` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L481-L490) | `481` | `490` |
| `empNameOf` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L369-L369) | `369` | `369` |
| `openEdit` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L517-L526) | `517` | `526` |
| `removeKasbon` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L805-L811) | `805` | `811` |
| `empOf` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L368-L368) | `368` | `368` |
| `push` | `function` | [services/api/src/routes/readModels.ts](file://services/api/src/routes/readModels.ts#L24-L29) | `24` | `29` |
| `push` | `function` | [apps/web/src/pages/proyek/WbsTree.tsx](file://apps/web/src/pages/proyek/WbsTree.tsx#L19-L19) | `19` | `19` |
| `push` | `function` | [apps/web/src/utils/usages.ts](file://apps/web/src/utils/usages.ts#L13-L15) | `13` | `15` |
| `list` | `method` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L160-L194) | `160` | `194` |
| `sinceOf` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L120-L124) | `120` | `124` |
| `str` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L226-L226) | `226` | `226` |
| `setCompliance` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L259-L272) | `259` | `272` |
| `removePlan` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L332-L337) | `332` | `337` |
| `openDockEdit` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L294-L299) | `294` | `299` |
| `opt` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L241-L241) | `241` | `241` |
| `persist` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L729-L748) | `729` | `748` |
| `registerCrud` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L402-L858) | `402` | `858` |
| `performWrite` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L749-L753) | `749` | `753` |
| `performDelete` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L820-L834) | `820` | `834` |
| `sendCached` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L423-L427) | `423` | `427` |
| `measure` | `function` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L67-L88) | `67` | `88` |
| `safeText` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L127-L131) | `127` | `131` |
| `safe` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L216-L218) | `216` | `218` |
| `fmt` | `function` | [apps/web/src/utils/stockIssue.ts](file://apps/web/src/utils/stockIssue.ts#L48-L48) | `48` | `48` |
| `txt` | `function` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L85-L97) | `85` | `97` |
| `lineHeightFor` | `function` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L156-L158) | `156` | `158` |
| `drawText` | `function` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L89-L127) | `89` | `127` |
| `drawLine` | `function` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L129-L142) | `129` | `142` |
| `wrap` | `function` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L100-L148) | `100` | `148` |
| `keyValue` | `function` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L384-L431) | `384` | `431` |
| `openLeaveEdit` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L401-L411) | `401` | `411` |
| `delRowDesc` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L476-L496) | `476` | `496` |
| `attOtApproved` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L341-L341) | `341` | `341` |
| `openAttEdit` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L343-L362) | `343` | `362` |
| `delCert` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L257-L263) | `257` | `263` |
| `onError` | `function` | [apps/web/src/pages/proyek/SparepartServiceSection.tsx](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L262-L265) | `262` | `265` |
| `svcTypeLabel` | `function` | [apps/web/src/pages/proyek/SparepartServiceSection.tsx](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L78-L78) | `78` | `78` |
| `saveFromInventory` | `function` | [apps/web/src/pages/proyek/SparepartServiceSection.tsx](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L308-L335) | `308` | `335` |
| `advanceService` | `function` | [apps/web/src/pages/proyek/SparepartServiceSection.tsx](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L195-L202) | `195` | `202` |
| `openEditSvc` | `function` | [apps/web/src/pages/proyek/SparepartServiceSection.tsx](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L102-L115) | `102` | `115` |
| `shiftMonth` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L69-L74) | `69` | `74` |
| `sigRows` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L252-L254) | `252` | `254` |
| `matchProject` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L133-L137) | `133` | `137` |
| `applyTpl` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L275-L282) | `275` | `282` |
| `exportProject` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L353-L375) | `353` | `375` |
| `isGroupOpen` | `function` | [apps/web/src/layouts/AppShell.tsx](file://apps/web/src/layouts/AppShell.tsx#L151-L151) | `151` | `151` |
| `toggleGroup` | `function` | [apps/web/src/layouts/AppShell.tsx](file://apps/web/src/layouts/AppShell.tsx#L152-L162) | `152` | `162` |
| `markNotifRead` | `function` | [apps/web/src/layouts/AppShell.tsx](file://apps/web/src/layouts/AppShell.tsx#L188-L194) | `188` | `194` |
| `beat` | `function` | [apps/web/src/layouts/AppShell.tsx](file://apps/web/src/layouts/AppShell.tsx#L110-L113) | `110` | `113` |
| `doChangePassword` | `function` | [apps/web/src/layouts/AppShell.tsx](file://apps/web/src/layouts/AppShell.tsx#L315-L335) | `315` | `335` |
| `rejectOT` | `function` | [apps/web/src/pages/absensi/Absensi.tsx](file://apps/web/src/pages/absensi/Absensi.tsx#L409-L415) | `409` | `415` |
| `persist` | `function` | [apps/web/src/pages/absensi/Absensi.tsx](file://apps/web/src/pages/absensi/Absensi.tsx#L155-L196) | `155` | `196` |
| `rowFor` | `function` | [apps/web/src/pages/absensi/Absensi.tsx](file://apps/web/src/pages/absensi/Absensi.tsx#L126-L126) | `126` | `126` |
| `setRow` | `function` | [apps/web/src/pages/absensi/Absensi.tsx](file://apps/web/src/pages/absensi/Absensi.tsx#L127-L128) | `127` | `128` |
| `empNameOf` | `function` | [apps/web/src/pages/absensi/Absensi.tsx](file://apps/web/src/pages/absensi/Absensi.tsx#L398-L398) | `398` | `398` |
| `changeStatus` | `function` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L269-L279) | `269` | `279` |
| `logOf` | `function` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L180-L186) | `180` | `186` |
| `nextStatus` | `function` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L188-L188) | `188` | `188` |
| `pos` | `function` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L171-L171) | `171` | `171` |
| `openEdit` | `function` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L306-L310) | `306` | `310` |
| `rowToItem` | `function` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L66-L73) | `66` | `73` |
| `isBackendPage` | `function` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L119-L121) | `119` | `121` |
| `remove` | `method` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L249-L251) | `249` | `251` |
| `isBackendConfigured` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L99-L101) | `99` | `101` |
| `collect` | `function` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L143-L154) | `143` | `154` |
| `bottom` | `method` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L113-L115) | `113` | `115` |
| `newPage` | `method` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L128-L132) | `128` | `132` |
| `ctx` | `method` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L117-L126) | `117` | `126` |
| `cjkChars` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L196-L203) | `196` | `203` |
| `fontName` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L211-L213) | `211` | `213` |
| `goAttentionItem` | `function` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L550-L553) | `550` | `553` |
| `toneFor` | `function` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L926-L927) | `926` | `927` |
| `toggleAttentionCategory` | `function` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L555-L564) | `555` | `564` |
| `highlightOf` | `function` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L286-L287) | `286` | `287` |
| `statusLabel` | `function` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L209-L213) | `209` | `213` |
| `pickNotifIds` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L238-L245) | `238` | `245` |
| `openEdit` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L278-L281) | `278` | `281` |
| `slotCountFor` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L257-L257) | `257` | `257` |
| `clientOptionsFor` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L152-L154) | `152` | `154` |
| `closeSurveyModal` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L183-L186) | `183` | `186` |
| `doLinkEmployee` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L479-L492) | `479` | `492` |
| `loadAudit` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L453-L462) | `453` | `462` |
| `doToggleActive` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L494-L511) | `494` | `511` |
| `empNameOf` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L334-L338) | `334` | `338` |
| `loadSessions` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L438-L449) | `438` | `449` |
| `q` | `function` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L479-L479) | `479` | `479` |
| `income` | `function` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L313-L325) | `313` | `325` |
| `delNote` | `function` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L577-L583) | `577` | `583` |
| `annualFor` | `function` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L556-L556) | `556` | `556` |
| `numOf` | `function` | [apps/web/src/utils/series.ts](file://apps/web/src/utils/series.ts#L56-L59) | `56` | `59` |
| `fmtMiliar` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L89-L92) | `89` | `92` |
| `syncScroll` | `function` | [apps/web/src/pages/proyek/Monitoring.tsx](file://apps/web/src/pages/proyek/Monitoring.tsx#L74-L81) | `74` | `81` |
| `diajukanCo` | `function` | [apps/web/src/pages/proyek/Monitoring.tsx](file://apps/web/src/pages/proyek/Monitoring.tsx#L138-L139) | `138` | `139` |
| `delayDaysOf` | `function` | [apps/web/src/pages/proyek/Monitoring.tsx](file://apps/web/src/pages/proyek/Monitoring.tsx#L177-L178) | `177` | `178` |
| `isLate` | `function` | [apps/web/src/pages/proyek/Monitoring.tsx](file://apps/web/src/pages/proyek/Monitoring.tsx#L147-L147) | `147` | `147` |
| `num` | `function` | [apps/web/src/pages/crm/QuotationDetail.tsx](file://apps/web/src/pages/crm/QuotationDetail.tsx#L23-L23) | `23` | `23` |
| `markTerminal` | `function` | [apps/web/src/pages/crm/QuotationDetail.tsx](file://apps/web/src/pages/crm/QuotationDetail.tsx#L127-L134) | `127` | `134` |
| `nextProjectCode` | `function` | [apps/web/src/pages/crm/QuotationDetail.tsx](file://apps/web/src/pages/crm/QuotationDetail.tsx#L136-L145) | `136` | `145` |
| `setLine` | `function` | [apps/web/src/pages/crm/QuotationDetail.tsx](file://apps/web/src/pages/crm/QuotationDetail.tsx#L90-L94) | `90` | `94` |
| `move` | `function` | [apps/web/src/pages/crm/QuotationDetail.tsx](file://apps/web/src/pages/crm/QuotationDetail.tsx#L115-L125) | `115` | `125` |
| `openMoveEdit` | `function` | [apps/web/src/pages/inventori/BomDetail.tsx](file://apps/web/src/pages/inventori/BomDetail.tsx#L129-L138) | `129` | `138` |
| `employeeOptions` | `function` | [apps/web/src/utils/employeeOptions.ts](file://apps/web/src/utils/employeeOptions.ts#L39-L56) | `39` | `56` |
| `isKnownEmployee` | `function` | [apps/web/src/utils/employeeOptions.ts](file://apps/web/src/utils/employeeOptions.ts#L68-L72) | `68` | `72` |
| `reservedQty` | `function` | [apps/web/src/pages/inventori/BomDetail.tsx](file://apps/web/src/pages/inventori/BomDetail.tsx#L29-L32) | `29` | `32` |
| `qrPayloadOf` | `function` | [apps/web/src/pages/inventori/BomDetail.tsx](file://apps/web/src/pages/inventori/BomDetail.tsx#L38-L40) | `38` | `40` |
| `markGroup` | `function` | [apps/web/src/pages/notifikasi/Notifikasi.tsx](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L167-L172) | `167` | `172` |
| `markOne` | `function` | [apps/web/src/pages/notifikasi/Notifikasi.tsx](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L155-L160) | `155` | `160` |
| `persist` | `function` | [apps/web/src/pages/notifikasi/Notifikasi.tsx](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L150-L153) | `150` | `153` |
| `saveNotifRead` | `function` | [apps/web/src/utils/notifRead.ts](file://apps/web/src/utils/notifRead.ts#L15-L21) | `15` | `21` |
| `loadNotifRead` | `function` | [apps/web/src/utils/notifRead.ts](file://apps/web/src/utils/notifRead.ts#L5-L13) | `5` | `13` |
| `patchItem` | `function` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L166-L168) | `166` | `168` |
| `openEdit` | `function` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L138-L144) | `138` | `144` |
| `seg` | `function` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L170-L173) | `170` | `173` |
| `hseOf` | `function` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L57-L59) | `57` | `59` |
| `startInspection` | `function` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L72-L94) | `72` | `94` |
| `setPick` | `function` | [apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L75-L83) | `75` | `83` |
| `stockOf` | `function` | [apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L173-L173) | `173` | `173` |
| `stockLabel` | `function` | [apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L279-L280) | `279` | `280` |
| `onSelectProcPo` | `function` | [apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L216-L223) | `216` | `223` |
| `onSelectAddInItem` | `function` | [apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx](file://apps/web/src/pages/inventori/tabs/ReceiveIssueTab.tsx#L121-L130) | `121` | `130` |
| `parse` | `function` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L32-L34) | `32` | `34` |
| `num` | `function` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L35-L35) | `35` | `35` |
| `savePo` | `function` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L43-L49) | `43` | `49` |
| `loadPo` | `function` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L37-L41) | `37` | `41` |
| `multiItem` | `function` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L59-L64) | `59` | `64` |
| `statusLabel` | `function` | [apps/web/src/pages/proyek/BoqDocsSection.tsx](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L84-L87) | `84` | `87` |
| `revise` | `function` | [apps/web/src/pages/proyek/BoqDocsSection.tsx](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L192-L237) | `192` | `237` |
| `handleExportExcel` | `function` | [apps/web/src/pages/proyek/BoqDocsSection.tsx](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L322-L373) | `322` | `373` |
| `handleEnterprisePrint` | `function` | [apps/web/src/pages/proyek/BoqDocsSection.tsx](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L289-L320) | `289` | `320` |
| `totalOf` | `function` | [apps/web/src/pages/proyek/BoqDocsSection.tsx](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L81-L81) | `81` | `81` |
| `hasPermission` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L38-L51) | `38` | `51` |
| `doFulfill` | `function` | [apps/web/src/pages/procurement/MaterialRequestsTab.tsx](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L129-L138) | `129` | `138` |
| `stockOf` | `function` | [apps/web/src/pages/procurement/MaterialRequestsTab.tsx](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L60-L63) | `60` | `63` |
| `doApprove` | `function` | [apps/web/src/pages/procurement/MaterialRequestsTab.tsx](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L109-L116) | `109` | `116` |
| `stTone` | `function` | [apps/web/src/pages/procurement/MaterialRequestsTab.tsx](file://apps/web/src/pages/procurement/MaterialRequestsTab.tsx#L59-L59) | `59` | `59` |
| `clear` | `method` | [apps/web/src/data/sideMapEpochs.ts](file://apps/web/src/data/sideMapEpochs.ts#L93-L96) | `93` | `96` |
| `key` | `method` | [apps/web/src/data/sideMapEpochs.ts](file://apps/web/src/data/sideMapEpochs.ts#L26-L28) | `26` | `28` |
| `bump` | `method` | [apps/web/src/data/sideMapEpochs.ts](file://apps/web/src/data/sideMapEpochs.ts#L30-L35) | `30` | `35` |
| `beginWrite` | `method` | [apps/web/src/data/sideMapEpochs.ts](file://apps/web/src/data/sideMapEpochs.ts#L37-L45) | `37` | `45` |
| `finishWrite` | `method` | [apps/web/src/data/sideMapEpochs.ts](file://apps/web/src/data/sideMapEpochs.ts#L47-L55) | `47` | `55` |
| `patch` | `function` | [services/api/scripts/service-flow-probe.ts](file://services/api/scripts/service-flow-probe.ts#L58-L58) | `58` | `58` |
| `create` | `function` | [services/api/scripts/service-flow-probe.ts](file://services/api/scripts/service-flow-probe.ts#L49-L53) | `49` | `53` |
| `assert` | `function` | [services/api/scripts/service-flow-probe.ts](file://services/api/scripts/service-flow-probe.ts#L13-L16) | `13` | `16` |
| `approve` | `function` | [services/api/scripts/service-flow-probe.ts](file://services/api/scripts/service-flow-probe.ts#L59-L61) | `59` | `61` |
| `auth` | `function` | [services/api/scripts/service-flow-probe.ts](file://services/api/scripts/service-flow-probe.ts#L47-L47) | `47` | `47` |
| `rowHighlightClass` | `function` | [apps/web/src/components/rowHighlight.ts](file://apps/web/src/components/rowHighlight.ts#L49-L61) | `49` | `61` |
| `flashPick` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L130-L141) | `130` | `141` |
| `pickNotifIds` | `function` | [apps/web/src/pages/proyek/Projects.tsx](file://apps/web/src/pages/proyek/Projects.tsx#L235-L239) | `235` | `239` |
| `isBatal` | `function` | [apps/web/src/pages/proyek/Projects.tsx](file://apps/web/src/pages/proyek/Projects.tsx#L206-L206) | `206` | `206` |
| `shouldClearOverride` | `function` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L124-L131) | `124` | `131` |
| `get` | `function` | [services/api/scripts/files-privacy-probe.ts](file://services/api/scripts/files-privacy-probe.ts#L36-L36) | `36` | `36` |
| `useUrlParam` | `function` | [apps/web/src/utils/urlParam.ts](file://apps/web/src/utils/urlParam.ts#L27-L49) | `27` | `49` |
| `cacheGet` | `function` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L51-L60) | `51` | `60` |
| `mergeProjectRowsAfterPull` | `function` | [apps/web/src/data/projectPullScope.ts](file://apps/web/src/data/projectPullScope.ts#L27-L45) | `27` | `45` |
| `deadSummaryByReason` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L249-L260) | `249` | `260` |
| `fulfill` | `function` | [services/api/scripts/material-flow-probe.ts](file://services/api/scripts/material-flow-probe.ts#L95-L95) | `95` | `95` |
| `stockOf` | `function` | [services/api/scripts/material-flow-probe.ts](file://services/api/scripts/material-flow-probe.ts#L35-L38) | `35` | `38` |
| `tokenFor` | `function` | [services/api/scripts/material-flow-probe.ts](file://services/api/scripts/material-flow-probe.ts#L17-L22) | `17` | `22` |
| `assert` | `function` | [services/api/scripts/material-flow-probe.ts](file://services/api/scripts/material-flow-probe.ts#L13-L16) | `13` | `16` |
| `decide` | `function` | [services/api/scripts/material-flow-probe.ts](file://services/api/scripts/material-flow-probe.ts#L45-L47) | `45` | `47` |
| `post` | `function` | [services/api/scripts/po-partial-probe.ts](file://services/api/scripts/po-partial-probe.ts#L64-L64) | `64` | `64` |
| `mrOf` | `function` | [services/api/scripts/po-partial-probe.ts](file://services/api/scripts/po-partial-probe.ts#L65-L65) | `65` | `65` |
| `apOf` | `function` | [services/api/scripts/po-partial-probe.ts](file://services/api/scripts/po-partial-probe.ts#L126-L127) | `126` | `127` |
| `auth` | `function` | [services/api/scripts/po-partial-probe.ts](file://services/api/scripts/po-partial-probe.ts#L63-L63) | `63` | `63` |
| `poOf` | `function` | [services/api/scripts/po-partial-probe.ts](file://services/api/scripts/po-partial-probe.ts#L66-L66) | `66` | `66` |
| `parse` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L38-L41) | `38` | `41` |
| `loadDoc` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L48-L52) | `48` | `52` |
| `docTotal` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L59-L71) | `59` | `71` |
| `syncBoqDocToDocuments` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L135-L206) | `135` | `206` |
| `statusOf` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L43-L46) | `43` | `46` |
| `getDialect` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L24-L27) | `24` | `27` |
| `q` | `method` | [services/api/src/db.ts](file://services/api/src/db.ts#L205-L208) | `205` | `208` |
| `q` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L62-L75) | `62` | `75` |
| `pick` | `function` | [services/api/src/routes/wbs.ts](file://services/api/src/routes/wbs.ts#L162-L179) | `162` | `179` |
| `exactBranchPredicate` | `function` | [services/api/src/routes/crudSearch.ts](file://services/api/src/routes/crudSearch.ts#L18-L20) | `18` | `20` |
| `hideButton` | `function` | [apps/web/src/components/DemoGuide.tsx](file://apps/web/src/components/DemoGuide.tsx#L116-L120) | `116` | `120` |
| `doneOf` | `function` | [apps/web/src/components/DemoGuide.tsx](file://apps/web/src/components/DemoGuide.tsx#L105-L105) | `105` | `105` |
| `writeJson` | `function` | [apps/web/src/components/DemoGuide.tsx](file://apps/web/src/components/DemoGuide.tsx#L34-L36) | `34` | `36` |
| `isTyping` | `function` | [apps/web/src/components/DemoGuide.tsx](file://apps/web/src/components/DemoGuide.tsx#L39-L44) | `39` | `44` |
| `readJson` | `function` | [apps/web/src/components/DemoGuide.tsx](file://apps/web/src/components/DemoGuide.tsx#L25-L32) | `25` | `32` |
| `rowsFor` | `function` | [apps/web/src/pages/pengaturan/Settings.tsx](file://apps/web/src/pages/pengaturan/Settings.tsx#L82-L82) | `82` | `82` |
| `saveToggle` | `function` | [apps/web/src/pages/pengaturan/Settings.tsx](file://apps/web/src/pages/pengaturan/Settings.tsx#L112-L124) | `112` | `124` |
| `save` | `function` | [apps/web/src/pages/pengaturan/Settings.tsx](file://apps/web/src/pages/pengaturan/Settings.tsx#L135-L184) | `135` | `184` |
| `tabFor` | `function` | [apps/web/src/pages/pengaturan/Settings.tsx](file://apps/web/src/pages/pengaturan/Settings.tsx#L74-L80) | `74` | `80` |
| `isTextValue` | `function` | [apps/web/src/pages/pengaturan/Settings.tsx](file://apps/web/src/pages/pengaturan/Settings.tsx#L130-L133) | `130` | `133` |
| `randInt` | `function` | [services/api/scripts/gen-seed-data.ts](file://services/api/scripts/gen-seed-data.ts#L26-L28) | `26` | `28` |
| `randChoice` | `function` | [services/api/scripts/gen-seed-data.ts](file://services/api/scripts/gen-seed-data.ts#L30-L32) | `30` | `32` |
| `genFinance` | `function` | [services/api/scripts/gen-seed-data.ts](file://services/api/scripts/gen-seed-data.ts#L318-L398) | `318` | `398` |
| `genHutang` | `function` | [services/api/scripts/gen-seed-data.ts](file://services/api/scripts/gen-seed-data.ts#L201-L227) | `201` | `227` |
| `genSubkon` | `function` | [services/api/scripts/gen-seed-data.ts](file://services/api/scripts/gen-seed-data.ts#L158-L199) | `158` | `199` |
| `has` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L305-L305) | `305` | `305` |
| `canApproveService` | `function` | [apps/web/src/data/useServiceApproval.ts](file://apps/web/src/data/useServiceApproval.ts#L17-L19) | `17` | `19` |
| `withBoqLineTotal` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L304-L309) | `304` | `309` |
| `shouldRetainSideProjectData` | `function` | [apps/web/src/data/sideMapEpochs.ts](file://apps/web/src/data/sideMapEpochs.ts#L4-L19) | `4` | `19` |
| `requireRole` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L233-L251) | `233` | `251` |
| `fail` | `function` | [apps/web/src/pages/Login.tsx](file://apps/web/src/pages/Login.tsx#L54-L57) | `54` | `57` |
| `enterAsRole` | `function` | [apps/web/src/pages/Login.tsx](file://apps/web/src/pages/Login.tsx#L42-L52) | `42` | `52` |
| `registerFail` | `function` | [apps/web/src/pages/Login.tsx](file://apps/web/src/pages/Login.tsx#L59-L68) | `59` | `68` |
| `quickLogin` | `function` | [apps/web/src/pages/Login.tsx](file://apps/web/src/pages/Login.tsx#L99-L118) | `99` | `118` |
| `takeSessionExpired` | `function` | [apps/web/src/auth/sessionExpired.ts](file://apps/web/src/auth/sessionExpired.ts#L9-L17) | `9` | `17` |
| `toast` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L39-L76) | `39` | `76` |
| `toAbsoluteUrl` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L37-L48) | `37` | `48` |
| `fetchFileBlob` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L97-L119) | `97` | `119` |
| `downloadFileUrl` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L190-L214) | `190` | `214` |
| `clickDownload` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L121-L129) | `121` | `129` |
| `useT` | `function` | [apps/web/src/i18n/LanguageContext.tsx](file://apps/web/src/i18n/LanguageContext.tsx#L48-L50) | `48` | `50` |
| `statusLabel` | `function` | [apps/web/src/i18n/status.ts](file://apps/web/src/i18n/status.ts#L30-L34) | `30` | `34` |
| `InvStageStrip` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L255-L288) | `255` | `288` |
| `SearchBox` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1019-L1064) | `1019` | `1064` |
| `StageStrip` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L54-L93) | `54` | `93` |
| `toggleSort` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1286-L1289) | `1286` | `1289` |
| `auditParams` | `function` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L105-L113) | `105` | `113` |
| `mapAuditRow` | `function` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L91-L103) | `91` | `103` |
| `actorOf` | `function` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L28-L32) | `28` | `32` |
| `toISODateOrNull` | `function` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L16-L24) | `16` | `24` |
| `parseDevice` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L11-L25) | `11` | `25` |
| `fmtWita` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L29-L40) | `29` | `40` |
| `guardBroken` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L126-L133) | `126` | `133` |
| `fetchGeo` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L53-L57) | `53` | `57` |
| `disconnect` | `method` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L59-L59) | `59` | `59` |
| `ok` | `function` | [services/api/src/envelope.ts](file://services/api/src/envelope.ts#L4-L6) | `4` | `6` |
| `equal` | `function` | [apps/web/scripts/drydock-dates-probe.ts](file://apps/web/scripts/drydock-dates-probe.ts#L24-L28) | `24` | `28` |
| `runProbe` | `function` | [services/api/scripts/security-probe-isolation-probe.ts](file://services/api/scripts/security-probe-isolation-probe.ts#L41-L62) | `41` | `62` |
| `probeTempArtifacts` | `function` | [services/api/scripts/security-probe-isolation-probe.ts](file://services/api/scripts/security-probe-isolation-probe.ts#L33-L35) | `33` | `35` |
| `stripAnsi` | `function` | [services/api/scripts/security-probe-isolation-probe.ts](file://services/api/scripts/security-probe-isolation-probe.ts#L37-L39) | `37` | `39` |
| `load` | `function` | [services/api/src/seedBulk.ts](file://services/api/src/seedBulk.ts#L18-L20) | `18` | `20` |
| `put` | `function` | [services/api/src/seedBulk.ts](file://services/api/src/seedBulk.ts#L29-L59) | `29` | `59` |
| `medianOf` | `function` | [services/api/src/seedBulk.ts](file://services/api/src/seedBulk.ts#L133-L137) | `133` | `137` |
| `defaultPriceFor` | `function` | [services/api/src/seedBulk.ts](file://services/api/src/seedBulk.ts#L153-L158) | `153` | `158` |
| `payDate` | `function` | [services/api/src/seedBulk.ts](file://services/api/src/seedBulk.ts#L22-L27) | `22` | `27` |
| `exec` | `method` | [services/api/src/db.ts](file://services/api/src/db.ts#L209-L212) | `209` | `212` |
| `run` | `function` | [services/api/scripts/backup-restore-probe.ts](file://services/api/scripts/backup-restore-probe.ts#L18-L21) | `18` | `21` |
| `withTx` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L139-L234) | `139` | `234` |
| `acquireSqliteLock` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L120-L129) | `120` | `129` |
| `assert` | `function` | [services/api/scripts/tx-probe.ts](file://services/api/scripts/tx-probe.ts#L12-L20) | `12` | `20` |
| `test` | `function` | [services/api/scripts/env-probe.ts](file://services/api/scripts/env-probe.ts#L23-L33) | `23` | `33` |
| `hariValid` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L126-L133) | `126` | `133` |
| `bulanValid` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L121-L125) | `121` | `125` |
| `sheetNumber` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L127-L133) | `127` | `133` |
| `isSideMapConflictKey` | `function` | [apps/web/src/data/sideMapConflictHolds.ts](file://apps/web/src/data/sideMapConflictHolds.ts#L9-L12) | `9` | `12` |
| `buildApp` | `function` | [services/api/src/app.ts](file://services/api/src/app.ts#L103-L417) | `103` | `417` |
| `resolveCorsOrigin` | `function` | [services/api/src/app.ts](file://services/api/src/app.ts#L140-L144) | `140` | `144` |
| `denyRateLimited` | `function` | [services/api/src/app.ts](file://services/api/src/app.ts#L81-L84) | `81` | `84` |
| `isSeedLoginDisabled` | `function` | [services/api/src/app.ts](file://services/api/src/app.ts#L70-L73) | `70` | `73` |
| `getApiVersion` | `function` | [services/api/src/app.ts](file://services/api/src/app.ts#L90-L99) | `90` | `99` |
| `invalidateUserCache` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L128-L134) | `128` | `134` |
| `comparePassword` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L37-L39) | `37` | `39` |
| `bumpTokenVersion` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L136-L142) | `136` | `142` |
| `persistUserChange` | `function` | [services/api/src/routes/users.ts](file://services/api/src/routes/users.ts#L95-L100) | `95` | `100` |
| `assertEmployeeExists` | `function` | [services/api/src/routes/users.ts](file://services/api/src/routes/users.ts#L53-L57) | `53` | `57` |
| `parse` | `function` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L26-L26) | `26` | `26` |
| `num` | `function` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L27-L27) | `27` | `27` |
| `loadCo` | `function` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L63-L67) | `63` | `67` |
| `saveCo` | `function` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L69-L74) | `69` | `74` |
| `decideChangeOrder` | `function` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L77-L88) | `77` | `88` |
| `sortByLevel` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L516-L526) | `516` | `526` |
| `isAlertLevel` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L484-L486) | `484` | `486` |
| `countByLevel` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L549-L553) | `549` | `553` |
| `groupByLevel` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L567-L580) | `567` | `580` |
| `bannerDisplay` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L536-L546) | `536` | `546` |
| `stripQuery` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L16-L18) | `16` | `18` |
| `fileNameOf` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L68-L78) | `68` | `78` |
| `fileKindOf` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L57-L64) | `57` | `64` |
| `fileExtOf` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L51-L54) | `51` | `54` |
| `onDownload` | `function` | [apps/web/src/components/DocumentPreview.tsx](file://apps/web/src/components/DocumentPreview.tsx#L153-L166) | `153` | `166` |
| `slice` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1561-L1561) | `1561` | `1561` |
| `reset` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1562-L1562) | `1562` | `1562` |
| `go` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1563-L1563) | `1563` | `1563` |
| `usePager` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1548-L1566) | `1548` | `1566` |
| `Avatar` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L537-L557) | `537` | `557` |
| `invalidate` | `method` | [apps/web/src/data/collectionSyncCache.ts](file://apps/web/src/data/collectionSyncCache.ts#L81-L86) | `81` | `86` |
| `sync` | `method` | [apps/web/src/data/collectionSyncCache.ts](file://apps/web/src/data/collectionSyncCache.ts#L17-L79) | `17` | `79` |
| `useScope` | `method` | [apps/web/src/data/collectionSyncCache.ts](file://apps/web/src/data/collectionSyncCache.ts#L98-L106) | `98` | `106` |
| `generation` | `method` | [apps/web/src/data/collectionSyncCache.ts](file://apps/web/src/data/collectionSyncCache.ts#L88-L90) | `88` | `90` |
| `invalidateAll` | `method` | [apps/web/src/data/collectionSyncCache.ts](file://apps/web/src/data/collectionSyncCache.ts#L92-L96) | `92` | `96` |
| `pdfServerReady` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L57-L59) | `57` | `59` |
| `docApprovalLabel` | `function` | [apps/web/src/pages/proyek/ReportSection.tsx](file://apps/web/src/pages/proyek/ReportSection.tsx#L66-L70) | `66` | `70` |
| `submitReport` | `function` | [apps/web/src/pages/proyek/ReportSection.tsx](file://apps/web/src/pages/proyek/ReportSection.tsx#L72-L88) | `72` | `88` |
| `handleExportExcel` | `function` | [apps/web/src/pages/proyek/ReportSection.tsx](file://apps/web/src/pages/proyek/ReportSection.tsx#L108-L130) | `108` | `130` |
| `handleExportPDF` | `function` | [apps/web/src/pages/proyek/ReportSection.tsx](file://apps/web/src/pages/proyek/ReportSection.tsx#L95-L106) | `95` | `106` |
| `add` | `function` | [apps/web/src/pages/proyek/FeeProjectCard.tsx](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L39-L46) | `39` | `46` |
| `run` | `function` | [apps/web/src/pages/proyek/FeeProjectCard.tsx](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L35-L38) | `35` | `38` |
| `tagih` | `function` | [apps/web/src/pages/proyek/FeeProjectCard.tsx](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L48-L53) | `48` | `53` |
| `del` | `function` | [apps/web/src/pages/proyek/FeeProjectCard.tsx](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L47-L47) | `47` | `47` |
| `feeAmount` | `function` | [apps/web/src/utils/projectFee.ts](file://apps/web/src/utils/projectFee.ts#L32-L34) | `32` | `34` |
| `post` | `function` | [services/api/scripts/change-order-probe.ts](file://services/api/scripts/change-order-probe.ts#L29-L29) | `29` | `29` |
| `tokenOf` | `function` | [services/api/scripts/change-order-probe.ts](file://services/api/scripts/change-order-probe.ts#L16-L20) | `16` | `20` |
| `h` | `function` | [services/api/scripts/change-order-probe.ts](file://services/api/scripts/change-order-probe.ts#L28-L28) | `28` | `28` |
| `ins` | `function` | [services/api/scripts/change-order-probe.ts](file://services/api/scripts/change-order-probe.ts#L27-L27) | `27` | `27` |
| `assert` | `function` | [services/api/scripts/change-order-probe.ts](file://services/api/scripts/change-order-probe.ts#L12-L15) | `12` | `15` |
| `migrateBoqDocs` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L158-L207) | `158` | `207` |
| `parseData` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L27-L38) | `27` | `38` |
| `buildPlan` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L73-L152) | `73` | `152` |
| `stringField` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L69-L71) | `69` | `71` |
| `stableDocId` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L64-L67) | `64` | `67` |
| `ok` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L30-L38) | `30` | `38` |
| `ctxWith` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L47-L49) | `47` | `49` |
| `probeDocuments` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L104-L231) | `104` | `231` |
| `probeReports` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L237-L298) | `237` | `298` |
| `samples` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L52-L77) | `52` | `77` |
| `runMysqldump` | `function` | [services/api/src/backup.ts](file://services/api/src/backup.ts#L43-L82) | `43` | `82` |
| `tablesCount` | `function` | [services/api/src/backup.ts](file://services/api/src/backup.ts#L26-L41) | `26` | `41` |
| `argValue` | `function` | [services/api/src/backup.ts](file://services/api/src/backup.ts#L9-L15) | `9` | `15` |
| `sanitizeTimestamp` | `function` | [services/api/src/backup.ts](file://services/api/src/backup.ts#L22-L24) | `22` | `24` |
| `resolveSqlitePath` | `function` | [services/api/src/backup.ts](file://services/api/src/backup.ts#L17-L20) | `17` | `20` |
| `normalized` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L22-L24) | `22` | `24` |
| `inventoryConversionError` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L90-L172) | `90` | `172` |
| `isEceran` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L31-L33) | `31` | `33` |
| `closeEnough` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L82-L84) | `82` | `84` |
| `conversionStateChanged` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L75-L80) | `75` | `80` |
| `parse` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L67-L69) | `67` | `69` |
| `fulfillMaterialRequest` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L196-L270) | `196` | `270` |
| `mrStatus` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L59-L62) | `59` | `62` |
| `decideMaterialRequest` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L276-L314) | `276` | `314` |
| `registerMaterialRequestRoutes` | `function` | [services/api/src/routes/materialRequests.ts](file://services/api/src/routes/materialRequests.ts#L27-L96) | `27` | `96` |
| `requirePermission` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L389-L401) | `389` | `401` |
| `requireSettingsWrite` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L427-L429) | `427` | `429` |
| `requireCollectionWrite` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L404-L406) | `404` | `406` |
| `requireAuditRead` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L431-L433) | `431` | `433` |
| `requireCollectionDelete` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L412-L414) | `412` | `414` |
| `initialsOf` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L85-L91) | `85` | `91` |
| `logout` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L222-L253) | `222` | `253` |
| `login` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L159-L220) | `159` | `220` |
| `forgetDeleteDates` | `function` | [apps/web/src/utils/audit.ts](file://apps/web/src/utils/audit.ts#L32-L34) | `32` | `34` |
| `verifiedBranchScope` | `function` | [apps/web/src/data/branchScope.ts](file://apps/web/src/data/branchScope.ts#L19-L21) | `19` | `21` |
| `serializeDismissed` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L51-L58) | `51` | `58` |
| `parseDismissed` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L32-L49) | `32` | `49` |
| `readDismissMap` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L151-L157) | `151` | `157` |
| `writeDismissMap` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L159-L165) | `159` | `165` |
| `onStorage` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L187-L190) | `187` | `190` |
| `close` | `function` | [apps/web/src/components/ProjectAddModal.tsx](file://apps/web/src/components/ProjectAddModal.tsx#L130-L134) | `130` | `134` |
| `setF` | `function` | [apps/web/src/components/ProjectAddModal.tsx](file://apps/web/src/components/ProjectAddModal.tsx#L72-L72) | `72` | `72` |
| `nextProjectCode` | `function` | [apps/web/src/components/ProjectAddModal.tsx](file://apps/web/src/components/ProjectAddModal.tsx#L117-L126) | `117` | `126` |
| `tahapLabel` | `function` | [apps/web/src/utils/projectStages.ts](file://apps/web/src/utils/projectStages.ts#L38-L45) | `38` | `45` |
| `save` | `function` | [apps/web/src/components/ProjectAddModal.tsx](file://apps/web/src/components/ProjectAddModal.tsx#L136-L211) | `136` | `211` |
| `setOpen` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1105-L1111) | `1105` | `1111` |
| `onKeyDown` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1151-L1189) | `1151` | `1189` |
| `commit` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1144-L1149) | `1144` | `1149` |
| `onDoc` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1130-L1139) | `1130` | `1139` |
| `Accordion` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1369-L1404) | `1369` | `1404` |
| `text` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L262-L265) | `262` | `265` |
| `errMsg` | `function` | [apps/web/src/services/upload.ts](file://apps/web/src/services/upload.ts#L19-L26) | `19` | `26` |
| `fetchTimeout` | `function` | [apps/web/src/services/upload.ts](file://apps/web/src/services/upload.ts#L28-L41) | `28` | `41` |
| `uploadFile` | `function` | [apps/web/src/services/upload.ts](file://apps/web/src/services/upload.ts#L43-L72) | `43` | `72` |
| `ocrImageUrl` | `function` | [apps/web/src/services/upload.ts](file://apps/web/src/services/upload.ts#L77-L117) | `77` | `117` |
| `num` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L11-L11) | `11` | `11` |
| `poPendingReassign` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L28-L30) | `28` | `30` |
| `poOpenQty` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L15-L18) | `15` | `18` |
| `statusAfter` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L32-L37) | `32` | `37` |
| `itemPriceTrack` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L321-L331) | `321` | `331` |
| `monthAxis` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L103-L131) | `103` | `131` |
| `monthKeyOfDate` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L47-L49) | `47` | `49` |
| `shiftMonthKey` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L55-L60) | `55` | `60` |
| `rebindLegacyMonthSeries` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L212-L242) | `212` | `242` |
| `fmtMonthRange` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L253-L259) | `253` | `259` |
| `sameName` | `function` | [apps/web/src/utils/names.ts](file://apps/web/src/utils/names.ts#L5-L7) | `5` | `7` |
| `num` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L43-L46) | `43` | `46` |
| `parseLegacyCap` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L48-L64) | `48` | `64` |
| `capacityOf` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L79-L97) | `79` | `97` |
| `vesselMatch` | `function` | [apps/web/src/utils/names.ts](file://apps/web/src/utils/names.ts#L10-L15) | `10` | `15` |
| `sackKgOf` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L54-L58) | `54` | `58` |
| `suggestedBaseUnit` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L62-L67) | `62` | `67` |
| `numericField` | `function` | [apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L76-L82) | `76` | `82` |
| `materialTypeLabel` | `function` | [apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L70-L74) | `70` | `74` |
| `buildUnitConversion` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L162-L203) | `162` | `203` |
| `setKopOverride` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L55-L66) | `55` | `66` |
| `loadRenderModel` | `function` | [services/api/src/pdf/renderStore.ts](file://services/api/src/pdf/renderStore.ts#L130-L160) | `130` | `160` |
| `readFilters` | `function` | [services/api/src/routes/pdf.ts](file://services/api/src/routes/pdf.ts#L277-L286) | `277` | `286` |
| `applyKopSetting` | `function` | [services/api/src/routes/pdf.ts](file://services/api/src/routes/pdf.ts#L38-L43) | `38` | `43` |
| `entityBranch` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L177-L181) | `177` | `181` |
| `uploadsRoot` | `function` | [services/api/src/routes/files.ts](file://services/api/src/routes/files.ts#L102-L105) | `102` | `105` |
| `hasMagic` | `function` | [services/api/src/routes/files.ts](file://services/api/src/routes/files.ts#L16-L46) | `16` | `46` |
| `scanContent` | `function` | [services/api/src/routes/files.ts](file://services/api/src/routes/files.ts#L50-L100) | `50` | `100` |
| `isPrivateFile` | `function` | [services/api/src/routes/files.ts](file://services/api/src/routes/files.ts#L109-L126) | `109` | `126` |
| `saveAttachment` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L97-L112) | `97` | `112` |
| `cancelLoan` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L83-L88) | `83` | `88` |
| `finishMaint` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L89-L94) | `89` | `94` |
| `returnLoan` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L76-L81) | `76` | `81` |
| `saveMaint` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L62-L75) | `62` | `75` |
| `saveLoan` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L50-L61) | `50` | `61` |
| `set` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L671-L674) | `671` | `674` |
| `amt` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L696-L708) | `696` | `708` |
| `txt` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L684-L695) | `684` | `695` |
| `save` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L676-L682) | `676` | `682` |
| `leaveUsedByEmployee` | `function` | [apps/web/src/utils/leaveBalance.ts](file://apps/web/src/utils/leaveBalance.ts#L6-L14) | `6` | `14` |
| `visit` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L228-L233) | `228` | `233` |
| `filterNode` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L164-L193) | `164` | `193` |
| `expandAll` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L226-L236) | `226` | `236` |
| `collapseAll` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L238-L240) | `238` | `240` |
| `toggleExpand` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L214-L224) | `214` | `224` |
| `parseRupiah` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L83-L87) | `83` | `87` |
| `sanitizeMoneyInput` | `function` | [apps/web/scripts/money-probe.ts](file://apps/web/scripts/money-probe.ts#L26-L28) | `26` | `28` |
| `assert` | `function` | [apps/web/scripts/money-probe.ts](file://apps/web/scripts/money-probe.ts#L9-L16) | `9` | `16` |
| `formatMoneyDisplay` | `function` | [apps/web/scripts/money-probe.ts](file://apps/web/scripts/money-probe.ts#L19-L23) | `19` | `23` |
| `run` | `function` | [apps/web/scripts/money-probe.ts](file://apps/web/scripts/money-probe.ts#L30-L74) | `30` | `74` |
| `assert` | `function` | [services/api/scripts/cache-probe.ts](file://services/api/scripts/cache-probe.ts#L13-L16) | `13` | `16` |
| `headersFor` | `function` | [services/api/scripts/cache-probe.ts](file://services/api/scripts/cache-probe.ts#L17-L20) | `17` | `20` |
| `cacheStats` | `function` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L79-L81) | `79` | `81` |
| `cacheClear` | `function` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L84-L89) | `84` | `89` |
| `main` | `function` | [services/api/scripts/cache-probe.ts](file://services/api/scripts/cache-probe.ts#L8-L64) | `8` | `64` |
| `login` | `function` | [services/api/scripts/demo-roles-probe.ts](file://services/api/scripts/demo-roles-probe.ts#L74-L74) | `74` | `74` |
| `sw` | `function` | [services/api/scripts/demo-roles-probe.ts](file://services/api/scripts/demo-roles-probe.ts#L29-L29) | `29` | `29` |
| `assert` | `function` | [services/api/scripts/demo-roles-probe.ts](file://services/api/scripts/demo-roles-probe.ts#L16-L19) | `16` | `19` |
| `tokenOf` | `function` | [services/api/scripts/demo-roles-probe.ts](file://services/api/scripts/demo-roles-probe.ts#L20-L26) | `20` | `26` |
| `main` | `function` | [services/api/scripts/demo-roles-probe.ts](file://services/api/scripts/demo-roles-probe.ts#L11-L98) | `11` | `98` |
| `alloc` | `function` | [services/api/scripts/domain-guards-probe.ts](file://services/api/scripts/domain-guards-probe.ts#L109-L109) | `109` | `109` |
| `call` | `function` | [services/api/scripts/domain-guards-probe.ts](file://services/api/scripts/domain-guards-probe.ts#L20-L23) | `20` | `23` |
| `assert` | `function` | [services/api/scripts/domain-guards-probe.ts](file://services/api/scripts/domain-guards-probe.ts#L14-L17) | `14` | `17` |
| `jumlah` | `function` | [services/api/scripts/domain-guards-probe.ts](file://services/api/scripts/domain-guards-probe.ts#L137-L137) | `137` | `137` |
| `main` | `function` | [services/api/scripts/domain-guards-probe.ts](file://services/api/scripts/domain-guards-probe.ts#L9-L177) | `9` | `177` |
| `write` | `function` | [services/api/scripts/events-probe.ts](file://services/api/scripts/events-probe.ts#L48-L48) | `48` | `48` |
| `listen` | `function` | [services/api/scripts/events-probe.ts](file://services/api/scripts/events-probe.ts#L24-L46) | `24` | `46` |
| `assert` | `function` | [services/api/scripts/events-probe.ts](file://services/api/scripts/events-probe.ts#L15-L18) | `15` | `18` |
| `tokenFor` | `function` | [services/api/scripts/events-probe.ts](file://services/api/scripts/events-probe.ts#L19-L22) | `19` | `22` |
| `main` | `function` | [services/api/scripts/events-probe.ts](file://services/api/scripts/events-probe.ts#L7-L68) | `7` | `68` |
| `checkGeometry` | `function` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L304-L328) | `304` | `328` |
| `ok` | `function` | [services/api/scripts/pdf-probe.ts](file://services/api/scripts/pdf-probe.ts#L58-L66) | `58` | `66` |
| `knownTables` | `function` | [services/api/scripts/pdf-probe.ts](file://services/api/scripts/pdf-probe.ts#L361-L371) | `361` | `371` |
| `registryIntegrity` | `function` | [services/api/scripts/pdf-probe.ts](file://services/api/scripts/pdf-probe.ts#L906-L950) | `906` | `950` |
| `geometryCheck` | `function` | [services/api/scripts/pdf-probe.ts](file://services/api/scripts/pdf-probe.ts#L72-L81) | `72` | `81` |
| `assert` | `function` | [services/api/scripts/public-leave-probe.ts](file://services/api/scripts/public-leave-probe.ts#L17-L20) | `17` | `20` |
| `tokenFor` | `function` | [services/api/scripts/public-leave-probe.ts](file://services/api/scripts/public-leave-probe.ts#L21-L24) | `21` | `24` |
| `submit` | `function` | [services/api/scripts/public-leave-probe.ts](file://services/api/scripts/public-leave-probe.ts#L29-L32) | `29` | `32` |
| `check` | `function` | [services/api/scripts/public-leave-probe.ts](file://services/api/scripts/public-leave-probe.ts#L50-L50) | `50` | `50` |
| `main` | `function` | [services/api/scripts/public-leave-probe.ts](file://services/api/scripts/public-leave-probe.ts#L12-L108) | `12` | `108` |
| `login` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L162-L176) | `162` | `176` |
| `measureLogin` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L483-L487) | `483` | `487` |
| `record` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L47-L70) | `47` | `70` |
| `isSingleActiveBranchConfig` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L72-L93) | `72` | `93` |
| `main` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L95-L912) | `95` | `912` |
| `auth` | `function` | [services/api/scripts/team-scope-probe.ts](file://services/api/scripts/team-scope-probe.ts#L16-L16) | `16` | `16` |
| `assert` | `function` | [services/api/scripts/team-scope-probe.ts](file://services/api/scripts/team-scope-probe.ts#L11-L14) | `11` | `14` |
| `userOf` | `function` | [services/api/scripts/team-scope-probe.ts](file://services/api/scripts/team-scope-probe.ts#L15-L15) | `15` | `15` |
| `ids` | `function` | [services/api/scripts/team-scope-probe.ts](file://services/api/scripts/team-scope-probe.ts#L23-L24) | `23` | `24` |
| `main` | `function` | [services/api/scripts/team-scope-probe.ts](file://services/api/scripts/team-scope-probe.ts#L6-L40) | `6` | `40` |
| `getSecret` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L28-L31) | `28` | `31` |
| `signToken` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L41-L54) | `41` | `54` |
| `verifyToken` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L56-L70) | `56` | `70` |
| `branchOfUser` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L97-L112) | `97` | `112` |
| `requireAuth` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L144-L231) | `144` | `231` |
| `str` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L10-L10) | `10` | `10` |
| `isProjectManagerTitle` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L94-L97) | `94` | `97` |
| `projectManagerError` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L101-L112) | `101` | `112` |
| `projectFeeError` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L175-L197) | `175` | `197` |
| `transferError` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L115-L121) | `115` | `121` |
| `resolve` | `function` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L423-L429) | `423` | `429` |
| `resolveSqlitePath` | `function` | [services/api/src/restore.ts](file://services/api/src/restore.ts#L23-L26) | `23` | `26` |
| `runMysqlRestore` | `function` | [services/api/src/restore.ts](file://services/api/src/restore.ts#L28-L58) | `28` | `58` |
| `argValue` | `function` | [services/api/src/restore.ts](file://services/api/src/restore.ts#L15-L21) | `15` | `21` |
| `main` | `function` | [services/api/src/restore.ts](file://services/api/src/restore.ts#L60-L100) | `60` | `100` |
| `readOrigin` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L18-L23) | `18` | `23` |
| `authHeader` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L30-L33) | `30` | `33` |
| `switchToRole` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L57-L75) | `57` | `75` |
| `isImpersonating` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L26-L28) | `26` | `28` |
| `fetchDemoRoles` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L36-L39) | `36` | `39` |
| `render` | `method` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L739-L776) | `739` | `776` |
| `componentDidUpdate` | `method` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L733-L737) | `733` | `737` |
| `componentDidCatch` | `method` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L714-L716) | `714` | `716` |
| `getDerivedStateFromError` | `method` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L710-L712) | `710` | `712` |
| `ErrorBoundary` | `class` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L697-L777) | `697` | `777` |
| `useStore` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L2797-L2801) | `2797` | `2801` |
| `fmtJumlah` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L94-L97) | `94` | `97` |
| `removeRow` | `function` | [apps/web/src/pages/proyek/WbsMaterialModal.tsx](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L77-L85) | `77` | `85` |
| `save` | `function` | [apps/web/src/pages/proyek/WbsMaterialModal.tsx](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L46-L75) | `46` | `75` |
| `WbsMaterialModal` | `function` | [apps/web/src/pages/proyek/WbsMaterialModal.tsx](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L30-L136) | `30` | `136` |
| `round3` | `function` | [apps/web/src/utils/stockIssue.ts](file://apps/web/src/utils/stockIssue.ts#L14-L14) | `14` | `14` |
| `totalBase` | `function` | [apps/web/src/utils/stockIssue.ts](file://apps/web/src/utils/stockIssue.ts#L16-L18) | `16` | `18` |
| `issueBase` | `function` | [apps/web/src/utils/stockIssue.ts](file://apps/web/src/utils/stockIssue.ts#L23-L34) | `23` | `34` |
| `plateCutKg` | `function` | [apps/web/src/utils/stockIssue.ts](file://apps/web/src/utils/stockIssue.ts#L37-L44) | `37` | `44` |
| `useStockIssue` | `function` | [apps/web/src/data/useStockIssue.ts](file://apps/web/src/data/useStockIssue.ts#L19-L46) | `19` | `46` |
| `isEnvelope` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L126-L128) | `126` | `128` |
| `apiFetchRaw` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L200-L256) | `200` | `256` |
| `envelopeCode` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L114-L119) | `114` | `119` |
| `envelopeMessage` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L130-L136) | `130` | `136` |
| `envelopeData` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L121-L124) | `121` | `124` |
| `docAttachment` | `function` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L62-L82) | `62` | `82` |
| `read` | `function` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L66-L71) | `66` | `71` |
| `nameFromUrl` | `function` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L95-L99) | `95` | `99` |
| `docFileNameOf` | `function` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L90-L92) | `90` | `92` |
| `docUrlOf` | `function` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L85-L87) | `85` | `87` |
| `sanitizeCell` | `function` | [apps/web/src/utils/export.ts](file://apps/web/src/utils/export.ts#L8-L11) | `8` | `11` |
| `cleanSheetName` | `function` | [apps/web/src/utils/export.ts](file://apps/web/src/utils/export.ts#L50-L52) | `50` | `52` |
| `normalizeCell` | `function` | [apps/web/src/utils/export.ts](file://apps/web/src/utils/export.ts#L15-L19) | `15` | `19` |
| `exportExcel` | `function` | [apps/web/src/utils/export.ts](file://apps/web/src/utils/export.ts#L21-L39) | `21` | `39` |
| `exportExcelSheets` | `function` | [apps/web/src/utils/export.ts](file://apps/web/src/utils/export.ts#L56-L82) | `56` | `82` |
| `todayISO` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L93-L96) | `93` | `96` |
| `isStamp` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L488-L490) | `488` | `490` |
| `normalizeItems` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L502-L513) | `502` | `513` |
| `makeCtx` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L475-L482) | `475` | `482` |
| `buildModuleAlertItemsFor` | `function` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L583-L585) | `583` | `585` |
| `parseStamp` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L48-L55) | `48` | `55` |
| `asComparable` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L33-L37) | `33` | `37` |
| `lastTouchedAt` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L102-L109) | `102` | `109` |
| `updatedAtOf` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L69-L71) | `69` | `71` |
| `updatedAtRaw` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L74-L77) | `74` | `77` |
| `chartHeight` | `function` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L262-L276) | `262` | `276` |
| `isHbar` | `function` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L281-L283) | `281` | `283` |
| `isDonut` | `function` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L278-L280) | `278` | `280` |
| `planChartHeight` | `function` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L238-L240) | `238` | `240` |
| `chartBlock` | `function` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L884-L904) | `884` | `904` |
| `approve` | `function` | [apps/web/src/pages/procurement/ServiceApprovalsTab.tsx](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L44-L49) | `44` | `49` |
| `boqName` | `function` | [apps/web/src/pages/procurement/ServiceApprovalsTab.tsx](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L39-L42) | `39` | `42` |
| `apvTone` | `function` | [apps/web/src/pages/procurement/ServiceApprovalsTab.tsx](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L60-L60) | `60` | `60` |
| `confirmReject` | `function` | [apps/web/src/pages/procurement/ServiceApprovalsTab.tsx](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L50-L59) | `50` | `59` |
| `ServiceApprovalsTab` | `function` | [apps/web/src/pages/procurement/ServiceApprovalsTab.tsx](file://apps/web/src/pages/procurement/ServiceApprovalsTab.tsx#L16-L154) | `16` | `154` |
| `post` | `function` | [apps/web/src/pages/publik/CutiQr.tsx](file://apps/web/src/pages/publik/CutiQr.tsx#L15-L16) | `15` | `16` |
| `lookup` | `function` | [apps/web/src/pages/publik/CutiQr.tsx](file://apps/web/src/pages/publik/CutiQr.tsx#L50-L61) | `50` | `61` |
| `toBase64` | `function` | [apps/web/src/pages/publik/CutiQr.tsx](file://apps/web/src/pages/publik/CutiQr.tsx#L18-L23) | `18` | `23` |
| `submit` | `function` | [apps/web/src/pages/publik/CutiQr.tsx](file://apps/web/src/pages/publik/CutiQr.tsx#L63-L81) | `63` | `81` |
| `CutiQr` | `function` | [apps/web/src/pages/publik/CutiQr.tsx](file://apps/web/src/pages/publik/CutiQr.tsx#L25-L146) | `25` | `146` |
| `tagOf` | `function` | [services/api/src/routes/apiDocs.ts](file://services/api/src/routes/apiDocs.ts#L54-L58) | `54` | `58` |
| `buildOpenApi` | `function` | [services/api/src/routes/apiDocs.ts](file://services/api/src/routes/apiDocs.ts#L107-L135) | `107` | `135` |
| `operation` | `function` | [services/api/src/routes/apiDocs.ts](file://services/api/src/routes/apiDocs.ts#L60-L105) | `60` | `105` |
| `ok` | `function` | [services/api/src/routes/apiDocs.ts](file://services/api/src/routes/apiDocs.ts#L49-L49) | `49` | `49` |
| `registerApiDocs` | `function` | [services/api/src/routes/apiDocs.ts](file://services/api/src/routes/apiDocs.ts#L137-L142) | `137` | `142` |
| `run` | `function` | [apps/web/scripts/auth-cache-probe.ts](file://apps/web/scripts/auth-cache-probe.ts#L18-L57) | `18` | `57` |
| `clearIsmsLocalStorage` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L165-L180) | `165` | `180` |
| `purgeOfflineCache` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L185-L188) | `185` | `188` |
| `assert` | `function` | [apps/web/scripts/auth-cache-probe.ts](file://apps/web/scripts/auth-cache-probe.ts#L9-L16) | `9` | `16` |
| `docRow` | `function` | [services/api/scripts/boq-docs-probe.ts](file://services/api/scripts/boq-docs-probe.ts#L43-L46) | `43` | `46` |
| `assert` | `function` | [services/api/scripts/boq-docs-probe.ts](file://services/api/scripts/boq-docs-probe.ts#L13-L16) | `13` | `16` |
| `call` | `function` | [services/api/scripts/boq-docs-probe.ts](file://services/api/scripts/boq-docs-probe.ts#L26-L27) | `26` | `27` |
| `main` | `function` | [services/api/scripts/boq-docs-probe.ts](file://services/api/scripts/boq-docs-probe.ts#L8-L95) | `8` | `95` |
| `create` | `function` | [services/api/scripts/drydock-booking-probe.ts](file://services/api/scripts/drydock-booking-probe.ts#L46-L61) | `46` | `61` |
| `assert` | `function` | [services/api/scripts/drydock-booking-probe.ts](file://services/api/scripts/drydock-booking-probe.ts#L29-L33) | `29` | `33` |
| `witaDate` | `function` | [services/api/scripts/drydock-booking-probe.ts](file://services/api/scripts/drydock-booking-probe.ts#L8-L14) | `8` | `14` |
| `main` | `function` | [services/api/scripts/drydock-booking-probe.ts](file://services/api/scripts/drydock-booking-probe.ts#L16-L160) | `16` | `160` |
| `issue` | `function` | [services/api/scripts/inventory-issue-probe.ts](file://services/api/scripts/inventory-issue-probe.ts#L24-L24) | `24` | `24` |
| `assert` | `function` | [services/api/scripts/inventory-issue-probe.ts](file://services/api/scripts/inventory-issue-probe.ts#L12-L15) | `12` | `15` |
| `stateOf` | `function` | [services/api/scripts/inventory-issue-probe.ts](file://services/api/scripts/inventory-issue-probe.ts#L25-L25) | `25` | `25` |
| `main` | `function` | [services/api/scripts/inventory-issue-probe.ts](file://services/api/scripts/inventory-issue-probe.ts#L7-L47) | `7` | `47` |
| `patch` | `function` | [services/api/scripts/wo-spk-probe.ts](file://services/api/scripts/wo-spk-probe.ts#L30-L30) | `30` | `30` |
| `assert` | `function` | [services/api/scripts/wo-spk-probe.ts](file://services/api/scripts/wo-spk-probe.ts#L12-L15) | `12` | `15` |
| `tokenOf` | `function` | [services/api/scripts/wo-spk-probe.ts](file://services/api/scripts/wo-spk-probe.ts#L16-L20) | `16` | `20` |
| `main` | `function` | [services/api/scripts/wo-spk-probe.ts](file://services/api/scripts/wo-spk-probe.ts#L7-L47) | `7` | `47` |
| `requestIp` | `function` | [services/api/src/audit.ts](file://services/api/src/audit.ts#L52-L60) | `52` | `60` |
| `round3` | `function` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L15-L15) | `15` | `15` |
| `issueInventory` | `function` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L28-L87) | `28` | `87` |
| `registerInventoryIssueRoutes` | `function` | [services/api/src/routes/inventoryIssue.ts](file://services/api/src/routes/inventoryIssue.ts#L17-L32) | `17` | `32` |
| `closeDb` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L236-L245) | `236` | `245` |
| `findDuplicates` | `function` | [services/api/src/auditDuplicates.ts](file://services/api/src/auditDuplicates.ts#L48-L72) | `48` | `72` |
| `pickString` | `function` | [services/api/src/auditDuplicates.ts](file://services/api/src/auditDuplicates.ts#L43-L46) | `43` | `46` |
| `main` | `function` | [services/api/src/auditDuplicates.ts](file://services/api/src/auditDuplicates.ts#L74-L114) | `74` | `114` |
| `exec` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L95-L97) | `95` | `97` |
| `noteWrite` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L84-L93) | `84` | `93` |
| `execRaw` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L99-L115) | `99` | `115` |
| `ensureMysql` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L54-L60) | `54` | `60` |
| `photoUrls` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L24-L25) | `24` | `25` |
| `withoutRole` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L20-L20) | `20` | `20` |
| `keepsRecord` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L27-L34) | `27` | `34` |
| `wbsRuleError` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L42-L65) | `42` | `65` |
| `asRecord` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L41-L45) | `41` | `45` |
| `positiveNumber` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L26-L29) | `26` | `29` |
| `effectiveConversionFingerprint` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L56-L73) | `56` | `73` |
| `stableJson` | `function` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L47-L54) | `47` | `54` |
| `newId` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L71-L73) | `71` | `73` |
| `insert` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L75-L79) | `75` | `79` |
| `issueFromStock` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L82-L99) | `82` | `99` |
| `requestMaterial` | `function` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L101-L181) | `101` | `181` |
| `migrate` | `function` | [services/api/src/migrate.ts](file://services/api/src/migrate.ts#L29-L124) | `29` | `124` |
| `checksumOf` | `function` | [services/api/src/migrate.ts](file://services/api/src/migrate.ts#L7-L9) | `7` | `9` |
| `ensureWideJsonColumns` | `function` | [services/api/src/migrate.ts](file://services/api/src/migrate.ts#L153-L173) | `153` | `173` |
| `isIgnorableMigrationError` | `function` | [services/api/src/migrate.ts](file://services/api/src/migrate.ts#L11-L27) | `11` | `27` |
| `normalizeRole` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L48-L67) | `48` | `67` |
| `permissionsFor` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L381-L384) | `381` | `384` |
| `issueDemoToken` | `function` | [services/api/src/routes/demoSwitch.ts](file://services/api/src/routes/demoSwitch.ts#L50-L76) | `50` | `76` |
| `roleRank` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L69-L72) | `69` | `72` |
| `write` | `function` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L138-L144) | `138` | `144` |
| `n` | `function` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L96-L100) | `96` | `100` |
| `deriveDays` | `function` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L113-L136) | `113` | `136` |
| `main` | `function` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L146-L358) | `146` | `358` |
| `pick` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L22-L22) | `22` | `22` |
| `put` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L41-L43) | `41` | `43` |
| `pad` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L24-L24) | `24` | `24` |
| `build` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L39-L417) | `39` | `417` |
| `int` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L23-L23) | `23` | `23` |
| `iso` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L25-L26) | `25` | `26` |
| `bump` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L441-L446) | `441` | `446` |
| `main` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L419-L504) | `419` | `504` |
| `approvalOf` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L33-L36) | `33` | `36` |
| `wbsTaskError` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L58-L65) | `58` | `65` |
| `boqPrice` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L67-L74) | `67` | `74` |
| `serviceGuardError` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L77-L109) | `77` | `109` |
| `notifRowId` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L33-L35) | `33` | `35` |
| `firstPresent` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L72-L78) | `72` | `78` |
| `clearTimers` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L66-L69) | `66` | `69` |
| `useNotifFlash` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L52-L118) | `52` | `118` |
| `loadModSeen` | `function` | [apps/web/src/utils/notifRead.ts](file://apps/web/src/utils/notifRead.ts#L31-L46) | `31` | `46` |
| `saveModSeen` | `function` | [apps/web/src/utils/notifRead.ts](file://apps/web/src/utils/notifRead.ts#L48-L56) | `48` | `56` |
| `notifyModSeen` | `function` | [apps/web/src/utils/notifRead.ts](file://apps/web/src/utils/notifRead.ts#L58-L60) | `58` | `60` |
| `useModuleAlert` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L413-L438) | `413` | `438` |
| `formatTime` | `function` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L39-L48) | `39` | `48` |
| `displayValue` | `function` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L28-L37) | `28` | `37` |
| `changesOf` | `function` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L19-L26) | `19` | `26` |
| `ChangeHistory` | `function` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L62-L204) | `62` | `204` |
| `num` | `function` | [apps/web/src/components/ClientModal.tsx](file://apps/web/src/components/ClientModal.tsx#L40-L40) | `40` | `40` |
| `setF` | `function` | [apps/web/src/components/ClientModal.tsx](file://apps/web/src/components/ClientModal.tsx#L33-L33) | `33` | `33` |
| `save` | `function` | [apps/web/src/components/ClientModal.tsx](file://apps/web/src/components/ClientModal.tsx#L35-L65) | `35` | `65` |
| `ClientModal` | `function` | [apps/web/src/components/ClientModal.tsx](file://apps/web/src/components/ClientModal.tsx#L13-L117) | `13` | `117` |
| `toggle` | `function` | [apps/web/src/components/FlowTree.tsx](file://apps/web/src/components/FlowTree.tsx#L96-L96) | `96` | `96` |
| `allIds` | `function` | [apps/web/src/components/FlowTree.tsx](file://apps/web/src/components/FlowTree.tsx#L97-L97) | `97` | `97` |
| `Branch` | `function` | [apps/web/src/components/FlowTree.tsx](file://apps/web/src/components/FlowTree.tsx#L27-L89) | `27` | `89` |
| `FlowTree` | `function` | [apps/web/src/components/FlowTree.tsx](file://apps/web/src/components/FlowTree.tsx#L92-L107) | `92` | `107` |
| `updateCaption` | `function` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L119-L123) | `119` | `123` |
| `addFiles` | `function` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L71-L117) | `71` | `117` |
| `removePhoto` | `function` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L125-L129) | `125` | `129` |
| `PhotoUploader` | `function` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L28-L196) | `28` | `196` |
| `stripLeadingZero` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1659-L1664) | `1659` | `1664` |
| `clean` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1680-L1685) | `1680` | `1685` |
| `block` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1669-L1679) | `1669` | `1679` |
| `NumInput` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1668-L1695) | `1668` | `1695` |
| `isBackendUrl` | `function` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L22-L24) | `22` | `24` |
| `absUrl` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1846-L1848) | `1846` | `1848` |
| `loadSecureBlob` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1856-L1874) | `1856` | `1874` |
| `SecureImg` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1878-L1932) | `1878` | `1932` |
| `majorOf` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L960-L966) | `960` | `966` |
| `notifyVersionBlocked` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L976-L989) | `976` | `989` |
| `minorOf` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L968-L974) | `968` | `974` |
| `isApiCompatible` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L1000-L1022) | `1000` | `1022` |
| `remote` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L49-L49) | `49` | `49` |
| `poIsMultiItem` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L21-L25) | `21` | `25` |
| `prIdsOf` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L39-L40) | `39` | `40` |
| `usePoActions` | `function` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L47-L302) | `47` | `302` |
| `deleteDateOf` | `function` | [apps/web/src/utils/audit.ts](file://apps/web/src/utils/audit.ts#L58-L71) | `58` | `71` |
| `cacheKey` | `function` | [apps/web/src/utils/audit.ts](file://apps/web/src/utils/audit.ts#L24-L24) | `24` | `24` |
| `fetchDeleteDate` | `function` | [apps/web/src/utils/audit.ts](file://apps/web/src/utils/audit.ts#L36-L51) | `36` | `51` |
| `deleteDatesOf` | `function` | [apps/web/src/utils/audit.ts](file://apps/web/src/utils/audit.ts#L77-L88) | `77` | `88` |
| `legacyNoteOf` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L228-L234) | `228` | `234` |
| `deadReasonOf` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L138-L141) | `138` | `141` |
| `deadCodeOf` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L147-L158) | `147` | `158` |
| `deadStockRows` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L202-L225) | `202` | `225` |
| `parseISO` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L8-L13) | `8` | `13` |
| `fmtTanggal` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L16-L23) | `16` | `23` |
| `fmtBulan` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L42-L46) | `42` | `46` |
| `fmtRentang` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L49-L59) | `49` | `59` |
| `warnLevelOf` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L153-L179) | `153` | `179` |
| `warnRankOf` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L303-L312) | `303` | `312` |
| `katalogBadge` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L292-L295) | `292` | `295` |
| `needsAction` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L182-L185) | `182` | `185` |
| `stableSortRows` | `function` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L41-L64) | `41` | `64` |
| `blank` | `function` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L49-L49) | `49` | `49` |
| `compareStableTieBreaker` | `function` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L27-L35) | `27` | `35` |
| `reconcileListAfterEdit` | `function` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L78-L128) | `78` | `128` |
| `calcProjectProgress` | `function` | [apps/web/src/utils/projectProgress.ts](file://apps/web/src/utils/projectProgress.ts#L38-L78) | `38` | `78` |
| `matchBoqToTask` | `function` | [apps/web/src/utils/projectProgress.ts](file://apps/web/src/utils/projectProgress.ts#L13-L20) | `13` | `20` |
| `boqItemValue` | `function` | [apps/web/src/utils/projectProgress.ts](file://apps/web/src/utils/projectProgress.ts#L25-L30) | `25` | `30` |
| `projectProgressOf` | `function` | [apps/web/src/utils/projectProgress.ts](file://apps/web/src/utils/projectProgress.ts#L84-L96) | `84` | `96` |
| `existingId` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L88-L97) | `88` | `97` |
| `impactFromWeight` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L70-L74) | `70` | `74` |
| `daysUntilMonthEnd` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L43-L49) | `43` | `49` |
| `generateRisksFromWbs` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L119-L190) | `119` | `190` |
| `likelihoodFromDays` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L63-L67) | `63` | `67` |
| `hasExisting` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L77-L85) | `77` | `85` |
| `daysUntilDate` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L52-L60) | `52` | `60` |
| `generateRisksFromWo` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L202-L271) | `202` | `271` |
| `toMinutes` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L49-L53) | `49` | `53` |
| `cmpJam` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L56-L61) | `56` | `61` |
| `durasiJam` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L94-L100) | `94` | `100` |
| `jamOf` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L103-L106) | `103` | `106` |
| `isStamp` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L17-L19) | `17` | `19` |
| `createdAtOf` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L58-L60) | `58` | `60` |
| `createdAtRaw` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L63-L66) | `63` | `66` |
| `stampCreated` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L84-L88) | `84` | `88` |
| `normalizedCategory` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L69-L71) | `69` | `71` |
| `conversionRuleForCategory` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L83-L85) | `83` | `85` |
| `purchaseUnitsForCategory` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L87-L95) | `87` | `95` |
| `defaultPurchaseUnitForCategory` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L97-L102) | `97` | `102` |
| `hasUnitConversionDraft` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L104-L113) | `104` | `113` |
| `eceranEnabled` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L132-L134) | `132` | `134` |
| `unitConversionRequired` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L115-L121) | `115` | `121` |
| `unitConversionRequiredForEdit` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L137-L159) | `137` | `159` |
| `movementFlow` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L214-L262) | `214` | `262` |
| `movementTouchesWh` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L274-L278) | `274` | `278` |
| `movementFromWh` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L265-L267) | `265` | `267` |
| `movementToWh` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L269-L271) | `269` | `271` |
| `push` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L120-L125) | `120` | `125` |
| `woMilestonesOf` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L32-L53) | `32` | `53` |
| `terminMilestoneOptions` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L114-L136) | `114` | `136` |
| `woMilestoneByTitle` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L102-L104) | `102` | `104` |
| `loadMany` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L223-L241) | `223` | `241` |
| `inCtx` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L77-L83) | `77` | `83` |
| `loadAll` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L976-L978) | `976` | `978` |
| `loadReportCols` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L981-L987) | `981` | `987` |
| `parseLimit` | `function` | [services/api/src/routes/audit.ts](file://services/api/src/routes/audit.ts#L18-L22) | `18` | `22` |
| `parseDiff` | `function` | [services/api/src/routes/audit.ts](file://services/api/src/routes/audit.ts#L30-L36) | `30` | `36` |
| `parseOffset` | `function` | [services/api/src/routes/audit.ts](file://services/api/src/routes/audit.ts#L24-L28) | `24` | `28` |
| `registerAuditRoutes` | `function` | [services/api/src/routes/audit.ts](file://services/api/src/routes/audit.ts#L38-L92) | `38` | `92` |
| `drydockDay` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L263-L268) | `263` | `268` |
| `witaTodayDay` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L270-L275) | `270` | `275` |
| `drydockDateError` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L277-L287) | `277` | `287` |
| `normalizeDrydockOffsets` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L301-L307) | `301` | `307` |
| `flagOn` | `function` | [services/api/src/routes/demoSwitch.ts](file://services/api/src/routes/demoSwitch.ts#L25-L28) | `25` | `28` |
| `demoSwitchEnabled` | `function` | [services/api/src/routes/demoSwitch.ts](file://services/api/src/routes/demoSwitch.ts#L29-L31) | `29` | `31` |
| `demoLoginEnabled` | `function` | [services/api/src/routes/demoSwitch.ts](file://services/api/src/routes/demoSwitch.ts#L83-L85) | `83` | `85` |
| `registerDemoSwitchRoutes` | `function` | [services/api/src/routes/demoSwitch.ts](file://services/api/src/routes/demoSwitch.ts#L88-L136) | `88` | `136` |
| `runOcr` | `function` | [services/api/src/routes/ocr.ts](file://services/api/src/routes/ocr.ts#L41-L56) | `41` | `56` |
| `tesseractAvailable` | `function` | [services/api/src/routes/ocr.ts](file://services/api/src/routes/ocr.ts#L35-L39) | `35` | `39` |
| `extOf` | `function` | [services/api/src/routes/ocr.ts](file://services/api/src/routes/ocr.ts#L30-L33) | `30` | `33` |
| `registerOcrRoutes` | `function` | [services/api/src/routes/ocr.ts](file://services/api/src/routes/ocr.ts#L58-L114) | `58` | `114` |
| `setValue` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L54-L58) | `54` | `58` |
| `activeEmployee` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L85-L95) | `85` | `95` |
| `issueQr` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L79-L84) | `79` | `84` |
| `registerPublicLeaveRoutes` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L114-L203) | `114` | `203` |
| `register` | `function` | [apps/web/src/pages/absensi/DeviceImport.tsx](file://apps/web/src/pages/absensi/DeviceImport.tsx#L51-L57) | `51` | `57` |
| `importCsv` | `function` | [apps/web/src/pages/absensi/DeviceImport.tsx](file://apps/web/src/pages/absensi/DeviceImport.tsx#L35-L49) | `35` | `49` |
| `parsePunchCsv` | `function` | [apps/web/src/pages/absensi/DeviceImport.tsx](file://apps/web/src/pages/absensi/DeviceImport.tsx#L15-L25) | `15` | `25` |
| `DeviceImport` | `function` | [apps/web/src/pages/absensi/DeviceImport.tsx](file://apps/web/src/pages/absensi/DeviceImport.tsx#L27-L72) | `27` | `72` |
| `start` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L204-L243) | `204` | `243` |
| `tick` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L222-L238) | `222` | `238` |
| `getBarcodeDetector` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L183-L185) | `183` | `185` |
| `ScanModal` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L188-L266) | `188` | `266` |
| `thumbs` | `function` | [apps/web/src/pages/proyek/WbsTree.tsx](file://apps/web/src/pages/proyek/WbsTree.tsx#L43-L52) | `43` | `52` |
| `taskNode` | `function` | [apps/web/src/pages/proyek/WbsTree.tsx](file://apps/web/src/pages/proyek/WbsTree.tsx#L61-L96) | `61` | `96` |
| `phaseOf` | `function` | [apps/web/src/pages/proyek/WbsTree.tsx](file://apps/web/src/pages/proyek/WbsTree.tsx#L33-L36) | `33` | `36` |
| `WbsTree` | `function` | [apps/web/src/pages/proyek/WbsTree.tsx](file://apps/web/src/pages/proyek/WbsTree.tsx#L38-L121) | `38` | `121` |
| `setLevels` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L134-L139) | `134` | `139` |
| `resolveParentKode` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L47-L95) | `47` | `95` |
| `determineCoaType` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L31-L44) | `31` | `44` |
| `buildCoaTree` | `function` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L98-L144) | `98` | `144` |
| `mark` | `function` | [services/api/scripts/gen-bruno.ts](file://services/api/scripts/gen-bruno.ts#L77-L77) | `77` | `77` |
| `walk` | `function` | [services/api/scripts/gen-bruno.ts](file://services/api/scripts/gen-bruno.ts#L137-L146) | `137` | `146` |
| `envVars` | `function` | [services/api/scripts/gen-bruno.ts](file://services/api/scripts/gen-bruno.ts#L72-L72) | `72` | `72` |
| `main` | `function` | [services/api/scripts/gen-bruno.ts](file://services/api/scripts/gen-bruno.ts#L51-L164) | `51` | `164` |
| `parse` | `function` | [services/api/scripts/relations-probe.ts](file://services/api/scripts/relations-probe.ts#L32-L32) | `32` | `32` |
| `assert` | `function` | [services/api/scripts/relations-probe.ts](file://services/api/scripts/relations-probe.ts#L16-L19) | `16` | `19` |
| `call` | `function` | [services/api/scripts/relations-probe.ts](file://services/api/scripts/relations-probe.ts#L25-L26) | `25` | `26` |
| `main` | `function` | [services/api/scripts/relations-probe.ts](file://services/api/scripts/relations-probe.ts#L11-L96) | `11` | `96` |
| `poKeyOf` | `function` | [services/api/src/poPayable.ts](file://services/api/src/poPayable.ts#L21-L24) | `21` | `24` |
| `payableOf` | `function` | [services/api/src/poPayable.ts](file://services/api/src/poPayable.ts#L26-L33) | `26` | `33` |
| `addDays` | `function` | [services/api/src/poPayable.ts](file://services/api/src/poPayable.ts#L35-L38) | `35` | `38` |
| `ensurePayableOnApproval` | `function` | [services/api/src/poPayable.ts](file://services/api/src/poPayable.ts#L41-L59) | `41` | `59` |
| `readXlsxRows` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L64-L91) | `64` | `91` |
| `decodeXml` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L46-L50) | `46` | `50` |
| `colIndex` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L57-L62) | `57` | `62` |
| `textOf` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L53-L54) | `53` | `54` |
| `listWhere` | `function` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L68-L69) | `68` | `69` |
| `getRow` | `function` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L66-L67) | `66` | `67` |
| `authOf` | `function` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L62-L63) | `62` | `63` |
| `registerRelations` | `function` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L65-L156) | `65` | `156` |
| `normalize` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L19-L27) | `19` | `27` |
| `existsSync` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L31-L31) | `31` | `31` |
| `dirname` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L30-L30) | `30` | `30` |
| `resolve` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L44-L49) | `44` | `49` |
| `read` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L29-L29) | `29` | `29` |
| `listIn` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L37-L40) | `37` | `40` |
| `usedBy` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L65-L85) | `65` | `85` |
| `syncedBy` | `function` | [apps/web/src/data/__tests__/moduleSyncCoverage.test.ts](file://apps/web/src/data/__tests__/moduleSyncCoverage.test.ts#L52-L63) | `52` | `63` |
| `init` | `function` | [apps/web/src/pages/proyek/DockPlanCard.tsx](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L24-L24) | `24` | `24` |
| `save` | `function` | [apps/web/src/pages/proyek/DockPlanCard.tsx](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L32-L43) | `32` | `43` |
| `iso` | `function` | [apps/web/src/pages/proyek/DockPlanCard.tsx](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L19-L19) | `19` | `19` |
| `DockPlanCard` | `function` | [apps/web/src/pages/proyek/DockPlanCard.tsx](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L21-L80) | `21` | `80` |
| `apply` | `function` | [apps/web/src/utils/iconTooltips.ts](file://apps/web/src/utils/iconTooltips.ts#L12-L18) | `12` | `18` |
| `observe` | `method` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L59-L59) | `59` | `59` |
| `installIconTooltips` | `function` | [apps/web/src/utils/iconTooltips.ts](file://apps/web/src/utils/iconTooltips.ts#L20-L30) | `20` | `30` |
| `assert` | `function` | [services/api/scripts/branch-scope-probe.ts](file://services/api/scripts/branch-scope-probe.ts#L30-L39) | `30` | `39` |
| `cleanup` | `function` | [services/api/scripts/branch-scope-probe.ts](file://services/api/scripts/branch-scope-probe.ts#L343-L350) | `343` | `350` |
| `main` | `function` | [services/api/scripts/branch-scope-probe.ts](file://services/api/scripts/branch-scope-probe.ts#L7-L367) | `7` | `367` |
| `patch` | `function` | [services/api/scripts/concurrency-probe.ts](file://services/api/scripts/concurrency-probe.ts#L20-L20) | `20` | `20` |
| `assert` | `function` | [services/api/scripts/concurrency-probe.ts](file://services/api/scripts/concurrency-probe.ts#L12-L15) | `12` | `15` |
| `main` | `function` | [services/api/scripts/concurrency-probe.ts](file://services/api/scripts/concurrency-probe.ts#L7-L46) | `7` | `46` |
| `loan` | `function` | [services/api/scripts/equipment-loan-probe.ts](file://services/api/scripts/equipment-loan-probe.ts#L21-L25) | `21` | `25` |
| `assert` | `function` | [services/api/scripts/equipment-loan-probe.ts](file://services/api/scripts/equipment-loan-probe.ts#L12-L15) | `12` | `15` |
| `main` | `function` | [services/api/scripts/equipment-loan-probe.ts](file://services/api/scripts/equipment-loan-probe.ts#L7-L48) | `7` | `48` |
| `assert` | `function` | [services/api/scripts/files-privacy-probe.ts](file://services/api/scripts/files-privacy-probe.ts#L11-L14) | `11` | `14` |
| `headersFor` | `function` | [services/api/scripts/files-privacy-probe.ts](file://services/api/scripts/files-privacy-probe.ts#L15-L18) | `15` | `18` |
| `main` | `function` | [services/api/scripts/files-privacy-probe.ts](file://services/api/scripts/files-privacy-probe.ts#L6-L50) | `6` | `50` |
| `assert` | `function` | [services/api/scripts/inventory-conversion-probe.ts](file://services/api/scripts/inventory-conversion-probe.ts#L14-L21) | `14` | `21` |
| `runHelperChecks` | `function` | [services/api/scripts/inventory-conversion-probe.ts](file://services/api/scripts/inventory-conversion-probe.ts#L37-L103) | `37` | `103` |
| `main` | `function` | [services/api/scripts/inventory-conversion-probe.ts](file://services/api/scripts/inventory-conversion-probe.ts#L243-L249) | `243` | `249` |
| `objectOf` | `function` | [services/api/scripts/inventory-conversion-probe.ts](file://services/api/scripts/inventory-conversion-probe.ts#L23-L27) | `23` | `27` |
| `runRouteChecks` | `function` | [services/api/scripts/inventory-conversion-probe.ts](file://services/api/scripts/inventory-conversion-probe.ts#L105-L241) | `105` | `241` |
| `bodyOf` | `function` | [services/api/scripts/inventory-conversion-probe.ts](file://services/api/scripts/inventory-conversion-probe.ts#L29-L35) | `29` | `35` |
| `assert` | `function` | [services/api/scripts/read-models-probe.ts](file://services/api/scripts/read-models-probe.ts#L13-L16) | `13` | `16` |
| `headersFor` | `function` | [services/api/scripts/read-models-probe.ts](file://services/api/scripts/read-models-probe.ts#L17-L20) | `17` | `20` |
| `main` | `function` | [services/api/scripts/read-models-probe.ts](file://services/api/scripts/read-models-probe.ts#L8-L69) | `8` | `69` |
| `visit` | `function` | [services/api/scripts/security-probe-isolation-probe.ts](file://services/api/scripts/security-probe-isolation-probe.ts#L15-L28) | `15` | `28` |
| `sha256` | `function` | [services/api/scripts/security-probe-isolation-probe.ts](file://services/api/scripts/security-probe-isolation-probe.ts#L9-L11) | `9` | `11` |
| `snapshotDirectory` | `function` | [services/api/scripts/security-probe-isolation-probe.ts](file://services/api/scripts/security-probe-isolation-probe.ts#L13-L31) | `13` | `31` |
| `writeAudit` | `function` | [services/api/src/audit.ts](file://services/api/src/audit.ts#L30-L45) | `30` | `45` |
| `newAuditId` | `function` | [services/api/src/audit.ts](file://services/api/src/audit.ts#L19-L21) | `19` | `21` |
| `saveRenderModel` | `function` | [services/api/src/pdf/renderStore.ts](file://services/api/src/pdf/renderStore.ts#L56-L111) | `56` | `111` |
| `hashPassword` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L33-L35) | `33` | `35` |
| `seedUsers` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L282-L382) | `282` | `382` |
| `runSeed` | `function` | [services/api/src/seed.ts](file://services/api/src/seed.ts#L8-L82) | `8` | `82` |
| `real` | `function` | [services/api/src/bookingGuard.ts](file://services/api/src/bookingGuard.ts#L23-L23) | `23` | `23` |
| `isActiveLoan` | `function` | [services/api/src/bookingGuard.ts](file://services/api/src/bookingGuard.ts#L9-L11) | `9` | `11` |
| `loanOverlapError` | `function` | [services/api/src/bookingGuard.ts](file://services/api/src/bookingGuard.ts#L14-L40) | `14` | `40` |
| `isLocked` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L54-L56) | `54` | `56` |
| `checkDocUnique` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L74-L89) | `74` | `89` |
| `boqLockError` | `function` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L96-L120) | `96` | `120` |
| `dockFitIssue` | `function` | [services/api/src/dockFit.ts](file://services/api/src/dockFit.ts#L16-L25) | `16` | `25` |
| `one` | `function` | [services/api/src/dockFit.ts](file://services/api/src/dockFit.ts#L27-L31) | `27` | `31` |
| `dockFitError` | `function` | [services/api/src/dockFit.ts](file://services/api/src/dockFit.ts#L34-L50) | `34` | `50` |
| `stages` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L23-L23) | `23` | `23` |
| `stampRole` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L70-L74) | `70` | `74` |
| `stampWbsRoles` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L77-L89) | `77` | `89` |
| `cacheGeneration` | `function` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L43-L45) | `43` | `45` |
| `sameGeneration` | `function` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L47-L49) | `47` | `49` |
| `cachePut` | `function` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L62-L77) | `62` | `77` |
| `can` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L371-L376) | `371` | `376` |
| `registerInventoryAdditionalRoutes` | `function` | [services/api/src/routes/inventoryAdditional.ts](file://services/api/src/routes/inventoryAdditional.ts#L19-L36) | `19` | `36` |
| `requireManageUsers` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L416-L425) | `416` | `425` |
| `isTrustedProxy` | `function` | [services/api/src/rateLimit.ts](file://services/api/src/rateLimit.ts#L33-L36) | `33` | `36` |
| `getClientIp` | `function` | [services/api/src/rateLimit.ts](file://services/api/src/rateLimit.ts#L38-L46) | `38` | `46` |
| `getWriteRateKey` | `function` | [services/api/src/rateLimit.ts](file://services/api/src/rateLimit.ts#L67-L80) | `67` | `80` |
| `normalizedValue` | `function` | [services/api/src/scoring.ts](file://services/api/src/scoring.ts#L14-L26) | `14` | `26` |
| `scoreChecklist` | `function` | [services/api/src/scoring.ts](file://services/api/src/scoring.ts#L28-L46) | `28` | `46` |
| `checklistHook` | `function` | [services/api/src/scoring.ts](file://services/api/src/scoring.ts#L49-L77) | `49` | `77` |
| `canApproveService` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L38-L40) | `38` | `40` |
| `setServiceApproval` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L112-L146) | `112` | `146` |
| `registerServiceApprovalRoutes` | `function` | [services/api/src/routes/serviceApproval.ts](file://services/api/src/routes/serviceApproval.ts#L16-L36) | `16` | `36` |
| `scopedProjectIds` | `function` | [services/api/src/teamScope.ts](file://services/api/src/teamScope.ts#L15-L39) | `15` | `39` |
| `rowVisibleToUser` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L359-L370) | `359` | `370` |
| `withProjectWriteScope` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L372-L386) | `372` | `386` |
| `renderIcon` | `function` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L115-L121) | `115` | `121` |
| `handleClose` | `function` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L110-L113) | `110` | `113` |
| `Alert` | `function` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L93-L165) | `93` | `165` |
| `handleConfirm` | `function` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L247-L252) | `247` | `252` |
| `handleCancel` | `function` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L242-L245) | `242` | `245` |
| `AlertModal` | `function` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L226-L295) | `226` | `295` |
| `fill` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L146-L148) | `146` | `148` |
| `ageDays` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L226-L231) | `226` | `231` |
| `AlertMeta` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L375-L384) | `375` | `384` |
| `remove` | `function` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L107-L119) | `107` | `119` |
| `notesOf` | `function` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L38-L41) | `38` | `41` |
| `ServiceNotesModal` | `function` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L74-L221) | `74` | `221` |
| `norm24` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L27-L46) | `27` | `46` |
| `fmtJam24` | `function` | [apps/web/src/utils/time24.ts](file://apps/web/src/utils/time24.ts#L73-L83) | `73` | `83` |
| `TimeInput24` | `function` | [apps/web/src/components/TimeInput24.tsx](file://apps/web/src/components/TimeInput24.tsx#L5-L30) | `5` | `30` |
| `handleMouseLeave` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L219-L223) | `219` | `223` |
| `handleMouseEnter` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L212-L217) | `212` | `217` |
| `ToastCard` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L178-L286) | `178` | `286` |
| `onDismiss` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L332-L335) | `332` | `335` |
| `onToast` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L303-L330) | `303` | `330` |
| `Toaster` | `function` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L291-L358) | `291` | `358` |
| `blank` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1318-L1318) | `1318` | `1318` |
| `cmpVal` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1291-L1304) | `1291` | `1304` |
| `sortRows` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1306-L1330) | `1306` | `1330` |
| `maskTimeDigits` | `function` | [apps/web/src/utils/timeMask.ts](file://apps/web/src/utils/timeMask.ts#L20-L23) | `20` | `23` |
| `shouldEmitTime` | `function` | [apps/web/src/utils/timeMask.ts](file://apps/web/src/utils/timeMask.ts#L39-L46) | `39` | `46` |
| `TimeInput` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1782-L1836) | `1782` | `1836` |
| `cjkWarning` | `function` | [apps/web/src/components/usePdfDoc.ts](file://apps/web/src/components/usePdfDoc.ts#L36-L38) | `36` | `38` |
| `downloadBlobUrl` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L230-L238) | `230` | `238` |
| `usePdfDoc` | `function` | [apps/web/src/components/usePdfDoc.ts](file://apps/web/src/components/usePdfDoc.ts#L40-L145) | `40` | `145` |
| `openDb` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L31-L67) | `31` | `67` |
| `idbClearAll` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L140-L157) | `140` | `157` |
| `idbAvailable` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L70-L72) | `70` | `72` |
| `buildSeeds` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L306-L380) | `306` | `380` |
| `clone` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L297-L299) | `297` | `299` |
| `sanitizeStore` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L542-L554) | `542` | `554` |
| `notifyStorageFull` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L774-L787) | `774` | `787` |
| `saveDirtyPersisted` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L415-L421) | `415` | `421` |
| `saveTombstonesPersisted` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L444-L455) | `444` | `455` |
| `run` | `function` | [apps/web/src/data/useRealtime.ts](file://apps/web/src/data/useRealtime.ts#L43-L75) | `43` | `75` |
| `flush` | `function` | [apps/web/src/data/useRealtime.ts](file://apps/web/src/data/useRealtime.ts#L29-L42) | `29` | `42` |
| `useRealtime` | `function` | [apps/web/src/data/useRealtime.ts](file://apps/web/src/data/useRealtime.ts#L14-L83) | `14` | `83` |
| `onKey` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L207-L213) | `207` | `213` |
| `useDeterrent` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L205-L219) | `205` | `219` |
| `SecurityGuards` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L221-L224) | `221` | `224` |
| `daysUntil` | `function` | [apps/web/src/utils/alerts.ts](file://apps/web/src/utils/alerts.ts#L14-L22) | `14` | `22` |
| `wbsDaysUntil` | `function` | [apps/web/src/utils/alerts.ts](file://apps/web/src/utils/alerts.ts#L24-L43) | `24` | `43` |
| `computeAlerts` | `function` | [apps/web/src/utils/alerts.ts](file://apps/web/src/utils/alerts.ts#L45-L163) | `45` | `163` |
| `dismissedFor` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L60-L62) | `60` | `62` |
| `dismissLevel` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L65-L69) | `65` | `69` |
| `restoreLevel` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L72-L80) | `72` | `80` |
| `isClassApprovalSatisfied` | `function` | [apps/web/src/utils/classApprovalBlockers.ts](file://apps/web/src/utils/classApprovalBlockers.ts#L45-L56) | `45` | `56` |
| `hasContract` | `function` | [apps/web/src/pages/proyek/Projects.tsx](file://apps/web/src/pages/proyek/Projects.tsx#L49-L54) | `49` | `54` |
| `getStageTransitionBlockers` | `function` | [apps/web/src/utils/classApprovalBlockers.ts](file://apps/web/src/utils/classApprovalBlockers.ts#L58-L236) | `58` | `236` |
| `num` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L18-L21) | `18` | `21` |
| `deadValueOf` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L182-L185) | `182` | `185` |
| `derivedDeadCode` | `function` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L161-L166) | `161` | `166` |
| `num` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L123-L126) | `123` | `126` |
| `effectiveMinStock` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L135-L148) | `135` | `148` |
| `categoryWarnings` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L235-L289) | `235` | `289` |
| `materialsOf` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L97-L115) | `97` | `115` |
| `planStockCut` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L190-L212) | `190` | `212` |
| `stockMaterials` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L118-L120) | `118` | `120` |
| `materialsCost` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L122-L124) | `122` | `124` |
| `workDaysOf` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L160-L168) | `160` | `168` |
| `costBreakdown` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L146-L157) | `146` | `157` |
| `monthKeyOf` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L40-L44) | `40` | `44` |
| `bucketByMonth` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L140-L161) | `140` | `161` |
| `yearsIn` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L262-L270) | `262` | `270` |
| `weekKey` | `function` | [apps/web/src/utils/overtime.ts](file://apps/web/src/utils/overtime.ts#L29-L34) | `29` | `34` |
| `dailyOvertime` | `function` | [apps/web/src/utils/overtime.ts](file://apps/web/src/utils/overtime.ts#L24-L26) | `24` | `26` |
| `applyWeeklyCap` | `function` | [apps/web/src/utils/overtime.ts](file://apps/web/src/utils/overtime.ts#L37-L46) | `37` | `46` |
| `generateBoqHtml` | `function` | [apps/web/src/utils/printBoqHtml.ts](file://apps/web/src/utils/printBoqHtml.ts#L32-L334) | `32` | `334` |
| `escapeHtml` | `function` | [apps/web/src/utils/printBoqHtml.ts](file://apps/web/src/utils/printBoqHtml.ts#L336-L343) | `336` | `343` |
| `printBoqHtml` | `function` | [apps/web/src/utils/printBoqHtml.ts](file://apps/web/src/utils/printBoqHtml.ts#L345-L376) | `345` | `376` |
| `equipmentCostSummary` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L200-L223) | `200` | `223` |
| `maintenanceCostRows` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L143-L168) | `143` | `168` |
| `equipmentCostByProject` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L229-L244) | `229` | `244` |
| `endInDays` | `function` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L11-L19) | `11` | `19` |
| `delayDaysOf` | `function` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L28-L33) | `28` | `33` |
| `projectDelayDetailsOf` | `function` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L52-L83) | `52` | `83` |
| `clampDependents` | `function` | [apps/web/src/utils/ptkp.ts](file://apps/web/src/utils/ptkp.ts#L5-L8) | `5` | `8` |
| `parsePtkp` | `function` | [apps/web/src/utils/ptkp.ts](file://apps/web/src/utils/ptkp.ts#L16-L19) | `16` | `19` |
| `ptkpCode` | `function` | [apps/web/src/utils/ptkp.ts](file://apps/web/src/utils/ptkp.ts#L10-L13) | `10` | `13` |
| `minimumDailyWage` | `function` | [apps/web/src/utils/rates.ts](file://apps/web/src/utils/rates.ts#L86-L88) | `86` | `88` |
| `loadedLaborRatePerDay` | `function` | [apps/web/src/utils/rates.ts](file://apps/web/src/utils/rates.ts#L94-L97) | `94` | `97` |
| `billedLaborRatePerDay` | `function` | [apps/web/src/utils/rates.ts](file://apps/web/src/utils/rates.ts#L105-L107) | `105` | `107` |
| `claimKey` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L278-L279) | `278` | `279` |
| `releaseAutoRisk` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L290-L292) | `290` | `292` |
| `claimAutoRisk` | `function` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L282-L287) | `282` | `287` |
| `getSetting` | `function` | [apps/web/src/utils/settings.ts](file://apps/web/src/utils/settings.ts#L6-L10) | `6` | `10` |
| `exportRecap` | `function` | [apps/web/src/pages/absensi/MonthlyRecap.tsx](file://apps/web/src/pages/absensi/MonthlyRecap.tsx#L62-L66) | `62` | `66` |
| `MonthlyRecap` | `function` | [apps/web/src/pages/absensi/MonthlyRecap.tsx](file://apps/web/src/pages/absensi/MonthlyRecap.tsx#L18-L122) | `18` | `122` |
| `positiveNumber` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L73-L76) | `73` | `76` |
| `unitConversionOf` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L206-L236) | `206` | `236` |
| `optionalPositiveNumber` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L78-L81) | `78` | `81` |
| `numberText` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L238-L242) | `238` | `242` |
| `displayUnit` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L244-L249) | `244` | `249` |
| `formatUnitConversion` | `function` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L251-L267) | `251` | `267` |
| `warehouseName` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L66-L68) | `66` | `68` |
| `warehouseActive` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L70-L73) | `70` | `73` |
| `warehouseNames` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L100-L111) | `100` | `111` |
| `woProgressOf` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L73-L83) | `73` | `83` |
| `clampPct` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L85-L88) | `85` | `88` |
| `woProgressLabel` | `function` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L96-L99) | `96` | `99` |
| `loadFontFiles` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L64-L85) | `64` | `85` |
| `registerFonts` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L148-L175) | `148` | `175` |
| `fontFilesAvailable` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L88-L91) | `88` | `91` |
| `recordError` | `function` | [services/api/src/routes/admin.ts](file://services/api/src/routes/admin.ts#L53-L58) | `53` | `58` |
| `isSetupTokenValid` | `function` | [services/api/src/routes/admin.ts](file://services/api/src/routes/admin.ts#L11-L17) | `11` | `17` |
| `registerAdminRoutes` | `function` | [services/api/src/routes/admin.ts](file://services/api/src/routes/admin.ts#L19-L119) | `19` | `119` |
| `isHr` | `function` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L94-L94) | `94` | `94` |
| `sha` | `function` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L29-L29) | `29` | `29` |
| `registerAttendanceIngestRoutes` | `function` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L93-L135) | `93` | `135` |
| `mergePunch` | `function` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L40-L45) | `40` | `45` |
| `witaParts` | `function` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L32-L37) | `32` | `37` |
| `applyPunches` | `function` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L49-L91) | `49` | `91` |
| `onWrite` | `function` | [services/api/src/routes/events.ts](file://services/api/src/routes/events.ts#L48-L52) | `48` | `52` |
| `flush` | `function` | [services/api/src/routes/events.ts](file://services/api/src/routes/events.ts#L42-L47) | `42` | `47` |
| `registerEventRoutes` | `function` | [services/api/src/routes/events.ts](file://services/api/src/routes/events.ts#L19-L61) | `19` | `61` |
| `canPo` | `function` | [services/api/src/routes/poFulfillment.ts](file://services/api/src/routes/poFulfillment.ts#L47-L47) | `47` | `47` |
| `handleError` | `function` | [services/api/src/routes/poFulfillment.ts](file://services/api/src/routes/poFulfillment.ts#L41-L44) | `41` | `44` |
| `registerPoFulfillmentRoutes` | `function` | [services/api/src/routes/poFulfillment.ts](file://services/api/src/routes/poFulfillment.ts#L46-L97) | `46` | `97` |
| `sha` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L64-L64) | `64` | `64` |
| `sameToken` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L59-L63) | `59` | `63` |
| `tokenValid` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L74-L78) | `74` | `78` |
| `handleExportExcel` | `function` | [apps/web/src/pages/dokumen/BoqDetailModal.tsx](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L130-L184) | `130` | `184` |
| `handlePrint` | `function` | [apps/web/src/pages/dokumen/BoqDetailModal.tsx](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L109-L127) | `109` | `127` |
| `BoqDetailModal` | `function` | [apps/web/src/pages/dokumen/BoqDetailModal.tsx](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L30-L406) | `30` | `406` |
| `activeMaintOf` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L20-L23) | `20` | `23` |
| `activeLoanOf` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L15-L18) | `15` | `18` |
| `delegationStatus` | `function` | [apps/web/src/pages/equipment/DelegationPanel.tsx](file://apps/web/src/pages/equipment/DelegationPanel.tsx#L25-L28) | `25` | `28` |
| `reservedOf` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L268-L270) | `268` | `270` |
| `reservedQty` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L272-L274) | `272` | `274` |
| `availOf` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L276-L278) | `276` | `278` |
| `rentangValid` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L118-L120) | `118` | `120` |
| `matchHistPeriod` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L158-L168) | `158` | `168` |
| `histToParam` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L93-L99) | `93` | `99` |
| `num` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L339-L342) | `339` | `342` |
| `lineAmount` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L367-L370) | `367` | `370` |
| `apOutAsOf` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L509-L524) | `509` | `524` |
| `liveAsOf` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L449-L460) | `449` | `460` |
| `akhirBulan` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L443-L448) | `443` | `448` |
| `asOfOrToday` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L462-L464) | `462` | `464` |
| `save` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L627-L632) | `627` | `632` |
| `init` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L618-L623) | `618` | `623` |
| `ManualTaxForm` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L609-L647) | `609` | `647` |
| `toISODate` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L51-L53) | `51` | `53` |
| `addDays` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L63-L67) | `63` | `67` |
| `mondayOf` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L55-L61) | `55` | `61` |
| `normKasbonList` | `function` | [apps/web/src/utils/kasbon.ts](file://apps/web/src/utils/kasbon.ts#L24-L40) | `24` | `40` |
| `normKasbon` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L145-L147) | `145` | `147` |
| `kasbonSisa` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L149-L151) | `149` | `151` |
| `annualPph` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L166-L188) | `166` | `188` |
| `calcPphProgressive` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L191-L193) | `191` | `193` |
| `calcPphIrregular` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L197-L205) | `197` | `205` |
| `needLevels` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L132-L139) | `132` | `139` |
| `apprOf` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L148-L150) | `148` | `150` |
| `nextLevel` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L152-L156) | `152` | `156` |
| `parseKop` | `function` | [apps/web/src/pages/pengaturan/KopCard.tsx](file://apps/web/src/pages/pengaturan/KopCard.tsx#L13-L21) | `13` | `21` |
| `save` | `function` | [apps/web/src/pages/pengaturan/KopCard.tsx](file://apps/web/src/pages/pengaturan/KopCard.tsx#L33-L42) | `33` | `42` |
| `KopCard` | `function` | [apps/web/src/pages/pengaturan/KopCard.tsx](file://apps/web/src/pages/pengaturan/KopCard.tsx#L23-L58) | `23` | `58` |
| `withExt` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L108-L113) | `108` | `113` |
| `docExtOf` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L121-L125) | `121` | `125` |
| `docBaseName` | `function` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L105-L119) | `105` | `119` |
| `isPublicRoute` | `function` | [services/api/src/routeList.ts](file://services/api/src/routeList.ts#L30-L32) | `30` | `32` |
| `put` | `function` | [services/api/scripts/gen-bruno.ts](file://services/api/scripts/gen-bruno.ts#L25-L25) | `25` | `25` |
| `bru` | `function` | [services/api/scripts/gen-bruno.ts](file://services/api/scripts/gen-bruno.ts#L30-L49) | `30` | `49` |
| `reportRuns` | `function` | [services/api/scripts/pdf-audit-probe.ts](file://services/api/scripts/pdf-audit-probe.ts#L36-L46) | `36` | `46` |
| `idsFor` | `function` | [services/api/scripts/pdf-audit-probe.ts](file://services/api/scripts/pdf-audit-probe.ts#L24-L31) | `24` | `31` |
| `main` | `function` | [services/api/scripts/pdf-audit-probe.ts](file://services/api/scripts/pdf-audit-probe.ts#L48-L88) | `48` | `88` |
| `post` | `function` | [services/api/scripts/voucher-probe.ts](file://services/api/scripts/voucher-probe.ts#L22-L27) | `22` | `27` |
| `assert` | `function` | [services/api/scripts/voucher-probe.ts](file://services/api/scripts/voucher-probe.ts#L13-L16) | `13` | `16` |
| `main` | `function` | [services/api/scripts/voucher-probe.ts](file://services/api/scripts/voucher-probe.ts#L8-L46) | `8` | `46` |
| `voucherPrefix` | `function` | [services/api/src/voucher.ts](file://services/api/src/voucher.ts#L14-L17) | `14` | `17` |
| `nextVoucherNo` | `function` | [services/api/src/voucher.ts](file://services/api/src/voucher.ts#L21-L32) | `21` | `32` |
| `withVoucherNo` | `function` | [services/api/src/voucher.ts](file://services/api/src/voucher.ts#L35-L44) | `35` | `44` |
| `splitCsvRow` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L94-L110) | `94` | `110` |
| `readCsvRows` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L112-L117) | `112` | `117` |
| `readSheetRows` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L120-L124) | `120` | `124` |
| `assert` | `function` | [services/api/scripts/attendance-ingest-probe.ts](file://services/api/scripts/attendance-ingest-probe.ts#L12-L15) | `12` | `15` |
| `main` | `function` | [services/api/scripts/attendance-ingest-probe.ts](file://services/api/scripts/attendance-ingest-probe.ts#L7-L60) | `7` | `60` |
| `assert` | `function` | [services/api/scripts/checklist-probe.ts](file://services/api/scripts/checklist-probe.ts#L13-L16) | `13` | `16` |
| `main` | `function` | [services/api/scripts/checklist-probe.ts](file://services/api/scripts/checklist-probe.ts#L8-L50) | `8` | `50` |
| `legacyNumber` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L40-L51) | `40` | `51` |
| `legacyTotal` | `function` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L53-L62) | `53` | `62` |
| `normalizePdf` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L88-L93) | `88` | `93` |
| `samePdf` | `function` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L95-L98) | `95` | `98` |
| `walk` | `function` | [services/api/scripts/pdf-probe.ts](file://services/api/scripts/pdf-probe.ts#L377-L388) | `377` | `388` |
| `frontendKinds` | `function` | [services/api/scripts/pdf-probe.ts](file://services/api/scripts/pdf-probe.ts#L374-L391) | `374` | `391` |
| `probePassword` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L22-L24) | `22` | `24` |
| `getSeedPass` | `function` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L26-L31) | `26` | `31` |
| `assert` | `function` | [services/api/scripts/token-revocation-probe.ts](file://services/api/scripts/token-revocation-probe.ts#L13-L22) | `13` | `22` |
| `main` | `function` | [services/api/scripts/token-revocation-probe.ts](file://services/api/scripts/token-revocation-probe.ts#L5-L110) | `5` | `110` |
| `assert` | `function` | [services/api/scripts/user-hierarchy-probe.ts](file://services/api/scripts/user-hierarchy-probe.ts#L24-L33) | `24` | `33` |
| `main` | `function` | [services/api/scripts/user-hierarchy-probe.ts](file://services/api/scripts/user-hierarchy-probe.ts#L5-L101) | `5` | `101` |
| `requestActor` | `function` | [services/api/src/audit.ts](file://services/api/src/audit.ts#L47-L50) | `47` | `50` |
| `registerBoqDocRoutes` | `function` | [services/api/src/routes/boqDocs.ts](file://services/api/src/routes/boqDocs.ts#L15-L41) | `15` | `41` |
| `norm` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L81-L81) | `81` | `81` |
| `branchAllowed` | `function` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L80-L88) | `80` | `88` |
| `constructor` | `method` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L91-L94) | `91` | `94` |
| `BranchScopeResolutionError` | `class` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L90-L95) | `90` | `95` |
| `constructor` | `method` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L33-L35) | `33` | `35` |
| `BoqError` | `class` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L32-L36) | `32` | `36` |
| `constructor` | `method` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L20-L20) | `20` | `20` |
| `CoError` | `class` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L19-L21) | `19` | `21` |
| `ensureSqlite` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L43-L50) | `43` | `50` |
| `resolveSqlitePath` | `function` | [services/api/src/db.ts](file://services/api/src/db.ts#L29-L39) | `29` | `39` |
| `len` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L9-L9) | `9` | `9` |
| `stageHasData` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L13-L16) | `13` | `16` |
| `bomAllocationError` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L138-L154) | `138` | `154` |
| `bomItemError` | `function` | [services/api/src/domainGuards.ts](file://services/api/src/domainGuards.ts#L156-L170) | `156` | `170` |
| `loadEnv` | `function` | [services/api/src/env.ts](file://services/api/src/env.ts#L29-L153) | `29` | `153` |
| `parseOrigins` | `function` | [services/api/src/env.ts](file://services/api/src/env.ts#L19-L27) | `19` | `27` |
| `fail` | `function` | [services/api/src/envelope.ts](file://services/api/src/envelope.ts#L8-L10) | `8` | `10` |
| `registerErrorHandler` | `function` | [services/api/src/envelope.ts](file://services/api/src/envelope.ts#L12-L37) | `12` | `37` |
| `initFonts` | `function` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L134-L138) | `134` | `138` |
| `main` | `function` | [services/api/src/index.ts](file://services/api/src/index.ts#L6-L23) | `6` | `23` |
| `constructor` | `method` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L12-L12) | `12` | `12` |
| `IssueError` | `class` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L11-L13) | `11` | `13` |
| `constructor` | `method` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L20-L22) | `20` | `22` |
| `MaterialError` | `class` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L19-L23) | `19` | `23` |
| `constructor` | `method` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L24-L26) | `24` | `26` |
| `PoError` | `class` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L23-L27) | `23` | `27` |
| `idColumn` | `function` | [services/api/src/refs.ts](file://services/api/src/refs.ts#L98-L100) | `98` | `100` |
| `checkRefs` | `function` | [services/api/src/refs.ts](file://services/api/src/refs.ts#L113-L147) | `113` | `147` |
| `jsonEq` | `function` | [services/api/src/refs.ts](file://services/api/src/refs.ts#L105-L110) | `105` | `110` |
| `findUsages` | `function` | [services/api/src/refs.ts](file://services/api/src/refs.ts#L150-L185) | `150` | `185` |
| `constructor` | `method` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L26-L28) | `26` | `28` |
| `ServiceError` | `class` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L25-L29) | `25` | `29` |
| `hasProject` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L45-L47) | `45` | `47` |
| `normalizeNewService` | `function` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L51-L55) | `51` | `55` |
| `canEditSpk` | `function` | [services/api/src/workOrderGuard.ts](file://services/api/src/workOrderGuard.ts#L11-L13) | `11` | `13` |
| `spkLockError` | `function` | [services/api/src/workOrderGuard.ts](file://services/api/src/workOrderGuard.ts#L16-L24) | `16` | `24` |
| `loadSession` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L71-L78) | `71` | `78` |
| `getRole` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L81-L83) | `81` | `83` |
| `useAuth` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L258-L260) | `258` | `260` |
| `RequireAuth` | `function` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L262-L269) | `262` | `269` |
| `confirmDropPending` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L43-L50) | `43` | `50` |
| `restoreOriginal` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L77-L91) | `77` | `91` |
| `resetCacheFor` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L52-L55) | `52` | `55` |
| `loginAsRole` | `function` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L105-L120) | `105` | `120` |
| `run` | `function` | [apps/web/src/components/DemoRoleSwitcher.tsx](file://apps/web/src/components/DemoRoleSwitcher.tsx#L30-L36) | `30` | `36` |
| `DemoRoleSwitcher` | `function` | [apps/web/src/components/DemoRoleSwitcher.tsx](file://apps/web/src/components/DemoRoleSwitcher.tsx#L12-L65) | `12` | `65` |
| `mapSearchSelectOptions` | `function` | [apps/web/src/components/SearchSelect.tsx](file://apps/web/src/components/SearchSelect.tsx#L11-L13) | `11` | `13` |
| `SearchSelect` | `function` | [apps/web/src/components/SearchSelect.tsx](file://apps/web/src/components/SearchSelect.tsx#L16-L64) | `16` | `64` |
| `compactMoney` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L340-L345) | `340` | `345` |
| `KpiCard` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L347-L419) | `347` | `419` |
| `onKey` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L815-L828) | `815` | `828` |
| `Modal` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L787-L898) | `787` | `898` |
| `searchText` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L979-L991) | `979` | `991` |
| `rowMatches` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L993-L1005) | `993` | `1005` |
| `useDebouncedValue` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L2071-L2078) | `2071` | `2078` |
| `useListSearch` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1007-L1017) | `1007` | `1017` |
| `run` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1419-L1429) | `1419` | `1429` |
| `useBusy` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1411-L1431) | `1411` | `1431` |
| `useAsyncAction` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1438-L1456) | `1438` | `1456` |
| `AsyncButton` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1460-L1506) | `1460` | `1506` |
| `go` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1650-L1650) | `1650` | `1650` |
| `useServerPager` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1585-L1653) | `1585` | `1653` |
| `format` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L2008-L2012) | `2008` | `2012` |
| `MoneyInput` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L2004-L2022) | `2004` | `2022` |
| `splitHighlight` | `function` | [apps/web/src/components/useDeepLink.ts](file://apps/web/src/components/useDeepLink.ts#L52-L59) | `52` | `59` |
| `useDeepLinkParams` | `function` | [apps/web/src/components/useDeepLink.ts](file://apps/web/src/components/useDeepLink.ts#L37-L45) | `37` | `45` |
| `allowlistedDeepLinkTab` | `function` | [apps/web/src/components/useDeepLink.ts](file://apps/web/src/components/useDeepLink.ts#L62-L65) | `62` | `65` |
| `useDeepLinkTarget` | `function` | [apps/web/src/components/useDeepLink.ts](file://apps/web/src/components/useDeepLink.ts#L74-L107) | `74` | `107` |
| `rowsInBranch` | `function` | [apps/web/src/data/branchScope.ts](file://apps/web/src/data/branchScope.ts#L2-L10) | `2` | `10` |
| `scopeAlertStoreData` | `function` | [apps/web/src/data/scopeAlertData.ts](file://apps/web/src/data/scopeAlertData.ts#L6-L21) | `6` | `21` |
| `tx` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L74-L96) | `74` | `96` |
| `idbPut` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L99-L102) | `99` | `102` |
| `finish` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L116-L126) | `116` | `126` |
| `idbGetAll` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L105-L135) | `105` | `135` |
| `isProjectArrayMap` | `function` | [apps/web/src/data/offlinePersistence.ts](file://apps/web/src/data/offlinePersistence.ts#L10-L15) | `10` | `15` |
| `mergeOfflineValues` | `function` | [apps/web/src/data/offlinePersistence.ts](file://apps/web/src/data/offlinePersistence.ts#L25-L43) | `25` | `43` |
| `persistScopedCollections` | `function` | [apps/web/src/data/offlinePersistence.ts](file://apps/web/src/data/offlinePersistence.ts#L46-L71) | `46` | `71` |
| `isStringMap` | `function` | [apps/web/src/data/offlinePersistence.ts](file://apps/web/src/data/offlinePersistence.ts#L17-L22) | `17` | `22` |
| `isCurrent` | `function` | [apps/web/src/data/sessionFence.ts](file://apps/web/src/data/sessionFence.ts#L8-L8) | `8` | `8` |
| `createSessionFence` | `function` | [apps/web/src/data/sessionFence.ts](file://apps/web/src/data/sessionFence.ts#L7-L15) | `7` | `15` |
| `read` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L561-L572) | `561` | `572` |
| `loadStore` | `function` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L556-L583) | `556` | `583` |
| `mrStatus` | `function` | [apps/web/src/data/useMaterialRequest.ts](file://apps/web/src/data/useMaterialRequest.ts#L43-L46) | `43` | `46` |
| `useFulfillMaterialRequest` | `function` | [apps/web/src/data/useMaterialRequest.ts](file://apps/web/src/data/useMaterialRequest.ts#L238-L287) | `238` | `287` |
| `setSyncActive` | `function` | [apps/web/src/data/useModuleSync.ts](file://apps/web/src/data/useModuleSync.ts#L48-L52) | `48` | `52` |
| `useProjectWbsSync` | `function` | [apps/web/src/data/useModuleSync.ts](file://apps/web/src/data/useModuleSync.ts#L217-L264) | `217` | `264` |
| `publishFailed` | `function` | [apps/web/src/data/useModuleSync.ts](file://apps/web/src/data/useModuleSync.ts#L77-L82) | `77` | `82` |
| `useModuleSync` | `function` | [apps/web/src/data/useModuleSync.ts](file://apps/web/src/data/useModuleSync.ts#L111-L197) | `111` | `197` |
| `approvalOf` | `function` | [apps/web/src/data/useServiceApproval.ts](file://apps/web/src/data/useServiceApproval.ts#L11-L14) | `11` | `14` |
| `useServiceApproval` | `function` | [apps/web/src/data/useServiceApproval.ts](file://apps/web/src/data/useServiceApproval.ts#L21-L44) | `21` | `44` |
| `loadLocale` | `function` | [apps/web/src/i18n/LanguageContext.tsx](file://apps/web/src/i18n/LanguageContext.tsx#L11-L18) | `11` | `18` |
| `LanguageProvider` | `function` | [apps/web/src/i18n/LanguageContext.tsx](file://apps/web/src/i18n/LanguageContext.tsx#L28-L46) | `28` | `46` |
| `escapeXml` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L61-L63) | `61` | `63` |
| `tileUri` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L65-L80) | `65` | `80` |
| `paintLayer` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L84-L92) | `84` | `92` |
| `ensureDom` | `function` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L94-L124) | `94` | `124` |
| `miscLocale` | `function` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L122-L126) | `122` | `126` |
| `exportChartPNG` | `function` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L128-L159) | `128` | `159` |
| `num` | `function` | [apps/web/src/services/autoJournal.ts](file://apps/web/src/services/autoJournal.ts#L22-L22) | `22` | `22` |
| `postCashJournal` | `function` | [apps/web/src/services/autoJournal.ts](file://apps/web/src/services/autoJournal.ts#L34-L59) | `34` | `59` |
| `constructor` | `method` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L89-L93) | `89` | `93` |
| `FileHttpError` | `class` | [apps/web/src/services/files.ts](file://apps/web/src/services/files.ts#L87-L94) | `87` | `94` |
| `constructor` | `method` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L14-L17) | `14` | `17` |
| `ApiNotConfigured` | `class` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L13-L18) | `13` | `18` |
| `constructor` | `method` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L25-L32) | `25` | `32` |
| `ApiError` | `class` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L20-L33) | `20` | `33` |
| `safeStorage` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L39-L46) | `39` | `46` |
| `clearJwt` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L73-L80) | `73` | `80` |
| `notifySessionChange` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L48-L54) | `48` | `54` |
| `setJwt` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L56-L63) | `56` | `63` |
| `notifyAuthExpired` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L138-L153) | `138` | `153` |
| `verifySessionAfterBackground401` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L162-L169) | `162` | `169` |
| `isPdfHead` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L35-L41) | `35` | `41` |
| `reprintPdf` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L175-L212) | `175` | `212` |
| `constructor` | `method` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L63-L67) | `63` | `67` |
| `PdfRenderError` | `class` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L61-L68) | `61` | `68` |
| `renderPdfFrom` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L107-L158) | `107` | `158` |
| `renderPdf` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L161-L166) | `161` | `166` |
| `key` | `function` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L130-L130) | `130` | `130` |
| `stableOrder` | `function` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L128-L132) | `128` | `132` |
| `constructor` | `method` | [apps/web/src/services/upload.ts](file://apps/web/src/services/upload.ts#L10-L13) | `10` | `13` |
| `UploadNotConfigured` | `class` | [apps/web/src/services/upload.ts](file://apps/web/src/services/upload.ts#L9-L14) | `9` | `14` |
| `visibleItems` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L91-L95) | `91` | `95` |
| `hiddenCount` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L98-L100) | `98` | `100` |
| `loadDraft` | `function` | [apps/web/src/utils/draft.ts](file://apps/web/src/utils/draft.ts#L6-L14) | `6` | `14` |
| `useDraftState` | `function` | [apps/web/src/utils/draft.ts](file://apps/web/src/utils/draft.ts#L16-L29) | `16` | `29` |
| `g` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L36-L36) | `36` | `36` |
| `fmtTanggalJam` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L27-L39) | `27` | `39` |
| `fmtRupiah` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L63-L66) | `63` | `66` |
| `fmtRupiahShort` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L70-L80) | `70` | `80` |
| `normKey` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L98-L100) | `98` | `100` |
| `ruleOf` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L103-L113) | `103` | `113` |
| `EMPTY_COUNTS` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L204-L206) | `204` | `206` |
| `levelTally` | `function` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L217-L224) | `217` | `224` |
| `isMaintStatus` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L29-L31) | `29` | `31` |
| `statusOf` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L33-L36) | `33` | `36` |
| `nextStatuses` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L44-L49) | `44` | `49` |
| `canTransition` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L51-L53) | `51` | `53` |
| `canRestoreStock` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L227-L229) | `227` | `229` |
| `markDeducted` | `function` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L231-L233) | `231` | `233` |
| `monthsOf` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L35-L37) | `35` | `37` |
| `fmtMonthKey` | `function` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L245-L250) | `245` | `250` |
| `toMinutes` | `function` | [apps/web/src/utils/overtime.ts](file://apps/web/src/utils/overtime.ts#L6-L12) | `6` | `12` |
| `workedHours` | `function` | [apps/web/src/utils/overtime.ts](file://apps/web/src/utils/overtime.ts#L15-L21) | `15` | `21` |
| `num` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L18-L21) | `18` | `21` |
| `maintenanceDowntimeHours` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L171-L177) | `171` | `177` |
| `bookingCostRows` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L83-L110) | `83` | `110` |
| `isBillableBooking` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L30-L32) | `30` | `32` |
| `resolveEquipment` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L40-L48) | `40` | `48` |
| `bookingCost` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L59-L68) | `59` | `68` |
| `scopeList` | `function` | [apps/web/src/utils/scope.ts](file://apps/web/src/utils/scope.ts#L9-L29) | `9` | `29` |
| `scopeNames` | `function` | [apps/web/src/utils/scope.ts](file://apps/web/src/utils/scope.ts#L32-L34) | `32` | `34` |
| `normalizedValue` | `function` | [apps/web/src/utils/scoring.ts](file://apps/web/src/utils/scoring.ts#L6-L18) | `6` | `18` |
| `scoreChecklist` | `function` | [apps/web/src/utils/scoring.ts](file://apps/web/src/utils/scoring.ts#L20-L33) | `20` | `33` |
| `safeText` | `function` | [apps/web/src/utils/series.ts](file://apps/web/src/utils/series.ts#L48-L52) | `48` | `52` |
| `briefOf` | `function` | [apps/web/src/utils/series.ts](file://apps/web/src/utils/series.ts#L62-L65) | `62` | `65` |
| `angkaKeKataId` | `function` | [apps/web/src/utils/terbilang.ts](file://apps/web/src/utils/terbilang.ts#L21-L32) | `21` | `32` |
| `terbilangRupiah` | `function` | [apps/web/src/utils/terbilang.ts](file://apps/web/src/utils/terbilang.ts#L34-L39) | `34` | `39` |
| `numToWordsEn` | `function` | [apps/web/src/utils/terbilang.ts](file://apps/web/src/utils/terbilang.ts#L44-L52) | `44` | `52` |
| `spelledOutCurrency` | `function` | [apps/web/src/utils/terbilang.ts](file://apps/web/src/utils/terbilang.ts#L54-L58) | `54` | `58` |
| `sum` | `function` | [apps/web/src/utils/termin.ts](file://apps/web/src/utils/termin.ts#L24-L24) | `24` | `24` |
| `buildTermins` | `function` | [apps/web/src/utils/termin.ts](file://apps/web/src/utils/termin.ts#L26-L60) | `26` | `60` |
| `stampDerivedCreatedAt` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L169-L195) | `169` | `195` |
| `deriveCreatedAt` | `function` | [apps/web/src/utils/timestamps.ts](file://apps/web/src/utils/timestamps.ts#L147-L161) | `147` | `161` |
| `rowsOf` | `function` | [apps/web/src/utils/usages.ts](file://apps/web/src/utils/usages.ts#L7-L11) | `7` | `11` |
| `findUsages` | `function` | [apps/web/src/utils/usages.ts](file://apps/web/src/utils/usages.ts#L31-L134) | `31` | `134` |
| `allWarehouseNames` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L124-L137) | `124` | `137` |
| `usedWarehouseNames` | `function` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L114-L121) | `114` | `121` |
| `standardWidth` | `function` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L28-L35) | `28` | `35` |
| `ensureMetrics` | `function` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L56-L64) | `56` | `64` |
| `assemble` | `method` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L316-L320) | `316` | `320` |
| `buildFromModel` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L1410-L1412) | `1410` | `1412` |
| `pick` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L591-L591) | `591` | `591` |
| `poSigners` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L589-L605) | `589` | `605` |
| `findRecipe` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L1386-L1388) | `1386` | `1388` |
| `recipeEntity` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L1391-L1393) | `1391` | `1393` |
| `shiftMonth` | `function` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L57-L62) | `57` | `62` |
| `monthAxis` | `function` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L65-L70) | `65` | `70` |
| `toJson` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L249-L258) | `249` | `258` |
| `checkUniqueField` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L220-L247) | `220` | `247` |
| `drydockRange` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L291-L299) | `291` | `299` |
| `drydockOverlapError` | `function` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L309-L331) | `309` | `331` |
| `safeFileName` | `function` | [services/api/src/routes/pdf.ts](file://services/api/src/routes/pdf.ts#L288-L290) | `288` | `290` |
| `sendPdf` | `function` | [services/api/src/routes/pdf.ts](file://services/api/src/routes/pdf.ts#L233-L257) | `233` | `257` |
| `getValue` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L50-L53) | `50` | `53` |
| `readQr` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L68-L73) | `68` | `73` |
| `projectVisible` | `function` | [services/api/src/routes/readModels.ts](file://services/api/src/routes/readModels.ts#L55-L58) | `55` | `58` |
| `registerReadModelRoutes` | `function` | [services/api/src/routes/readModels.ts](file://services/api/src/routes/readModels.ts#L53-L115) | `53` | `115` |
| `timeOf` | `function` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L36-L42) | `36` | `42` |
| `timeLabel` | `function` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L46-L49) | `46` | `49` |
| `dockLengthM` | `function` | [apps/web/src/pages/drydock/Drydock.tsx](file://apps/web/src/pages/drydock/Drydock.tsx#L70-L73) | `70` | `73` |
| `dockMaxLoa` | `function` | [apps/web/src/pages/drydock/Drydock.tsx](file://apps/web/src/pages/drydock/Drydock.tsx#L77-L81) | `77` | `81` |
| `monthDiff` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L37-L43) | `37` | `43` |
| `certTone` | `function` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L45-L51) | `45` | `51` |
| `monthDiff` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L49-L54) | `49` | `54` |
| `certNeedsAttention` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L56-L59) | `56` | `59` |
| `complianceOf` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L70-L73) | `70` | `73` |
| `complianceSummary` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L75-L81) | `75` | `81` |
| `optNum` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L104-L104) | `104` | `104` |
| `formToPayload` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L110-L122) | `110` | `122` |
| `str` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L125-L125) | `125` | `125` |
| `vesselToForm` | `function` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L124-L138) | `124` | `138` |
| `isEceran` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L103-L105) | `103` | `105` |
| `hasUom2` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L297-L299) | `297` | `299` |
| `convOf` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L285-L287) | `285` | `287` |
| `qtyInUom2` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L301-L304) | `301` | `304` |
| `uom2Of` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L289-L291) | `289` | `291` |
| `hasConversion` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L293-L295) | `293` | `295` |
| `effCost` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L315-L318) | `315` | `318` |
| `abcMap` | `function` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L327-L344) | `327` | `344` |
| `emptyHist` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L88-L88) | `88` | `88` |
| `HistFilterBar` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L174-L226) | `174` | `226` |
| `matchHist` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L148-L157) | `148` | `157` |
| `kasAsOfReport` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L475-L505) | `475` | `505` |
| `invNeto` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L345-L349) | `345` | `349` |
| `arOutAsOf` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L528-L544) | `528` | `544` |
| `esc` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L391-L394) | `391` | `394` |
| `downloadCsv` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L390-L405) | `390` | `405` |
| `normAllowances` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L126-L139) | `126` | `139` |
| `sumAllowances` | `function` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L141-L143) | `141` | `143` |
| `scoresOf` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L159-L161) | `159` | `161` |
| `avgScore` | `function` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L163-L167) | `163` | `167` |
| `p` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L286-L286) | `286` | `286` |
| `fmtDateTime` | `function` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L282-L288) | `282` | `288` |
| `num` | `function` | [apps/web/src/pages/proyek/MonitoringFeed.tsx](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L38-L38) | `38` | `38` |
| `MonitoringFeed` | `function` | [apps/web/src/pages/proyek/MonitoringFeed.tsx](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L40-L164) | `40` | `164` |
| `addYearsISO` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L87-L91) | `87` | `91` |
| `normCerts` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L114-L131) | `114` | `131` |
| `defaultSkills` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L103-L107) | `103` | `107` |
| `getSkills` | `function` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L109-L112) | `109` | `112` |
| `addYearsISO` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L77-L81) | `77` | `81` |
| `normCerts` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L104-L124) | `104` | `124` |
| `daysUntil` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L120-L127) | `120` | `127` |
| `daysLate` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L129-L132) | `129` | `132` |
| `terbilangAngka` | `function` | [services/api/src/pdf/documents/kwitansi.ts](file://services/api/src/pdf/documents/kwitansi.ts#L129-L157) | `129` | `157` |
| `ribu` | `function` | [services/api/src/pdf/documents/kwitansi.ts](file://services/api/src/pdf/documents/kwitansi.ts#L123-L127) | `123` | `127` |
| `toItem` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L148-L151) | `148` | `151` |
| `loadEntity` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L168-L172) | `168` | `172` |
| `constructor` | `method` | [services/api/src/inventoryAdditional.ts](file://services/api/src/inventoryAdditional.ts#L13-L13) | `13` | `13` |
| `AdditionalError` | `class` | [services/api/src/inventoryAdditional.ts](file://services/api/src/inventoryAdditional.ts#L12-L14) | `12` | `14` |
| `num` | `function` | [services/api/src/poPayable.ts](file://services/api/src/poPayable.ts#L19-L19) | `19` | `19` |
| `shrinkPayableOnCancel` | `function` | [services/api/src/poPayable.ts](file://services/api/src/poPayable.ts#L62-L73) | `62` | `73` |
| `parseRoutes` | `function` | [services/api/src/routeList.ts](file://services/api/src/routeList.ts#L9-L23) | `9` | `23` |
| `routeList` | `function` | [services/api/src/routeList.ts](file://services/api/src/routeList.ts#L25-L27) | `25` | `27` |
| `confirm` | `function` | [apps/web/src/components/ImportPreviewModal.tsx](file://apps/web/src/components/ImportPreviewModal.tsx#L34-L37) | `34` | `37` |
| `ImportPreviewModal` | `function` | [apps/web/src/components/ImportPreviewModal.tsx](file://apps/web/src/components/ImportPreviewModal.tsx#L28-L77) | `28` | `77` |
| `tahapListOf` | `function` | [apps/web/src/utils/projectStages.ts](file://apps/web/src/utils/projectStages.ts#L18-L20) | `18` | `20` |
| `tahapAkhirOf` | `function` | [apps/web/src/utils/projectStages.ts](file://apps/web/src/utils/projectStages.ts#L23-L26) | `23` | `26` |
| `tahapOf` | `function` | [apps/web/src/utils/projectStages.ts](file://apps/web/src/utils/projectStages.ts#L47-L49) | `47` | `49` |
| `tahapKolom` | `function` | [apps/web/src/utils/projectStages.ts](file://apps/web/src/utils/projectStages.ts#L29-L34) | `29` | `34` |
| `inflateRaw` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L9-L12) | `9` | `12` |
| `unzip` | `function` | [apps/web/src/utils/readSheet.ts](file://apps/web/src/utils/readSheet.ts#L15-L44) | `15` | `44` |
| `allLinks` | `function` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L46-L55) | `46` | `55` |
| `reverseRefs` | `function` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L58-L60) | `58` | `60` |
| `allocationsOf` | `function` | [apps/web/src/pages/proyek/WbsMaterialModal.tsx](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L17-L23) | `17` | `23` |
| `stageMaterialCount` | `function` | [apps/web/src/pages/proyek/WbsMaterialModal.tsx](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L26-L28) | `26` | `28` |
| `length` | `method` | [apps/web/src/services/__tests__/authExpired.test.ts](file://apps/web/src/services/__tests__/authExpired.test.ts#L9-L9) | `9` | `9` |
| `memoryStorage` | `function` | [apps/web/src/services/__tests__/authExpired.test.ts](file://apps/web/src/services/__tests__/authExpired.test.ts#L6-L16) | `6` | `16` |
| `assert` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L48-L51) | `48` | `51` |
| `dayOffset` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L57-L61) | `57` | `61` |
| `shape` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L67-L68) | `67` | `68` |
| `levelOf` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L70-L73) | `70` | `73` |
| `es` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L337-L337) | `337` | `337` |
| `norm` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L352-L352) | `352` | `352` |
| `item` | `function` | [apps/web/scripts/alert-probe.ts](file://apps/web/scripts/alert-probe.ts#L402-L408) | `402` | `408` |
| `check` | `function` | [apps/web/scripts/api-base-probe.ts](file://apps/web/scripts/api-base-probe.ts#L7-L11) | `7` | `11` |
| `length` | `method` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L18-L20) | `18` | `20` |
| `noop` | `function` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L23-L23) | `23` | `23` |
| `eventTarget` | `function` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L25-L30) | `25` | `30` |
| `define` | `function` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L34-L40) | `34` | `40` |
| `unobserve` | `method` | [apps/web/scripts/browser-shims.ts](file://apps/web/scripts/browser-shims.ts#L59-L59) | `59` | `59` |
| `check` | `function` | [apps/web/scripts/drydock-dates-probe.ts](file://apps/web/scripts/drydock-dates-probe.ts#L16-L23) | `16` | `23` |
| `collectStrings` | `function` | [apps/web/scripts/em-dash-audit-probe.ts](file://apps/web/scripts/em-dash-audit-probe.ts#L12-L23) | `12` | `23` |
| `cek` | `function` | [apps/web/scripts/employee-probe.ts](file://apps/web/scripts/employee-probe.ts#L25-L32) | `25` | `32` |
| `assert` | `function` | [apps/web/scripts/equipment-notification-probe.ts](file://apps/web/scripts/equipment-notification-probe.ts#L11-L14) | `11` | `14` |
| `syntheticFetch` | `function` | [apps/web/scripts/fetch-performance-probe.ts](file://apps/web/scripts/fetch-performance-probe.ts#L23-L46) | `23` | `46` |
| `assert` | `function` | [apps/web/scripts/foundation-probe.ts](file://apps/web/scripts/foundation-probe.ts#L22-L25) | `22` | `25` |
| `asWo` | `function` | [apps/web/scripts/foundation-probe.ts](file://apps/web/scripts/foundation-probe.ts#L142-L142) | `142` | `142` |
| `wo` | `function` | [apps/web/scripts/foundation-probe.ts](file://apps/web/scripts/foundation-probe.ts#L235-L235) | `235` | `235` |
| `m` | `function` | [apps/web/scripts/foundation-probe.ts](file://apps/web/scripts/foundation-probe.ts#L236-L236) | `236` | `236` |
| `assert` | `function` | [apps/web/scripts/hr-rules-probe.ts](file://apps/web/scripts/hr-rules-probe.ts#L7-L10) | `7` | `10` |
| `keysOf` | `function` | [apps/web/scripts/i18n-probe.ts](file://apps/web/scripts/i18n-probe.ts#L6-L9) | `6` | `9` |
| `cek` | `function` | [apps/web/scripts/p8-probe.ts](file://apps/web/scripts/p8-probe.ts#L23-L30) | `23` | `30` |
| `check` | `function` | [apps/web/scripts/price-probe.ts](file://apps/web/scripts/price-probe.ts#L36-L40) | `36` | `40` |
| `assert` | `function` | [apps/web/scripts/price-probe.ts](file://apps/web/scripts/price-probe.ts#L43-L46) | `43` | `46` |
| `rows` | `function` | [apps/web/scripts/price-probe.ts](file://apps/web/scripts/price-probe.ts#L49-L49) | `49` | `49` |
| `id` | `function` | [apps/web/scripts/price-probe.ts](file://apps/web/scripts/price-probe.ts#L56-L56) | `56` | `56` |
| `assert` | `function` | [apps/web/scripts/project-add-probe.tsx](file://apps/web/scripts/project-add-probe.tsx#L14-L17) | `14` | `17` |
| `mockAdd` | `function` | [apps/web/scripts/project-add-probe.tsx](file://apps/web/scripts/project-add-probe.tsx#L56-L56) | `56` | `56` |
| `assert` | `function` | [apps/web/scripts/project-progress-probe.ts](file://apps/web/scripts/project-progress-probe.ts#L9-L12) | `9` | `12` |
| `assert` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L36-L43) | `36` | `43` |
| `Model` | `interface` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L47-L62) | `47` | `62` |
| `newModel` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L64-L72) | `64` | `72` |
| `World` | `interface` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L74-L80) | `74` | `80` |
| `runOld` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L83-L104) | `83` | `104` |
| `runNew` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L111-L150) | `111` | `150` |
| `mk` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L152-L156) | `152` | `156` |
| `triggerLama` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L250-L262) | `250` | `262` |
| `triggerBaru` | `function` | [apps/web/scripts/push-probe.ts](file://apps/web/scripts/push-probe.ts#L269-L280) | `269` | `280` |
| `assert` | `function` | [apps/web/scripts/qc-deep-link-probe.ts](file://apps/web/scripts/qc-deep-link-probe.ts#L10-L13) | `10` | `13` |
| `cek` | `function` | [apps/web/scripts/risk-auto-probe.ts](file://apps/web/scripts/risk-auto-probe.ts#L23-L30) | `23` | `30` |
| `firstId` | `function` | [apps/web/scripts/ssr-probe.tsx](file://apps/web/scripts/ssr-probe.tsx#L59-L60) | `59` | `60` |
| `row` | `function` | [apps/web/scripts/ssr-probe.tsx](file://apps/web/scripts/ssr-probe.tsx#L254-L254) | `254` | `254` |
| `j` | `function` | [apps/web/scripts/ssr-probe.tsx](file://apps/web/scripts/ssr-probe.tsx#L318-L320) | `318` | `320` |
| `enc` | `function` | [apps/web/scripts/ssr-probe.tsx](file://apps/web/scripts/ssr-probe.tsx#L434-L434) | `434` | `434` |
| `stub` | `function` | [apps/web/scripts/ssr-probe.tsx](file://apps/web/scripts/ssr-probe.tsx#L470-L473) | `470` | `473` |
| `assert` | `function` | [apps/web/scripts/stock-issue-probe.ts](file://apps/web/scripts/stock-issue-probe.ts#L6-L12) | `6` | `12` |
| `assert` | `function` | [apps/web/scripts/table-probe.ts](file://apps/web/scripts/table-probe.ts#L32-L35) | `32` | `35` |
| `asRec` | `function` | [apps/web/scripts/table-probe.ts](file://apps/web/scripts/table-probe.ts#L37-L37) | `37` | `37` |
| `urut` | `function` | [apps/web/scripts/table-probe.ts](file://apps/web/scripts/table-probe.ts#L124-L124) | `124` | `124` |
| `dalam` | `function` | [apps/web/scripts/table-probe.ts](file://apps/web/scripts/table-probe.ts#L250-L251) | `250` | `251` |
| `assert` | `function` | [apps/web/scripts/termin-probe.ts](file://apps/web/scripts/termin-probe.ts#L7-L13) | `7` | `13` |
| `total` | `function` | [apps/web/scripts/termin-probe.ts](file://apps/web/scripts/termin-probe.ts#L14-L14) | `14` | `14` |
| `assert` | `function` | [apps/web/scripts/time-probe.ts](file://apps/web/scripts/time-probe.ts#L26-L33) | `26` | `33` |
| `m` | `function` | [apps/web/scripts/time-probe.ts](file://apps/web/scripts/time-probe.ts#L125-L125) | `125` | `125` |
| `assert` | `function` | [apps/web/scripts/unit-conversion-probe.ts](file://apps/web/scripts/unit-conversion-probe.ts#L18-L24) | `18` | `24` |
| `assert` | `function` | [apps/web/scripts/wbs-flow-probe.ts](file://apps/web/scripts/wbs-flow-probe.ts#L14-L17) | `14` | `17` |
| `assert` | `function` | [apps/web/scripts/wo-probe.ts](file://apps/web/scripts/wo-probe.ts#L21-L24) | `21` | `24` |
| `Guard` | `function` | [apps/web/src/main.tsx](file://apps/web/src/main.tsx#L89-L96) | `89` | `96` |
| `CreatedRow` | `interface` | [services/api/scripts/drydock-booking-probe.ts](file://services/api/scripts/drydock-booking-probe.ts#L6-L6) | `6` | `6` |
| `runWithEnv` | `function` | [services/api/scripts/env-probe.ts](file://services/api/scripts/env-probe.ts#L6-L18) | `6` | `18` |
| `mulberry32` | `function` | [services/api/scripts/gen-seed-data.ts](file://services/api/scripts/gen-seed-data.ts#L14-L22) | `14` | `22` |
| `BoqRow` | `interface` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L5-L5) | `5` | `5` |
| `DocRow` | `interface` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L6-L6) | `6` | `6` |
| `PlannedItem` | `interface` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L7-L7) | `7` | `7` |
| `GroupPlan` | `interface` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L8-L19) | `8` | `19` |
| `BoqMigrationSummary` | `interface` | [services/api/scripts/migrate-boq-docs.ts](file://services/api/scripts/migrate-boq-docs.ts#L20-L25) | `20` | `25` |
| `UserRow` | `interface` | [services/api/scripts/migrate-roles.ts](file://services/api/scripts/migrate-roles.ts#L4-L8) | `4` | `8` |
| `assert` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L31-L38) | `31` | `38` |
| `Row` | `interface` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L79-L82) | `79` | `82` |
| `byOrder` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L89-L90) | `89` | `90` |
| `pullKeyset` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L94-L107) | `94` | `107` |
| `pullOffset` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L112-L122) | `112` | `122` |
| `build` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L124-L128) | `124` | `128` |
| `belumSentuh` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L130-L130) | `130` | `130` |
| `penanda` | `function` | [services/api/scripts/page-probe.ts](file://services/api/scripts/page-probe.ts#L133-L135) | `133` | `135` |
| `Sample` | `interface` | [services/api/scripts/pdf-db-probe.ts](file://services/api/scripts/pdf-db-probe.ts#L40-L43) | `40` | `43` |
| `ProbeResult` | `interface` | [services/api/scripts/security-probe.ts](file://services/api/scripts/security-probe.ts#L33-L41) | `33` | `41` |
| `UserRow` | `interface` | [services/api/src/app.ts](file://services/api/src/app.ts#L44-L54) | `44` | `54` |
| `AuditInput` | `interface` | [services/api/src/audit.ts](file://services/api/src/audit.ts#L5-L12) | `5` | `12` |
| `AuditWriteOptions` | `interface` | [services/api/src/audit.ts](file://services/api/src/audit.ts#L14-L17) | `14` | `17` |
| `DupRow` | `interface` | [services/api/src/auditDuplicates.ts](file://services/api/src/auditDuplicates.ts#L29-L32) | `29` | `32` |
| `AuthUser` | `interface` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L8-L20) | `8` | `20` |
| `FastifyRequest` | `interface` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L23-L25) | `23` | `25` |
| `CachedUserRecord` | `interface` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L114-L123) | `114` | `123` |
| `SeedAccount` | `interface` | [services/api/src/auth.ts](file://services/api/src/auth.ts#L256-L261) | `256` | `261` |
| `Row` | `interface` | [services/api/src/boqDocs.ts](file://services/api/src/boqDocs.ts#L29-L29) | `29` | `29` |
| `Row` | `interface` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L17-L17) | `17` | `17` |
| `CoChange` | `interface` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L29-L29) | `29` | `29` |
| `ApplyResult` | `interface` | [services/api/src/changeOrders.ts](file://services/api/src/changeOrders.ts#L90-L90) | `90` | `90` |
| `ExecResult` | `interface` | [services/api/src/db.ts](file://services/api/src/db.ts#L10-L12) | `10` | `12` |
| `TxContext` | `interface` | [services/api/src/db.ts](file://services/api/src/db.ts#L14-L17) | `14` | `17` |
| `Env` | `interface` | [services/api/src/env.ts](file://services/api/src/env.ts#L3-L17) | `3` | `17` |
| `ConversionRule` | `interface` | [services/api/src/inventoryConversion.ts](file://services/api/src/inventoryConversion.ts#L3-L7) | `3` | `7` |
| `Row` | `interface` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L9-L9) | `9` | `9` |
| `IssueInput` | `interface` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L17-L24) | `17` | `24` |
| `IssueOutput` | `interface` | [services/api/src/inventoryIssue.ts](file://services/api/src/inventoryIssue.ts#L26-L26) | `26` | `26` |
| `Entry` | `interface` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L19-L19) | `19` | `19` |
| `CacheGeneration` | `interface` | [services/api/src/listCache.ts](file://services/api/src/listCache.ts#L20-L20) | `20` | `20` |
| `MaterialRequestInput` | `interface` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L25-L39) | `25` | `39` |
| `MaterialRequestResult` | `interface` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L41-L53) | `41` | `53` |
| `Row` | `interface` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L64-L64) | `64` | `64` |
| `FulfillResult` | `interface` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L186-L193) | `186` | `193` |
| `DecisionResult` | `interface` | [services/api/src/materialRequests.ts](file://services/api/src/materialRequests.ts#L272-L272) | `272` | `272` |
| `Row` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L21-L21) | `21` | `21` |
| `ReceiveLineInput` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L82-L89) | `82` | `89` |
| `ReceiveInput` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L91-L101) | `91` | `101` |
| `ReceiveResult` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L103-L107) | `103` | `107` |
| `ReturnInput` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L317-L317) | `317` | `317` |
| `ReturnResult` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L318-L318) | `318` | `318` |
| `ReassignInput` | `interface` | [services/api/src/poFulfillment.ts](file://services/api/src/poFulfillment.ts#L422-L422) | `422` | `422` |
| `makeDeveloperMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L97-L105) | `97` | `105` |
| `makeDirekturMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L107-L115) | `107` | `115` |
| `makeManagerMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L117-L133) | `117` | `133` |
| `makeFinanceMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L135-L157) | `135` | `157` |
| `makeHrMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L159-L173) | `159` | `173` |
| `makeProcurementMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L175-L195) | `175` | `195` |
| `makeGudangMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L197-L213) | `197` | `213` |
| `makeProyekMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L215-L248) | `215` | `248` |
| `makeMekanikMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L250-L265) | `250` | `265` |
| `makeQcMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L267-L288) | `267` | `288` |
| `makeSubkonMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L290-L302) | `290` | `302` |
| `makeEquipmentMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L304-L318) | `304` | `318` |
| `makeDrydockMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L320-L332) | `320` | `332` |
| `makeViewerMatrix` | `function` | [services/api/src/policy.ts](file://services/api/src/policy.ts#L334-L349) | `334` | `349` |
| `RateLimitCheck` | `interface` | [services/api/src/rateLimit.ts](file://services/api/src/rateLimit.ts#L4-L7) | `4` | `7` |
| `canWriteCollection` | `function` | [services/api/src/rbac.ts](file://services/api/src/rbac.ts#L23-L25) | `23` | `25` |
| `RefDef` | `interface` | [services/api/src/refs.ts](file://services/api/src/refs.ts#L8-L13) | `8` | `13` |
| `Manifest` | `interface` | [services/api/src/restore.ts](file://services/api/src/restore.ts#L7-L13) | `7` | `13` |
| `ChecklistItem` | `interface` | [services/api/src/scoring.ts](file://services/api/src/scoring.ts#L11-L11) | `11` | `11` |
| `ChecklistTemplate` | `interface` | [services/api/src/scoring.ts](file://services/api/src/scoring.ts#L12-L12) | `12` | `12` |
| `SeedRow` | `interface` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L11-L11) | `11` | `11` |
| `WbsSeed` | `interface` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L13-L13) | `13` | `13` |
| `TeamSeed` | `interface` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L14-L14) | `14` | `14` |
| `S` | `function` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L16-L17) | `16` | `17` |
| `H` | `function` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L225-L228) | `225` | `228` |
| `buildWbsSeeds` | `function` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L265-L273) | `265` | `273` |
| `buildTeamSeeds` | `function` | [services/api/src/seedData.ts](file://services/api/src/seedData.ts#L275-L277) | `275` | `277` |
| `MirrorRow` | `interface` | [services/api/src/seedFeMirror.ts](file://services/api/src/seedFeMirror.ts#L3-L8) | `3` | `8` |
| `Item` | `interface` | [services/api/src/seedMirror.ts](file://services/api/src/seedMirror.ts#L15-L19) | `15` | `19` |
| `MirrorRow` | `interface` | [services/api/src/seedMirror.ts](file://services/api/src/seedMirror.ts#L105-L110) | `105` | `110` |
| `toRows` | `function` | [services/api/src/seedMirror.ts](file://services/api/src/seedMirror.ts#L112-L126) | `112` | `126` |
| `RatesModule` | `interface` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L43-L46) | `43` | `46` |
| `Row` | `interface` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L78-L83) | `78` | `83` |
| `Change` | `interface` | [services/api/src/seedReprice.ts](file://services/api/src/seedReprice.ts#L85-L91) | `85` | `91` |
| `mulberry32` | `function` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L11-L19) | `11` | `19` |
| `Row` | `interface` | [services/api/src/seedWhatIf.ts](file://services/api/src/seedWhatIf.ts#L37-L37) | `37` | `37` |
| `Row` | `interface` | [services/api/src/serviceApproval.ts](file://services/api/src/serviceApproval.ts#L18-L18) | `18` | `18` |
| `ScopeUser` | `interface` | [services/api/src/teamScope.ts](file://services/api/src/teamScope.ts#L12-L12) | `12` | `12` |
| `DemoUser` | `interface` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L8-L15) | `8` | `15` |
| `Session` | `interface` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L55-L69) | `55` | `69` |
| `BackendLoginUser` | `interface` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L93-L101) | `93` | `101` |
| `AuthCtx` | `interface` | [apps/web/src/auth/auth.tsx](file://apps/web/src/auth/auth.tsx#L103-L107) | `103` | `107` |
| `DemoRole` | `interface` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L14-L14) | `14` | `14` |
| `Origin` | `interface` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L16-L16) | `16` | `16` |
| `LoginRole` | `interface` | [apps/web/src/auth/demoSwitch.ts](file://apps/web/src/auth/demoSwitch.ts#L96-L96) | `96` | `96` |
| `AlertProps` | `interface` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L15-L34) | `15` | `34` |
| `AlertModalProps` | `interface` | [apps/web/src/components/Alert.tsx](file://apps/web/src/components/Alert.tsx#L167-L179) | `167` | `179` |
| `BannerDismiss` | `interface` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L168-L174) | `168` | `174` |
| `AlertRow` | `function` | [apps/web/src/components/AlertBanner.tsx](file://apps/web/src/components/AlertBanner.tsx#L386-L411) | `386` | `411` |
| `AuditRow` | `interface` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L5-L11) | `5` | `11` |
| `AuditChange` | `interface` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L13-L17) | `13` | `17` |
| `HistoryEntryItem` | `interface` | [apps/web/src/components/ChangeHistory.tsx](file://apps/web/src/components/ChangeHistory.tsx#L50-L59) | `50` | `59` |
| `DateInput` | `function` | [apps/web/src/components/DateInput.tsx](file://apps/web/src/components/DateInput.tsx#L1-L37) | `1` | `37` |
| `PreviewDoc` | `interface` | [apps/web/src/components/DocumentPreview.tsx](file://apps/web/src/components/DocumentPreview.tsx#L24-L31) | `24` | `31` |
| `DocumentPreviewModal` | `function` | [apps/web/src/components/DocumentPreview.tsx](file://apps/web/src/components/DocumentPreview.tsx#L230-L239) | `230` | `239` |
| `FlowNode` | `interface` | [apps/web/src/components/FlowTree.tsx](file://apps/web/src/components/FlowTree.tsx#L9-L23) | `9` | `23` |
| `PhotoUploadItem` | `interface` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L6-L9) | `6` | `9` |
| `PhotoUploaderLabels` | `interface` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L11-L19) | `11` | `19` |
| `PendingPhoto` | `interface` | [apps/web/src/components/PhotoUploader.tsx](file://apps/web/src/components/PhotoUploader.tsx#L21-L25) | `21` | `25` |
| `SearchSelectOption` | `interface` | [apps/web/src/components/SearchSelect.tsx](file://apps/web/src/components/SearchSelect.tsx#L5-L9) | `5` | `9` |
| `ServiceNote` | `interface` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L31-L36) | `31` | `36` |
| `ServiceNotesLabels` | `interface` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L43-L64) | `43` | `64` |
| `ServiceNotesProps` | `interface` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L66-L71) | `66` | `71` |
| `ServiceNotesButton` | `function` | [apps/web/src/components/ServiceNotes.tsx](file://apps/web/src/components/ServiceNotes.tsx#L224-L241) | `224` | `241` |
| `StatusChipOption` | `interface` | [apps/web/src/components/StatusChips.tsx](file://apps/web/src/components/StatusChips.tsx#L4-L8) | `4` | `8` |
| `StatusChips` | `function` | [apps/web/src/components/StatusChips.tsx](file://apps/web/src/components/StatusChips.tsx#L11-L70) | `11` | `70` |
| `ToastAction` | `interface` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L7-L10) | `7` | `10` |
| `ToastOptions` | `interface` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L12-L19) | `12` | `19` |
| `ToastItem` | `interface` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L21-L30) | `21` | `30` |
| `ToastCardProps` | `interface` | [apps/web/src/components/Toast.tsx](file://apps/web/src/components/Toast.tsx#L173-L176) | `173` | `176` |
| `FlashState` | `interface` | [apps/web/src/components/rowHighlight.ts](file://apps/web/src/components/rowHighlight.ts#L25-L30) | `25` | `30` |
| `RowHighlightInput` | `interface` | [apps/web/src/components/rowHighlight.ts](file://apps/web/src/components/rowHighlight.ts#L32-L41) | `32` | `41` |
| `Stagger` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L36-L63) | `36` | `63` |
| `StaggerItem` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L65-L83) | `65` | `83` |
| `Card` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L87-L97) | `87` | `97` |
| `CardHeader` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L99-L117) | `99` | `117` |
| `GlowCard` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L119-L133) | `119` | `133` |
| `Badge` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L174-L208) | `174` | `208` |
| `StatusBadge` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L305-L308) | `305` | `308` |
| `Donut` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L423-L457) | `423` | `457` |
| `RadialGauge` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L459-L499) | `459` | `499` |
| `ChartTooltip` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L501-L533) | `501` | `533` |
| `PageHeader` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L559-L590) | `559` | `590` |
| `ProgressBar` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L593-L625) | `593` | `625` |
| `Tabs` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L627-L671) | `627` | `671` |
| `EmptyState` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L673-L689) | `673` | `689` |
| `ErrorBoundaryState` | `interface` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L693-L695) | `693` | `695` |
| `Skeleton` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L779-L781) | `779` | `781` |
| `ConfirmModal` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L900-L943) | `900` | `943` |
| `Field` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L945-L961) | `945` | `961` |
| `FormGrid` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L963-L965) | `963` | `965` |
| `PickerOption` | `interface` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1068-L1072) | `1068` | `1072` |
| `SortState` | `interface` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1284-L1284) | `1284` | `1284` |
| `SortTh` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1332-L1365) | `1332` | `1365` |
| `ServerPage` | `interface` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1571-L1577) | `1571` | `1577` |
| `RowAction` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1724-L1761) | `1724` | `1761` |
| `FlowStrip` | `function` | [apps/web/src/components/ui.tsx](file://apps/web/src/components/ui.tsx#L1943-L1993) | `1943` | `1993` |
| `DeepLinkParams` | `interface` | [apps/web/src/components/useDeepLink.ts](file://apps/web/src/components/useDeepLink.ts#L28-L34) | `28` | `34` |
| `PdfDocState` | `interface` | [apps/web/src/components/usePdfDoc.ts](file://apps/web/src/components/usePdfDoc.ts#L19-L30) | `19` | `30` |
| `CoaExcel` | `interface` | [apps/web/src/data/financeExcel.ts](file://apps/web/src/data/financeExcel.ts#L7-L7) | `7` | `7` |
| `ApExcel` | `interface` | [apps/web/src/data/financeExcel.ts](file://apps/web/src/data/financeExcel.ts#L212-L212) | `212` | `212` |
| `ArExcel` | `interface` | [apps/web/src/data/financeExcel.ts](file://apps/web/src/data/financeExcel.ts#L269-L269) | `269` | `269` |
| `KasBankExcel` | `interface` | [apps/web/src/data/financeExcel.ts](file://apps/web/src/data/financeExcel.ts#L338-L338) | `338` | `338` |
| `LaporanSnapshot` | `interface` | [apps/web/src/data/financeExcel.ts](file://apps/web/src/data/financeExcel.ts#L375-L377) | `375` | `377` |
| `lsPut` | `function` | [apps/web/src/data/idb.ts](file://apps/web/src/data/idb.ts#L190-L198) | `190` | `198` |
| `DesignStage` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L13-L19) | `13` | `19` |
| `Project` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L21-L36) | `21` | `36` |
| `InventoryItem` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L443-L460) | `443` | `460` |
| `ServiceRecord` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L563-L583) | `563` | `583` |
| `MaterialRequest` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L597-L615) | `597` | `615` |
| `BomItem` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L619-L619) | `619` | `619` |
| `Sparepart` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L642-L655) | `642` | `655` |
| `Invoice` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L666-L674) | `666` | `674` |
| `Activity` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L789-L797) | `789` | `797` |
| `BoQItem` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L996-L1014) | `996` | `1014` |
| `BoQDoc` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L1040-L1056) | `1040` | `1056` |
| `mk` | `function` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L1092-L1092) | `1092` | `1092` |
| `ChecklistItemDef` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L1122-L1122) | `1122` | `1122` |
| `ChecklistTemplateDef` | `interface` | [apps/web/src/data/index.ts](file://apps/web/src/data/index.ts#L1123-L1123) | `1123` | `1123` |
| `OfflinePersistenceIO` | `interface` | [apps/web/src/data/offlinePersistence.ts](file://apps/web/src/data/offlinePersistence.ts#L1-L5) | `1` | `5` |
| `ProjectExistenceChange` | `interface` | [apps/web/src/data/projectPullScope.ts](file://apps/web/src/data/projectPullScope.ts#L1-L5) | `1` | `5` |
| `WO_MS` | `function` | [apps/web/src/data/seeds.ts](file://apps/web/src/data/seeds.ts#L33-L34) | `33` | `34` |
| `SessionFence` | `interface` | [apps/web/src/data/sessionFence.ts](file://apps/web/src/data/sessionFence.ts#L1-L4) | `1` | `4` |
| `ConflictHoldStorage` | `interface` | [apps/web/src/data/sideMapConflictHolds.ts](file://apps/web/src/data/sideMapConflictHolds.ts#L3-L7) | `3` | `7` |
| `StoreItem` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L57-L60) | `57` | `60` |
| `WbsPhoto` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L62-L66) | `62` | `66` |
| `WbsAssignee` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L68-L73) | `68` | `73` |
| `WbsHistoryItem` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L75-L86) | `75` | `86` |
| `WbsItem` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L88-L109) | `88` | `109` |
| `StoreShape` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L111-L181) | `111` | `181` |
| `StoreCtx` | `interface` | [apps/web/src/data/store.tsx](file://apps/web/src/data/store.tsx#L646-L673) | `646` | `673` |
| `MaterialRequestArgs` | `interface` | [apps/web/src/data/useMaterialRequest.ts](file://apps/web/src/data/useMaterialRequest.ts#L15-L24) | `15` | `24` |
| `MaterialRequestResult` | `interface` | [apps/web/src/data/useMaterialRequest.ts](file://apps/web/src/data/useMaterialRequest.ts#L26-L38) | `26` | `38` |
| `materialStatus` | `function` | [apps/web/src/data/useMaterialRequest.ts](file://apps/web/src/data/useMaterialRequest.ts#L49-L51) | `49` | `51` |
| `FulfillResult` | `interface` | [apps/web/src/data/useMaterialRequest.ts](file://apps/web/src/data/useMaterialRequest.ts#L226-L232) | `226` | `232` |
| `ModuleSync` | `interface` | [apps/web/src/data/useModuleSync.ts](file://apps/web/src/data/useModuleSync.ts#L97-L108) | `97` | `108` |
| `ReceiveLineArgs` | `interface` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L42-L42) | `42` | `42` |
| `ReceiveArgs` | `interface` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L43-L43) | `43` | `43` |
| `ReceiveOutcome` | `interface` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L44-L44) | `44` | `44` |
| `ReturnArgs` | `interface` | [apps/web/src/data/usePoActions.ts](file://apps/web/src/data/usePoActions.ts#L45-L45) | `45` | `45` |
| `StockIssueArgs` | `interface` | [apps/web/src/data/useStockIssue.ts](file://apps/web/src/data/useStockIssue.ts#L10-L17) | `10` | `17` |
| `LangCtx` | `interface` | [apps/web/src/i18n/LanguageContext.tsx](file://apps/web/src/i18n/LanguageContext.tsx#L20-L24) | `20` | `24` |
| `DemoStep` | `interface` | [apps/web/src/i18n/n_demo.ts](file://apps/web/src/i18n/n_demo.ts#L5-L9) | `5` | `9` |
| `DemoScenario` | `interface` | [apps/web/src/i18n/n_demo.ts](file://apps/web/src/i18n/n_demo.ts#L11-L17) | `11` | `17` |
| `Dict` | `interface` | [apps/web/src/i18n/types.ts](file://apps/web/src/i18n/types.ts#L6-L15) | `6` | `15` |
| `Geo` | `interface` | [apps/web/src/security/watermark.tsx](file://apps/web/src/security/watermark.tsx#L44-L48) | `44` | `48` |
| `Scenario` | `interface` | [apps/web/src/pages/Analytics.tsx](file://apps/web/src/pages/Analytics.tsx#L104-L104) | `104` | `104` |
| `loadAttentionCategory` | `function` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L104-L112) | `104` | `112` |
| `BranchTarget` | `interface` | [apps/web/src/pages/Dashboard.tsx](file://apps/web/src/pages/Dashboard.tsx#L217-L217) | `217` | `217` |
| `CashJournalArgs` | `interface` | [apps/web/src/services/autoJournal.ts](file://apps/web/src/services/autoJournal.ts#L6-L20) | `6` | `20` |
| `resolveApiBase` | `function` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L88-L92) | `88` | `92` |
| `OkEnvelope` | `interface` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L103-L106) | `103` | `106` |
| `FailEnvelope` | `interface` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L108-L112) | `108` | `112` |
| `ApiFetchInit` | `interface` | [apps/web/src/services/http.ts](file://apps/web/src/services/http.ts#L174-L182) | `174` | `182` |
| `newId` | `function` | [apps/web/src/services/ids.ts](file://apps/web/src/services/ids.ts#L4-L10) | `4` | `10` |
| `PdfRenderResult` | `interface` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L43-L54) | `43` | `54` |
| `PdfRequest` | `interface` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L77-L90) | `77` | `90` |
| `pdfKinds` | `function` | [apps/web/src/services/pdfClient.ts](file://apps/web/src/services/pdfClient.ts#L215-L224) | `215` | `224` |
| `ListFilter` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L16-L19) | `16` | `19` |
| `PagedQuery` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L22-L29) | `22` | `29` |
| `PagedResult` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L31-L37) | `31` | `37` |
| `Repository` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L39-L50) | `39` | `50` |
| `Snapshot` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L52-L55) | `52` | `55` |
| `BackendRow` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L59-L64) | `59` | `64` |
| `BackendPage` | `interface` | [apps/web/src/services/repositories.ts](file://apps/web/src/services/repositories.ts#L110-L117) | `110` | `117` |
| `Alert` | `interface` | [apps/web/src/utils/alerts.ts](file://apps/web/src/utils/alerts.ts#L7-L12) | `7` | `12` |
| `AuditDeleteRow` | `interface` | [apps/web/src/utils/audit.ts](file://apps/web/src/utils/audit.ts#L16-L22) | `16` | `22` |
| `isLevel` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L28-L29) | `28` | `29` |
| `restoreAll` | `function` | [apps/web/src/utils/bannerDismiss.ts](file://apps/web/src/utils/bannerDismiss.ts#L83-L88) | `83` | `88` |
| `PlanningSubclass` | `interface` | [apps/web/src/utils/classApprovalBlockers.ts](file://apps/web/src/utils/classApprovalBlockers.ts#L7-L12) | `7` | `12` |
| `StageBlocker` | `interface` | [apps/web/src/utils/classApprovalBlockers.ts](file://apps/web/src/utils/classApprovalBlockers.ts#L27-L35) | `27` | `35` |
| `TransitionBlockerData` | `interface` | [apps/web/src/utils/classApprovalBlockers.ts](file://apps/web/src/utils/classApprovalBlockers.ts#L37-L43) | `37` | `43` |
| `DeadReason` | `interface` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L25-L36) | `25` | `36` |
| `DeadStockRow` | `interface` | [apps/web/src/utils/deadStock.ts](file://apps/web/src/utils/deadStock.ts#L187-L195) | `187` | `195` |
| `Attachment` | `interface` | [apps/web/src/utils/docAttachment.ts](file://apps/web/src/utils/docAttachment.ts#L39-L44) | `39` | `44` |
| `DayOffsets` | `interface` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L3-L6) | `3` | `6` |
| `SlotDateFields` | `interface` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L8-L13) | `8` | `13` |
| `BookingDateValues` | `interface` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L40-L43) | `40` | `43` |
| `BookingDateEdits` | `interface` | [apps/web/src/utils/drydockBookingDates.ts](file://apps/web/src/utils/drydockBookingDates.ts#L45-L48) | `45` | `48` |
| `EmployeeOptionExtra` | `interface` | [apps/web/src/utils/employeeOptions.ts](file://apps/web/src/utils/employeeOptions.ts#L30-L33) | `30` | `33` |
| `EquipmentNotificationTarget` | `interface` | [apps/web/src/utils/equipmentNotifications.ts](file://apps/web/src/utils/equipmentNotifications.ts#L1-L4) | `1` | `4` |
| `ExcelSheet` | `interface` | [apps/web/src/utils/export.ts](file://apps/web/src/utils/export.ts#L41-L46) | `41` | `46` |
| `nowIso` | `function` | [apps/web/src/utils/format.ts](file://apps/web/src/utils/format.ts#L117-L119) | `117` | `119` |
| `WarnTone` | `interface` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L31-L39) | `31` | `39` |
| `CategoryRule` | `interface` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L52-L59) | `52` | `59` |
| `CategoryWarningSummary` | `interface` | [apps/web/src/utils/inventoryWarn.ts](file://apps/web/src/utils/inventoryWarn.ts#L191-L202) | `191` | `202` |
| `findItemPage` | `function` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L15-L24) | `15` | `24` |
| `ReconcileResult` | `interface` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L66-L73) | `66` | `73` |
| `preserveScroll` | `function` | [apps/web/src/utils/listPersistence.ts](file://apps/web/src/utils/listPersistence.ts#L133-L147) | `133` | `147` |
| `MaintHistoryEntry` | `interface` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L56-L62) | `56` | `62` |
| `MaintMaterial` | `interface` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L82-L90) | `82` | `90` |
| `MaintCostBreakdown` | `interface` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L130-L138) | `130` | `138` |
| `StockPlanItem` | `interface` | [apps/web/src/utils/maintenance.ts](file://apps/web/src/utils/maintenance.ts#L174-L183) | `174` | `183` |
| `ModuleAlertItem` | `interface` | [apps/web/src/utils/moduleAlerts.ts](file://apps/web/src/utils/moduleAlerts.ts#L44-L63) | `44` | `63` |
| `MonthPoint` | `interface` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L62-L78) | `62` | `78` |
| `MonthAxisOptions` | `interface` | [apps/web/src/utils/monthAxis.ts](file://apps/web/src/utils/monthAxis.ts#L80-L91) | `80` | `91` |
| `OvertimeRules` | `interface` | [apps/web/src/utils/overtime.ts](file://apps/web/src/utils/overtime.ts#L3-L3) | `3` | `3` |
| `BoqPrintItem` | `interface` | [apps/web/src/utils/printBoqHtml.ts](file://apps/web/src/utils/printBoqHtml.ts#L4-L13) | `4` | `13` |
| `BoqPrintData` | `interface` | [apps/web/src/utils/printBoqHtml.ts](file://apps/web/src/utils/printBoqHtml.ts#L15-L30) | `15` | `30` |
| `BookingCostRow` | `interface` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L70-L80) | `70` | `80` |
| `MaintCostRow` | `interface` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L123-L141) | `123` | `141` |
| `EquipmentCostSummary` | `interface` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L183-L198) | `183` | `198` |
| `projectCostPatch` | `function` | [apps/web/src/utils/projectCost.ts](file://apps/web/src/utils/projectCost.ts#L256-L265) | `256` | `265` |
| `DelayWbsItem` | `interface` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L35-L40) | `35` | `40` |
| `ProjectDelayDetails` | `interface` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L42-L49) | `42` | `49` |
| `StatusOverrideLike` | `interface` | [apps/web/src/utils/projectDelay.ts](file://apps/web/src/utils/projectDelay.ts#L97-L102) | `97` | `102` |
| `CalcProgressOptions` | `interface` | [apps/web/src/utils/projectProgress.ts](file://apps/web/src/utils/projectProgress.ts#L5-L8) | `5` | `8` |
| `MarketRate` | `interface` | [apps/web/src/utils/rates.ts](file://apps/web/src/utils/rates.ts#L15-L24) | `15` | `24` |
| `fuelPricePerLiter` | `function` | [apps/web/src/utils/rates.ts](file://apps/web/src/utils/rates.ts#L110-L112) | `110` | `112` |
| `RiskDraft` | `interface` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L24-L33) | `24` | `33` |
| `RiskAutoResult` | `interface` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L35-L40) | `35` | `40` |
| `WbsTaskLike` | `interface` | [apps/web/src/utils/riskAuto.ts](file://apps/web/src/utils/riskAuto.ts#L100-L106) | `100` | `106` |
| `SbInvoiceInput` | `interface` | [apps/web/src/utils/sb.ts](file://apps/web/src/utils/sb.ts#L22-L30) | `22` | `30` |
| `SbInvoiceMath` | `interface` | [apps/web/src/utils/sb.ts](file://apps/web/src/utils/sb.ts#L32-L42) | `32` | `42` |
| `ScopeItem` | `interface` | [apps/web/src/utils/scope.ts](file://apps/web/src/utils/scope.ts#L3-L7) | `3` | `7` |
| `ScItem` | `interface` | [apps/web/src/utils/scoring.ts](file://apps/web/src/utils/scoring.ts#L3-L3) | `3` | `3` |
| `ScTemplate` | `interface` | [apps/web/src/utils/scoring.ts](file://apps/web/src/utils/scoring.ts#L4-L4) | `4` | `4` |
| `MonthSeriesRow` | `interface` | [apps/web/src/utils/series.ts](file://apps/web/src/utils/series.ts#L22-L26) | `22` | `26` |
| `settingLabel` | `function` | [apps/web/src/utils/settings.ts](file://apps/web/src/utils/settings.ts#L12-L14) | `12` | `14` |
| `StockState` | `interface` | [apps/web/src/utils/stockIssue.ts](file://apps/web/src/utils/stockIssue.ts#L12-L12) | `12` | `12` |
| `TerminPart` | `interface` | [apps/web/src/utils/termin.ts](file://apps/web/src/utils/termin.ts#L7-L13) | `7` | `13` |
| `TerminScheme` | `interface` | [apps/web/src/utils/termin.ts](file://apps/web/src/utils/termin.ts#L15-L18) | `15` | `18` |
| `TerminLine` | `interface` | [apps/web/src/utils/termin.ts](file://apps/web/src/utils/termin.ts#L20-L20) | `20` | `20` |
| `UnitConversionDimensions` | `interface` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L3-L8) | `3` | `8` |
| `UnitConversion` | `interface` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L11-L15) | `11` | `15` |
| `UnitConversionDraft` | `interface` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L17-L24) | `17` | `24` |
| `UnitConversionRule` | `interface` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L26-L29) | `26` | `29` |
| `ExistingUnitConversionState` | `interface` | [apps/web/src/utils/unitConversion.ts](file://apps/web/src/utils/unitConversion.ts#L123-L130) | `123` | `130` |
| `UrlParamCodec` | `interface` | [apps/web/src/utils/urlParam.ts](file://apps/web/src/utils/urlParam.ts#L20-L25) | `20` | `25` |
| `Warehouse` | `interface` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L20-L31) | `20` | `31` |
| `WarehouseStock` | `interface` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L139-L151) | `139` | `151` |
| `MovementWarehouseFlow` | `interface` | [apps/web/src/utils/warehouse.ts](file://apps/web/src/utils/warehouse.ts#L182-L191) | `182` | `191` |
| `WoMilestone` | `interface` | [apps/web/src/utils/woMilestones.ts](file://apps/web/src/utils/woMilestones.ts#L21-L27) | `21` | `27` |
| `pdf` | `function` | [services/api/src/__tests__/files.test.ts](file://services/api/src/__tests__/files.test.ts#L13-L13) | `13` | `13` |
| `pdf` | `function` | [services/api/src/__tests__/pure.test.ts](file://services/api/src/__tests__/pure.test.ts#L24-L24) | `24` | `24` |
| `Ctx` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L31-L43) | `31` | `43` |
| `DrawRecord` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L46-L58) | `46` | `58` |
| `TextOpts` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L60-L68) | `60` | `68` |
| `Segment` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L156-L160) | `156` | `160` |
| `BlockPlan` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L162-L169) | `162` | `169` |
| `Block` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L171-L180) | `171` | `180` |
| `KopSpec` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L186-L193) | `186` | `193` |
| `ParagraphSpec` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L327-L336) | `327` | `336` |
| `KvSpec` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L373-L380) | `373` | `380` |
| `TableSpec` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L440-L456) | `440` | `456` |
| `LaidCell` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L475-L478) | `475` | `478` |
| `LaidRow` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L480-L484) | `480` | `484` |
| `SignatureSpec` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L736-L741) | `736` | `741` |
| `ImageSpec` | `interface` | [services/api/src/pdf/blocks.ts](file://services/api/src/pdf/blocks.ts#L798-L806) | `798` | `806` |
| `ChartCtx` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L23-L31) | `23` | `31` |
| `Series` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L33-L37) | `33` | `37` |
| `Axes` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L187-L194) | `187` | `194` |
| `CategorySeries` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L196-L200) | `196` | `200` |
| `StackedSpec` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L202-L204) | `202` | `204` |
| `LineSpec` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L206-L211) | `206` | `211` |
| `DonutSpec` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L213-L219) | `213` | `219` |
| `HbarSpec` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L221-L226) | `221` | `226` |
| `ParetoSpec` | `interface` | [services/api/src/pdf/chart.ts](file://services/api/src/pdf/chart.ts#L228-L233) | `228` | `233` |
| `DocOptions` | `interface` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L25-L41) | `25` | `41` |
| `RenderResult` | `interface` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L43-L60) | `43` | `60` |
| `doc` | `function` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L273-L275) | `273` | `275` |
| `GeometryProblem` | `interface` | [services/api/src/pdf/document.ts](file://services/api/src/pdf/document.ts#L286-L294) | `286` | `294` |
| `FontSpec` | `interface` | [services/api/src/pdf/font.ts](file://services/api/src/pdf/font.ts#L27-L32) | `27` | `32` |
| `Metrics` | `interface` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L44-L49) | `44` | `49` |
| `lineHeight` | `function` | [services/api/src/pdf/measure.ts](file://services/api/src/pdf/measure.ts#L151-L153) | `151` | `153` |
| `RenderContext` | `interface` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L85-L92) | `85` | `92` |
| `Recipe` | `interface` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L95-L110) | `95` | `110` |
| `RecipeView` | `interface` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L1346-L1354) | `1346` | `1354` |
| `view` | `function` | [services/api/src/pdf/registry.ts](file://services/api/src/pdf/registry.ts#L1356-L1358) | `1356` | `1358` |
| `RenderModelRow` | `interface` | [services/api/src/pdf/renderStore.ts](file://services/api/src/pdf/renderStore.ts#L22-L36) | `22` | `36` |
| `RenderModelInput` | `interface` | [services/api/src/pdf/renderStore.ts](file://services/api/src/pdf/renderStore.ts#L38-L49) | `38` | `49` |
| `RawRow` | `interface` | [services/api/src/pdf/renderStore.ts](file://services/api/src/pdf/renderStore.ts#L113-L127) | `113` | `127` |
| `listRenderHistory` | `function` | [services/api/src/pdf/renderStore.ts](file://services/api/src/pdf/renderStore.ts#L163-L183) | `163` | `183` |
| `stamp` | `function` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L81-L83) | `81` | `83` |
| `MonthPoint` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L129-L140) | `129` | `140` |
| `Collections` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L142-L169) | `142` | `169` |
| `PortfolioKpi` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L195-L214) | `195` | `214` |
| `PeriodCash` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L258-L284) | `258` | `284` |
| `ProjectReport` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L324-L353) | `324` | `353` |
| `EquipmentCost` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L399-L404) | `399` | `404` |
| `PayrollRecap` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L457-L474) | `457` | `474` |
| `ThrRecap` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L518-L524) | `518` | `524` |
| `NcrBucket` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L558-L565) | `558` | `565` |
| `ProfitRow` | `interface` | [services/api/src/pdf/reports.ts](file://services/api/src/pdf/reports.ts#L585-L591) | `585` | `591` |
| `PageSpec` | `interface` | [services/api/src/pdf/theme.ts](file://services/api/src/pdf/theme.ts#L13-L17) | `13` | `17` |
| `IngestResult` | `interface` | [services/api/src/routes/attendanceIngest.ts](file://services/api/src/routes/attendanceIngest.ts#L47-L47) | `47` | `47` |
| `AuditRow` | `interface` | [services/api/src/routes/audit.ts](file://services/api/src/routes/audit.ts#L7-L16) | `7` | `16` |
| `StaleWriteError` | `class` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L35-L35) | `35` | `35` |
| `Row` | `interface` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L188-L193) | `188` | `193` |
| `DrydockRange` | `interface` | [services/api/src/routes/crud.ts](file://services/api/src/routes/crud.ts#L261-L261) | `261` | `261` |
| `PageCursor` | `interface` | [services/api/src/routes/crudCursor.ts](file://services/api/src/routes/crudCursor.ts#L15-L18) | `15` | `18` |
| `UserRow` | `interface` | [services/api/src/routes/demoSwitch.ts](file://services/api/src/routes/demoSwitch.ts#L33-L42) | `33` | `42` |
| `RenderBody` | `interface` | [services/api/src/routes/pdf.ts](file://services/api/src/routes/pdf.ts#L25-L35) | `25` | `35` |
| `realDate` | `function` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L35-L35) | `35` | `35` |
| `QrRecord` | `interface` | [services/api/src/routes/publicLeave.ts](file://services/api/src/routes/publicLeave.ts#L66-L66) | `66` | `66` |
| `WbsPhotoRow` | `interface` | [services/api/src/routes/readModels.ts](file://services/api/src/routes/readModels.ts#L17-L17) | `17` | `17` |
| `UserRow` | `interface` | [services/api/src/routes/users.ts](file://services/api/src/routes/users.ts#L21-L31) | `21` | `31` |
| `toPublic` | `function` | [services/api/src/routes/users.ts](file://services/api/src/routes/users.ts#L33-L51) | `33` | `51` |
| `SideRow` | `interface` | [services/api/src/routes/wbs.ts](file://services/api/src/routes/wbs.ts#L19-L22) | `19` | `22` |
| `SideWriteOutcome` | `interface` | [services/api/src/routes/wbs.ts](file://services/api/src/routes/wbs.ts#L24-L30) | `24` | `30` |
| `ProjectScopeUser` | `interface` | [services/api/src/routes/wbs.ts](file://services/api/src/routes/wbs.ts#L32-L36) | `32` | `36` |
| `NodeGlobalScope` | `interface` | [apps/web/src/components/__tests__/toastAlert.test.ts](file://apps/web/src/components/__tests__/toastAlert.test.ts#L7-L10) | `7` | `10` |
| `constructor` | `method` | [apps/web/src/components/__tests__/toastAlert.test.ts](file://apps/web/src/components/__tests__/toastAlert.test.ts#L19-L22) | `19` | `22` |
| `ToastEventDetail` | `interface` | [apps/web/src/components/__tests__/toastAlert.test.ts](file://apps/web/src/components/__tests__/toastAlert.test.ts#L26-L33) | `26` | `33` |
| `CatatRow` | `interface` | [apps/web/src/pages/absensi/Absensi.tsx](file://apps/web/src/pages/absensi/Absensi.tsx#L51-L56) | `51` | `56` |
| `Punch` | `interface` | [apps/web/src/pages/absensi/DeviceImport.tsx](file://apps/web/src/pages/absensi/DeviceImport.tsx#L12-L12) | `12` | `12` |
| `QLine` | `interface` | [apps/web/src/pages/crm/QuotationDetail.tsx](file://apps/web/src/pages/crm/QuotationDetail.tsx#L28-L32) | `28` | `32` |
| `ServerAuditRow` | `interface` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L51-L58) | `51` | `58` |
| `StoreItemLike` | `interface` | [apps/web/src/pages/audit/Audit.tsx](file://apps/web/src/pages/audit/Audit.tsx#L60-L69) | `60` | `69` |
| `BoqDetailModalProps` | `interface` | [apps/web/src/pages/dokumen/BoqDetailModal.tsx](file://apps/web/src/pages/dokumen/BoqDetailModal.tsx#L19-L28) | `19` | `28` |
| `MaintForm` | `interface` | [apps/web/src/pages/equipment/Equipment.tsx](file://apps/web/src/pages/equipment/Equipment.tsx#L98-L113) | `98` | `113` |
| `PscRow` | `interface` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L53-L58) | `53` | `58` |
| `DockHistoryRow` | `interface` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L60-L66) | `60` | `66` |
| `PlanRow` | `interface` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L68-L72) | `68` | `72` |
| `BunkerRow` | `interface` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L74-L79) | `74` | `79` |
| `CrewRow` | `interface` | [apps/web/src/pages/kapal/VesselDetail.tsx](file://apps/web/src/pages/kapal/VesselDetail.tsx#L81-L84) | `81` | `84` |
| `ComplianceRow` | `interface` | [apps/web/src/pages/kapal/Vessels.tsx](file://apps/web/src/pages/kapal/Vessels.tsx#L43-L47) | `43` | `47` |
| `Reservation` | `interface` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L160-L160) | `160` | `160` |
| `BatchRow` | `interface` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L161-L161) | `161` | `161` |
| `DetectedBarcode` | `interface` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L173-L175) | `173` | `175` |
| `BarcodeDetectorInstance` | `interface` | [apps/web/src/pages/inventori/Inventory.tsx](file://apps/web/src/pages/inventori/Inventory.tsx#L177-L179) | `177` | `179` |
| `HistFilter` | `interface` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L87-L87) | `87` | `87` |
| `InvLine` | `interface` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L324-L332) | `324` | `332` |
| `allowSum` | `function` | [apps/web/src/pages/keuangan/Finance.tsx](file://apps/web/src/pages/keuangan/Finance.tsx#L353-L357) | `353` | `357` |
| `EmptyModul` | `function` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L29-L36) | `29` | `36` |
| `ReportTpl` | `interface` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L76-L76) | `76` | `76` |
| `ReportArc` | `interface` | [apps/web/src/pages/laporan/Laporan.tsx](file://apps/web/src/pages/laporan/Laporan.tsx#L77-L77) | `77` | `77` |
| `NotifItem` | `interface` | [apps/web/src/pages/notifikasi/Notifikasi.tsx](file://apps/web/src/pages/notifikasi/Notifikasi.tsx#L16-L27) | `16` | `27` |
| `AllowanceLine` | `interface` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L101-L104) | `101` | `104` |
| `PayrollRates` | `interface` | [apps/web/src/pages/payroll/Payroll.tsx](file://apps/web/src/pages/payroll/Payroll.tsx#L108-L124) | `108` | `124` |
| `POLine` | `interface` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L48-L48) | `48` | `48` |
| `Quote` | `interface` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L49-L49) | `49` | `49` |
| `Approval` | `interface` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L50-L50) | `50` | `50` |
| `VendorScore` | `interface` | [apps/web/src/pages/procurement/Procurement.tsx](file://apps/web/src/pages/procurement/Procurement.tsx#L51-L51) | `51` | `51` |
| `ManagedUser` | `interface` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L227-L235) | `227` | `235` |
| `SessionRow` | `interface` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L237-L246) | `237` | `246` |
| `AuditRow` | `interface` | [apps/web/src/pages/pengaturan/Peran.tsx](file://apps/web/src/pages/pengaturan/Peran.tsx#L248-L253) | `248` | `253` |
| `ConstInfo` | `interface` | [apps/web/src/pages/pengaturan/Settings.tsx](file://apps/web/src/pages/pengaturan/Settings.tsx#L14-L14) | `14` | `14` |
| `Preview` | `interface` | [apps/web/src/pages/publik/CutiQr.tsx](file://apps/web/src/pages/publik/CutiQr.tsx#L13-L13) | `13` | `13` |
| `PriceHist` | `interface` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L52-L52) | `52` | `52` |
| `Props` | `interface` | [apps/web/src/pages/proyek/BoQSection.tsx](file://apps/web/src/pages/proyek/BoQSection.tsx#L114-L122) | `114` | `122` |
| `DocRow` | `interface` | [apps/web/src/pages/proyek/BoqDocsSection.tsx](file://apps/web/src/pages/proyek/BoqDocsSection.tsx#L30-L44) | `30` | `44` |
| `AttentionItem` | `interface` | [apps/web/src/pages/proyek/Monitoring.tsx](file://apps/web/src/pages/proyek/Monitoring.tsx#L36-L41) | `36` | `41` |
| `FeedEntry` | `interface` | [apps/web/src/pages/proyek/MonitoringFeed.tsx](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L15-L29) | `15` | `29` |
| `Props` | `interface` | [apps/web/src/pages/proyek/MonitoringFeed.tsx](file://apps/web/src/pages/proyek/MonitoringFeed.tsx#L31-L36) | `31` | `36` |
| `WbsBaseline` | `interface` | [apps/web/src/pages/proyek/ProjectDetail.tsx](file://apps/web/src/pages/proyek/ProjectDetail.tsx#L91-L91) | `91` | `91` |
| `Props` | `interface` | [apps/web/src/pages/proyek/ReportSection.tsx](file://apps/web/src/pages/proyek/ReportSection.tsx#L13-L15) | `13` | `15` |
| `Props` | `interface` | [apps/web/src/pages/proyek/SparepartServiceSection.tsx](file://apps/web/src/pages/proyek/SparepartServiceSection.tsx#L33-L37) | `33` | `37` |
| `Photo` | `interface` | [apps/web/src/pages/proyek/WbsTree.tsx](file://apps/web/src/pages/proyek/WbsTree.tsx#L13-L13) | `13` | `13` |
| `EditItem` | `interface` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L18-L18) | `18` | `18` |
| `EditSection` | `interface` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L19-L19) | `19` | `19` |
| `EditTemplate` | `interface` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L20-L20) | `20` | `20` |
| `uid` | `function` | [apps/web/src/pages/qc/ChecklistTab.tsx](file://apps/web/src/pages/qc/ChecklistTab.tsx#L22-L22) | `22` | `22` |
| `EmpCert` | `interface` | [apps/web/src/pages/sdm/HR.tsx](file://apps/web/src/pages/sdm/HR.tsx#L78-L81) | `78` | `81` |
| `AkunLogin` | `function` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L42-L63) | `42` | `63` |
| `EmpCert` | `interface` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L65-L72) | `65` | `72` |
| `SkillLevel` | `interface` | [apps/web/src/pages/sdm/KaryawanDetail.tsx](file://apps/web/src/pages/sdm/KaryawanDetail.tsx#L74-L74) | `74` | `74` |
| `potonganOf` | `function` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L96-L96) | `96` | `96` |
| `Milestone` | `interface` | [apps/web/src/pages/subkontraktor/Subcontractor.tsx](file://apps/web/src/pages/subkontraktor/Subcontractor.tsx#L134-L134) | `134` | `134` |
| `row` | `function` | [apps/web/src/services/__tests__/repositories.test.ts](file://apps/web/src/services/__tests__/repositories.test.ts#L34-L34) | `34` | `34` |
| `listWith` | `function` | [apps/web/src/services/__tests__/repositories.test.ts](file://apps/web/src/services/__tests__/repositories.test.ts#L35-L39) | `35` | `39` |
| `sp` | `function` | [apps/web/src/utils/__tests__/format.test.ts](file://apps/web/src/utils/__tests__/format.test.ts#L30-L30) | `30` | `30` |
| `TestPurchaseOrder` | `interface` | [apps/web/src/utils/__tests__/listPersistence.test.ts](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L10-L20) | `10` | `20` |
| `TestInspection` | `interface` | [apps/web/src/utils/__tests__/listPersistence.test.ts](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L22-L29) | `22` | `29` |
| `getVal` | `function` | [apps/web/src/utils/__tests__/listPersistence.test.ts](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L107-L107) | `107` | `107` |
| `filterPending` | `function` | [apps/web/src/utils/__tests__/listPersistence.test.ts](file://apps/web/src/utils/__tests__/listPersistence.test.ts#L140-L140) | `140` | `140` |
| `BastInput` | `interface` | [services/api/src/pdf/documents/bast.ts](file://services/api/src/pdf/documents/bast.ts#L16-L32) | `16` | `32` |
| `BoqDocInput` | `interface` | [services/api/src/pdf/documents/boq.ts](file://services/api/src/pdf/documents/boq.ts#L10-L25) | `10` | `25` |
| `GaransiInput` | `interface` | [services/api/src/pdf/documents/boq.ts](file://services/api/src/pdf/documents/boq.ts#L75-L88) | `75` | `88` |
| `DeliveryOrderInput` | `interface` | [services/api/src/pdf/documents/deliveryOrder.ts](file://services/api/src/pdf/documents/deliveryOrder.ts#L10-L26) | `10` | `26` |
| `CutiDocInput` | `interface` | [services/api/src/pdf/documents/hr.ts](file://services/api/src/pdf/documents/hr.ts#L20-L40) | `20` | `40` |
| `SuratHrInput` | `interface` | [services/api/src/pdf/documents/hr.ts](file://services/api/src/pdf/documents/hr.ts#L161-L183) | `161` | `183` |
| `InvoiceLine` | `interface` | [services/api/src/pdf/documents/invoice.ts](file://services/api/src/pdf/documents/invoice.ts#L27-L36) | `27` | `36` |
| `InvoiceInput` | `interface` | [services/api/src/pdf/documents/invoice.ts](file://services/api/src/pdf/documents/invoice.ts#L38-L71) | `38` | `71` |
| `KopPenawaranInput` | `interface` | [services/api/src/pdf/documents/kopPenawaran.ts](file://services/api/src/pdf/documents/kopPenawaran.ts#L10-L20) | `10` | `20` |
| `KwitansiInput` | `interface` | [services/api/src/pdf/documents/kwitansi.ts](file://services/api/src/pdf/documents/kwitansi.ts#L22-L35) | `22` | `35` |
| `Finding` | `interface` | [services/api/src/pdf/documents/laporan.ts](file://services/api/src/pdf/documents/laporan.ts#L37-L44) | `37` | `44` |
| `CashReportModel` | `interface` | [services/api/src/pdf/documents/laporan.ts](file://services/api/src/pdf/documents/laporan.ts#L46-L60) | `46` | `60` |
| `ProjectReportModel` | `interface` | [services/api/src/pdf/documents/laporan.ts](file://services/api/src/pdf/documents/laporan.ts#L62-L71) | `62` | `71` |
| `AnalyticModel` | `interface` | [services/api/src/pdf/documents/laporan.ts](file://services/api/src/pdf/documents/laporan.ts#L73-L121) | `73` | `121` |
| `PayrollReportModel` | `interface` | [services/api/src/pdf/documents/laporan.ts](file://services/api/src/pdf/documents/laporan.ts#L123-L129) | `123` | `129` |
| `PoInput` | `interface` | [services/api/src/pdf/documents/po.ts](file://services/api/src/pdf/documents/po.ts#L16-L41) | `16` | `41` |
| `qty` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L117-L122) | `117` | `122` |
| `pct` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L125-L128) | `125` | `128` |
| `Row` | `interface` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L141-L146) | `141` | `146` |
| `RowSpec` | `interface` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L153-L158) | `153` | `158` |
| `trimItems` | `function` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L307-L309) | `307` | `309` |
| `DocTitle` | `interface` | [services/api/src/pdf/documents/shared.ts](file://services/api/src/pdf/documents/shared.ts#L315-L320) | `315` | `320` |
| `SlipGajiInput` | `interface` | [services/api/src/pdf/documents/slipGaji.ts](file://services/api/src/pdf/documents/slipGaji.ts#L10-L20) | `10` | `20` |
| `SpkInput` | `interface` | [services/api/src/pdf/documents/spk.ts](file://services/api/src/pdf/documents/spk.ts#L16-L32) | `16` | `32` |
| `SptRow` | `interface` | [services/api/src/pdf/documents/spt.ts](file://services/api/src/pdf/documents/spt.ts#L18-L25) | `18` | `25` |
| `SptInput` | `interface` | [services/api/src/pdf/documents/spt.ts](file://services/api/src/pdf/documents/spt.ts#L27-L49) | `27` | `49` |
| `SuratJalanInput` | `interface` | [services/api/src/pdf/documents/suratJalan.ts](file://services/api/src/pdf/documents/suratJalan.ts#L11-L24) | `11` | `24` |
| `TandaTerimaInput` | `interface` | [services/api/src/pdf/documents/tandaTerima.ts](file://services/api/src/pdf/documents/tandaTerima.ts#L10-L22) | `10` | `22` |
| `TransmittalInput` | `interface` | [services/api/src/pdf/documents/transmittal.ts](file://services/api/src/pdf/documents/transmittal.ts#L10-L20) | `10` | `20` |
| `MaterialFormValues` | `interface` | [apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L18-L34) | `18` | `34` |
| `Props` | `interface` | [apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx](file://apps/web/src/pages/inventori/tabs/CatalogMaterialForm.tsx#L36-L50) | `36` | `50` |
| `CoaTreeNode` | `interface` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L9-L21) | `9` | `21` |
| `CoaTabProps` | `interface` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L23-L28) | `23` | `28` |
| `TreeNodeRowProps` | `interface` | [apps/web/src/pages/keuangan/tabs/CoaTab.tsx](file://apps/web/src/pages/keuangan/tabs/CoaTab.tsx#L346-L354) | `346` | `354` |
| `resolveBranch` | `function` | [apps/web/src/pages/qc/__tests__/QCChecklist.test.ts](file://apps/web/src/pages/qc/__tests__/QCChecklist.test.ts#L6-L9) | `6` | `9` |
| `Row` | `interface` | [services/api/src/inventoryAdditional.ts](file://services/api/src/inventoryAdditional.ts#L10-L10) | `10` | `10` |
| `AdditionalInput` | `interface` | [services/api/src/inventoryAdditional.ts](file://services/api/src/inventoryAdditional.ts#L16-L23) | `16` | `23` |
| `RouteEntry` | `interface` | [services/api/src/routeList.ts](file://services/api/src/routeList.ts#L6-L6) | `6` | `6` |
| `ImportPreviewRow` | `interface` | [apps/web/src/components/ImportPreviewModal.tsx](file://apps/web/src/components/ImportPreviewModal.tsx#L10-L16) | `10` | `16` |
| `Props` | `interface` | [apps/web/src/components/ImportPreviewModal.tsx](file://apps/web/src/components/ImportPreviewModal.tsx#L18-L26) | `18` | `26` |
| `KasbonPotongan` | `interface` | [apps/web/src/utils/kasbon.ts](file://apps/web/src/utils/kasbon.ts#L8-L13) | `8` | `13` |
| `KasbonEntry` | `interface` | [apps/web/src/utils/kasbon.ts](file://apps/web/src/utils/kasbon.ts#L15-L22) | `15` | `22` |
| `ProjectFee` | `interface` | [apps/web/src/utils/projectFee.ts](file://apps/web/src/utils/projectFee.ts#L4-L13) | `4` | `13` |
| `Link` | `interface` | [services/api/src/routes/relations.ts](file://services/api/src/routes/relations.ts#L22-L22) | `22` | `22` |
| `Props` | `interface` | [apps/web/src/pages/proyek/DockPlanCard.tsx](file://apps/web/src/pages/proyek/DockPlanCard.tsx#L12-L17) | `12` | `17` |
| `Props` | `interface` | [apps/web/src/pages/proyek/FeeProjectCard.tsx](file://apps/web/src/pages/proyek/FeeProjectCard.tsx#L15-L21) | `15` | `21` |
| `BomAllocation` | `interface` | [apps/web/src/pages/proyek/WbsMaterialModal.tsx](file://apps/web/src/pages/proyek/WbsMaterialModal.tsx#L15-L15) | `15` | `15` |
| `k` | `function` | [apps/web/src/utils/__tests__/kasbon.test.ts](file://apps/web/src/utils/__tests__/kasbon.test.ts#L4-L4) | `4` | `4` |
| `slip` | `function` | [apps/web/src/utils/__tests__/kasbon.test.ts](file://apps/web/src/utils/__tests__/kasbon.test.ts#L5-L5) | `5` | `5` |
| `p` | `function` | [apps/web/src/utils/__tests__/projectStages.test.ts](file://apps/web/src/utils/__tests__/projectStages.test.ts#L5-L5) | `5` | `5` |
| `VoucherInput` | `interface` | [services/api/src/pdf/documents/voucher.ts](file://services/api/src/pdf/documents/voucher.ts#L9-L17) | `9` | `17` |
