# 00 — Kondisi Awal (Baseline)

## Asal kode
- Sumber: `github.com/Ichsanul21/galangan`, commit **`805e636`** (7 Okt 2026).
- Disalin tanpa riwayat git, tanpa `node_modules`, `dist`, dan database lokal.
- Mulai titik ini, pengembangan dilakukan di project ini, **terpisah** dari repo upstream.

## Analisis commit terbaru (96b65fd → 805e636)
Baseline audit adalah `96b65fd`. Setelah itu masuk **19 commit, 20 file, +1.208 / −318 baris**, seluruhnya di frontend:

| Area | Perubahan |
|---|---|
| Input uang (B2) | Komponen baru `MoneyInput` + `parseRupiah` (`ui.tsx`, `utils/format.ts`), dipasang di Finance, Payroll, Procurement, Subkon, BoQ, Equipment |
| Proyek | Log Penawaran & Tagihan menggantikan blok Desain/Class Approval (D1); risiko auto dari WBS & milestone WO (D8, `utils/riskAuto.ts`); override manual status Terlambat (P8, `utils/projectDelay.ts`); garansi per WBS (D11); tab Subkon (D15); referensi BoQ di Service (D12); material WBS ↔ inventori + foto array (D3); checklist trial dari WBS (D10); referensi PO di sparepart (D13) |
| Probe | 2 probe baru: `risk-auto-probe` (24 lolos), `p8-probe` (12 lolos) |

Verifikasi di HEAD baru: `npm run check` frontend **lulus** (28/28 halaman render, semua probe lulus).

**Yang tidak berubah:** `services/api` tidak disentuh sama sekali → **semua temuan keamanan audit masih berlaku** (lihat `audit/` dan `docs/architecture/security-plan.md`).

Catatan kualitas commit baru:
- `ProjectDetail.tsx` makin besar (diff 527 baris di satu file, kini 2570 baris). Kandidat dipecah saat kita sentuh.
- Fitur D3/D13 menulis relasi baru (material → inventori, sparepart → PO) **hanya di frontend**; server belum memvalidasi relasi tersebut (`refs.ts` belum diperbarui). Perlu ditambah di Fase 4 (lihat `docs/planning/roadmap.md`).
- Klaim selesai D13 perlu dicek: permintaan klien "sparepart **wajib** via PO", commit hanya menambah *referensi* PO.

## Status backlog revisi klien (klaim `todo5.md`)
| Selesai | Sebagian | Belum | Ambigu | Total |
|---|---|---|---|---|
| 34 | 13 | 22 | 4 | 72 |

⚠️ Tabel per-item di `todo5.md` **tidak sinkron** dengan ringkasannya (beberapa item yang sudah dikerjakan masih tertulis BELUM). Item per item diverifikasi ulang di Fase 1 (lihat `docs/product/backlog-legacy-map.md`).

## Status audit (ringkas)
5 Kritis, 7 Tinggi, 9 Sedang, 6 Rendah. 30 dari 35 uji eksploit berhasil. Detail: `audit/audit-final-project-galangan.pdf`.

## Peringatan data
`services/api/seed-data/` berisi data yang tampak riil (rekening bank, hutang/piutang, transaksi gudang). Ikut tersalin karena seed bergantung padanya. Folder ini **tidak di-track git** dan diganti data sintetis (tugas K-01 di `docs/architecture/security-plan.md`; diatur via `.gitignore`).
