# Dokumentasi

Dokumen di root repo: [README](../README.md) · [CONTEXT](../CONTEXT.md) · [DESIGN](../DESIGN.md) · [AGENTS](../AGENTS.md) · [CONTRIBUTING](../CONTRIBUTING.md) · [SECURITY](../SECURITY.md) · [CHANGELOG](../CHANGELOG.md)

```
docs/
├── product/        APA yang dibangun dan untuk siapa
├── architecture/   BAGAIMANA sistem dibangun + ADR (keputusan)
├── planning/       KAPAN & urutan: baseline, roadmap, log keputusan
├── process/        CARA kita bekerja
├── handoff/        Kartu task eksekusi (untuk AI agent / developer) + papan status
└── legacy/         Arsip dari developer asal (read-only)
```

## Product
| Dokumen | Isi |
|---|---|
| [scope.md](product/scope.md) | Lingkup prototype, 13 alur demo, definition of done |
| [requirements-2026-10.md](product/requirements-2026-10.md) | **Master list revisi klien 5–6 Okt** (±95 item ber-ID) |
| [backlog-legacy-map.md](product/backlog-legacy-map.md) | Pemetaan backlog lama `todo5` (referensi) |

## Architecture
| Dokumen | Isi |
|---|---|
| [overview.md](architecture/overview.md) | Arsitektur sekarang vs target |
| [security-plan.md](architecture/security-plan.md) | Perbaikan temuan audit K/T/S/R |
| [adr/](architecture/adr/README.md) | 14 Architecture Decision Records + template |

## Planning
| Dokumen | Isi |
|---|---|
| [baseline.md](planning/baseline.md) | Kondisi awal kode & analisis commit upstream terakhir |
| [roadmap.md](planning/roadmap.md) | 6 fase, estimasi, kriteria selesai |
| [decisions.md](planning/decisions.md) | Log keputusan produk (Q1–Q16, semua terjawab) |
| [sprint-3-hari.md](planning/sprint-3-hari.md) | **Sprint 3 hari**: 58 task P0 di 4 jalur paralel, checkpoint, register risiko |

## Process
| Dokumen | Isi |
|---|---|
| [workflow.md](process/workflow.md) | Peran tim, branch, review, konvensi |
| [operating-system.md](process/operating-system.md) | Accountability chart persona agent, kepemilikan file, scorecard, cadence, IDS, gerbang kualitas |

## Handoff
[handoff/README.md](handoff/README.md) — cara memakai kartu task, template prompt Antigravity, urutan fase.
[handoff/STATUS.md](handoff/STATUS.md) — papan status 106 task.

## Tidak di repo (lokal saja)
- `docs/audit/` — laporan audit keamanan (berisi rincian celah yang belum ditambal).
- `services/api/seed-data/` — data yang tampak riil.
Lihat [ADR-0001](architecture/adr/0001-fork-terpisah-dari-upstream-repo-publik-tanpa-data-riil.md).
