# Log Keputusan

Semua pertanyaan terbuka per 7 Okt 2026 **diputuskan memakai rekomendasi default** (persetujuan owner: Kou, 7 Okt 2026). Keputusan arsitektural punya ADR di [`../architecture/adr/`](../architecture/adr/README.md).
Bila klien memberi jawaban berbeda nanti, catat sebagai baris baru (jangan hapus baris lama) dan buat ADR pengganti bila perlu.

| # | Pertanyaan | Keputusan (7 Okt 2026) | Rujukan |
|---|---|---|---|
| Q1 | Isolasi data per cabang wajib? | **Tidak untuk prototype.** Satu cabang aktif "Samarinda"; server mengisi & mengunci `branch`; struktur siap multi-cabang. | ADR-0003, F2-06 Jalur A |
| Q2 | Daftar peran resmi & akses data sensitif | `developer, direktur, manager, finance, hr, procurement, gudang, proyek, mekanik, qc, subkon, equipment, drydock, viewer`. Payroll & data pribadi karyawan: hr, direktur, developer. Keuangan: finance, direktur, manager (baca). | ADR-0004, F2-05 |
| Q3 | Data `seed-data/` riil? | **Dianggap riil.** Tidak di-track git; diganti generator sintetis dengan bentuk sama. | ADR-0001, F0-02 |
| Q4 | Filter inventori 2 tingkat (I2) | Ikuti permintaan klien; dikerjakan di F3-G-01 bila tidak bertentangan. | Q15 |
| Q5 | Contoh dokumen BoQ asli | Pakai format default (nomor, revisi, tabel item, total, tanda tangan); template diganti saat contoh asli datang. | ADR-0006 |
| Q6 | Lingkungan pilot | VPS + Docker Compose + MySQL 8 + Caddy (TLS). | ADR-0010 |
| Q7 | Akun viewer klien | Ya — peran `viewer`, hanya proyek kapal miliknya, tanpa aksi tulis. | ADR-0004 |
| Q8 | 4 item ambigu todo5 | Dibahas di review demo pertama; tidak memblokir. | — |
| Q9 | Pembagian peran tim | **Kou** (fk0u): owner, reviewer semua PR, keputusan produk. **AI agent** (Antigravity/Claude Code): eksekusi kartu task. Dua jalur paralel: backend/keamanan (F2, F4) dan frontend/fitur (F3). | ADR-0012, `docs/process/workflow.md` |
| Q10 | Hubungan dengan developer asal | Tidak sinkron otomatis dengan upstream. Commit upstream baru hanya diambil manual bila bernilai, dicatat di `docs/UPSTREAM.txt`. | ADR-0001 |
| Q11 | Rumus progres proyek | Rata-rata progres WBS berbobot nilai BoQ (fallback anggaran task, lalu bobot sama). | ADR-0011, F3-B-06 |
| Q12 | Hapus tabel risiko | Disembunyikan dari tab Perubahan & Risiko (tab jadi "Change Order"); risiko otomatis tetap dipakai alert & monitoring. | F3-B-11 |
| Q13 | Isi kuesioner K3 | Bangun mesin kuesioner generik sekarang; isi template K3 menyusul tanpa coding. | ADR-0009 |
| Q14 | Alat absensi | Endpoint ingest generik (API key per perangkat) + impor CSV; adapter spesifik merk menyusul. | F3-L-08 |
| Q15 | Item lama todo5 di luar revisi baru | Tetap dikerjakan bila tidak bertentangan dengan revisi 5–6 Okt; prioritas P2. | `docs/product/requirements-2026-10.md` |
| Q16 | Repo publik | Ya. Data riil & laporan audit tetap lokal (`.gitignore`). | ADR-0001 |
