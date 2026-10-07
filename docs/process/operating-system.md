# Operating System Tim (Manusia + AI Agent)

Cara tim ISMS bekerja sehari-hari. Diadaptasi dari kerangka company OS (accountability chart, scorecard, cadence, penyelesaian masalah) untuk tim kecil yang dieksekusi AI agent.

## 1. Accountability chart
Satu peran = satu pemilik hasil. Agent boleh banyak sesi, tapi tiap **jalur** punya satu pemilik.

| Peran | Kode | Pemilik | Memiliki hasil |
|---|---|---|---|
| Owner | `OWNER` | Kou (manusia) | Prioritas, keputusan produk, merge ke `main`, komunikasi klien |
| Orkestrator | `NAKHODA` | Agent | Papan `STATUS.md`, pembagian task, gerbang kualitas, laporan harian |
| Backend & keamanan | `ARSITEK` | Agent jalur A | F2, F4, `services/api/src/{auth,policy,db,app}.ts`, route inti |
| Data & alur domain | `JURU-DATA` | Agent jalur B | Migrasi, seed, koleksi baru, endpoint alur (BoQ, material, PO, kuesioner) |
| Frontend proyek | `JURU-RUPA-1` | Agent jalur C | F3-A, F3-B, F3-C UI, F3-D UI, F3-E |
| Frontend modul | `JURU-RUPA-2` | Agent jalur D | F3-F, F3-G, F3-H, F3-I, F3-K, F3-L, F3-M |
| QA | `PENGUJI` | Agent (sesi terpisah) | Review PR terhadap kartu task, probe, uji manual |
| Kebersihan kode | `PEMBERSIH` | Agent | F6: dead code, lint, i18n mati, pemecahan file |
| Dokumentasi | `JURU-TULIS` | Agent (dirangkap NAKHODA) | STATUS, CHANGELOG, ADR, kartu task |

### Kepemilikan file (mencegah konflik antar-jalur)
| Area | Pemilik tunggal | Jalur lain |
|---|---|---|
| `services/api/src/{auth,rbac,policy,env,app,db,audit}.ts` | ARSITEK | minta lewat NAKHODA |
| `services/api/migrations/` | JURU-DATA (nomor dialokasikan di sprint plan) | ARSITEK pakai nomor yang dialokasikan |
| `services/api/src/routes/crud.ts` | ARSITEK | JURU-DATA hanya menambah entri `COLLECTIONS`/`PREFIX`/`REQUIRED_DATA` |
| `apps/web/src/components/ui.tsx` + `components/*` baru | JURU-RUPA-1 | JURU-RUPA-2 memakai, tidak mengubah |
| `apps/web/src/data/store.tsx` | JURU-RUPA-1 | perubahan kecil (koleksi baru) oleh JURU-DATA |
| `apps/web/src/i18n/n_*.ts` | pemilik modul halaman terkait | tambahkan kunci di akhir objek, jangan mengurutkan ulang |
| `docs/handoff/STATUS.md` | NAKHODA | agent lain hanya mengubah baris task-nya |

## 2. Scorecard (dicek tiap checkpoint)
| Metrik | Pemilik | Target | Hijau / Kuning / Merah |
|---|---|---|---|
| Task P0 selesai (merged) | NAKHODA | sesuai rencana hari | ≥100% / 80–99% / <80% |
| CI `main` | PENGUJI | hijau | hijau / — / merah |
| Security probe K/T VULN | ARSITEK | 0 di akhir hari 2 | 0 / 1–3 / >3 |
| PR menunggu review owner | OWNER | ≤ 3 | ≤3 / 4–6 / >6 |
| PR ditolak PENGUJI (rework) | NAKHODA | ≤ 20% | ≤20% / 21–35% / >35% |
| Lint error | PEMBERSIH | 0 | 0 / — / >0 |
| Task terblokir > 2 jam | NAKHODA | 0 | 0 / 1 / >1 |

## 3. Cadence
| Kapan | Siapa | Isi |
|---|---|---|
| Awal hari (07:30) | NAKHODA → OWNER | Rencana hari: task per jalur, risiko |
| Checkpoint 11:00 · 15:00 · 20:00 | OWNER + NAKHODA | Scorecard (bahas yang merah saja), review & merge batch PR yang sudah lolos PENGUJI |
| Setiap PR | PENGUJI | Review terhadap kartu task sebelum owner |
| Akhir hari (22:00) | NAKHODA | Laporan harian di `docs/log/YYYY-MM-DD.md` |
| Akhir sprint | Semua | Retro singkat + audit ulang (F5-05) |

## 4. Penyelesaian masalah (IDS, maks 15 menit)
1. **Identify** — satu kalimat akar masalah (bukan gejala). Catat di `docs/log/issues.md`.
2. **Discuss** — fakta: file, error, kartu task. Berhenti saat argumen berulang.
3. **Solve** — satu pemilik, satu aksi, satu tenggat. Bila menyangkut produk → OWNER memutuskan; bila arsitektur → ADR.
Aturan: agent yang macet > 30 menit pada satu error **berhenti** dan melapor ke NAKHODA dengan format IDS, bukan mencoba-coba.

## 5. Gerbang kualitas (tidak bisa ditawar)
1. Satu task ID = satu branch = satu PR.
2. `npm run check` hijau (CI).
3. PENGUJI menyatakan semua kriteria terima terpenuhi.
4. OWNER merge (squash).
5. Bila `main` merah: semua jalur berhenti merge sampai diperbaiki (PENGUJI memimpin).
