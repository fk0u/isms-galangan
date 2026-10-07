# Contributing

Berlaku untuk manusia dan AI agent. Agent juga wajib membaca [AGENTS.md](AGENTS.md).

## Alur
1. Ambil satu task dari [`docs/handoff/STATUS.md`](docs/handoff/STATUS.md); isi kolom PIC dan ubah status ke `jalan`.
2. Branch dari `main`: `<tipe>/<task-id>-<slug>` — mis. `feat/F3-B-02-tabel-proyek`, `sec/F2-04-token-version`.
3. Kerjakan sesuai kartu task. Satu task = satu PR.
4. `npm run check` di root harus hijau.
5. Buka PR memakai template; isi kriteria terima.
6. Review oleh owner (Kou). Merge **squash**. Ubah status task ke `selesai`.

## Tipe commit
`feat` fitur · `fix` bug · `sec` keamanan · `refactor` · `perf` · `docs` · `test` · `chore`.
Format: `tipe(area): ringkas [TASK-ID]` — contoh `feat(proyek): kolom nomor & tombol detail [F3-B-02]`.

## Aturan
- Tidak ada data riil, secret, atau `.env` di commit.
- Teks UI baru: i18n ID + EN.
- Koleksi/relasi baru: migrasi + `PREFIX`/`COLLECTIONS` (api & web) + `refs.ts`.
- Perubahan arsitektural: tulis ADR di `docs/architecture/adr/`.
- Perubahan perilaku: perbarui kartu task / dokumen terkait di PR yang sama.
- Dependensi baru disebut dan diberi alasan di deskripsi PR.

## Struktur dokumentasi
Lihat [docs/README.md](docs/README.md).
