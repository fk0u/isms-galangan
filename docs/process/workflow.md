# 06 — Cara Kerja Berdua

## Repository
- Project ini repo **sendiri**, terpisah dari `Ichsanul21/galangan`. Upstream hanya referensi; tidak ada push/pull ke sana.
- Bila nanti dibuat remote (GitHub/GitLab), **wajib private**, dan baru setelah K-01 (seed sintetis) selesai.
- Commit dari upstream setelah `805e636` tidak otomatis diambil. Bila perlu, ambil per commit secara manual dan catat di `UPSTREAM.txt`.

## Branch & commit
- `main` selalu bisa jalan dan hijau.
- Branch per tugas: `sec/k02-branch-scope`, `feat/d5-boq-surat`, `fix/…`.
- Pesan commit: `tipe(area): ringkas` — tipe: `feat`, `fix`, `sec`, `refactor`, `docs`, `test`, `chore`. Sertakan ID temuan/item (`K-02`, `D5`).
- Satu tugas = satu PR/merge kecil. Hindari PR yang mencampur keamanan dan UI.

## Pembagian peran (keputusan Q9)
| Peran | Siapa | Tanggung jawab |
|---|---|---|
| Owner & reviewer | Kou (fk0u) | Prioritas, keputusan produk, review & merge semua PR, komunikasi klien |
| Eksekutor jalur backend | AI agent (Antigravity/Claude Code) | F2 keamanan, F4 integritas |
| Eksekutor jalur frontend | AI agent (sesi terpisah) | F3 fitur revisi klien |
Dua jalur berjalan paralel di branch terpisah. Tidak ada PR yang di-merge tanpa review owner dan CI hijau.

## Cek wajib sebelum merge
```bash
npm run check
```
Plus, setelah Fase 2: security probe harus 0 VULN.

## Konvensi kode
- Ikuti gaya kode yang ada (komentar menjelaskan *alasan*, bahasa Indonesia).
- Jangan menambah dependensi tanpa dicatat alasannya di PR.
- File halaman yang disentuh dan > 1.500 baris: pecah bagian yang diubah ke komponen terpisah.
- Semua akses data server baru wajib lewat `policy.ts` + `scopedWhere()` (setelah Fase 2).
- Relasi baru antar-koleksi wajib didaftarkan di `refs.ts`.

## Dokumentasi
- Keputusan baru → `docs/planning/decisions.md`; bila arsitektural, tulis ADR.
- Status task → `docs/handoff/STATUS.md`; keputusan arsitektur → ADR baru di `docs/architecture/adr/`.
- Tiap akhir fase: catatan singkat di `docs/log/fase-N.md` (apa selesai, apa bergeser, estimasi baru).
