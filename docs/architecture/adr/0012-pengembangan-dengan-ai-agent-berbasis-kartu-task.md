# ADR-0012: Pengembangan dengan AI agent berbasis kartu task

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Tim kecil; eksekusi banyak dibantu agent (Antigravity, Claude Code).

## Opsi
1. Instruksi ad-hoc per sesi.
2. **`AGENTS.md` + `CONTEXT.md` + `DESIGN.md` + kartu task ber-ID di `docs/handoff/` + review manusia.**

## Keputusan
Opsi 2. Satu task ID per branch/PR; CI wajib hijau; manusia me-review setiap PR.

## Konsekuensi
Dokumen harus dijaga mutakhir — PR yang mengubah perilaku wajib memperbarui kartu/STATUS.
