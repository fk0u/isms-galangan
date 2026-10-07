# ADR-0001: Fork terpisah dari upstream, repo publik tanpa data riil

- **Status:** Accepted
- **Tanggal:** 2026-10-07
- **Pemutus:** Kou (owner) atas rekomendasi CTO

## Konteks
Kode diambil dari `Ichsanul21/galangan@805e636`. Upstream publik dan memuat data yang tampak riil (rekening, hutang/piutang). Kita butuh repo sendiri yang bisa dibagikan.

## Opsi
1. Lanjut di repo upstream — tidak ada kendali, data riil ikut.
2. Repo privat — aman, tapi owner memilih publik.
3. **Repo publik sendiri; data riil & laporan audit tidak di-track.**

## Keputusan
Opsi 3. `services/api/seed-data/` dan `docs/audit/` di `.gitignore`; seed bulk diganti generator sintetis (F0-02). Tidak ada sinkron otomatis dengan upstream.

## Konsekuensi
Clone baru tidak punya data bulk sampai F0-02 selesai. Siapa pun bisa membaca kode, jadi tidak boleh ada secret/data pribadi di commit — dijaga oleh `AGENTS.md` aturan 9–10 dan review PR.
