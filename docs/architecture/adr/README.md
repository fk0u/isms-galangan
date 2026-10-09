# Architecture Decision Records

Format: konteks → opsi → keputusan → konsekuensi. ADR tidak diedit setelah Accepted; ganti dengan ADR baru yang `Supersedes`.

| ADR | Judul | Status |
|---|---|---|
| [0001](0001-fork-terpisah-dari-upstream-repo-publik-tanpa-data-riil.md) | Fork terpisah dari upstream, repo publik tanpa data riil | Accepted |
| [0002](0002-pertahankan-arsitektur-tidak-rewrite.md) | Pertahankan arsitektur; tidak rewrite | Accepted |
| [0003](0003-satu-cabang-aktif-samarinda-struktur-siap-multi-cabang.md) | Satu cabang aktif (Samarinda), struktur siap multi-cabang | Accepted |
| [0004](0004-enum-peran-matriks-izin-di-policy-ts.md) | Enum peran + matriks izin di `policy.ts` | Accepted |
| [0005](0005-token-jwt-dapat-dicabut-via-token-version.md) | Token JWT dapat dicabut via `token_version` | Accepted |
| [0006](0006-boq-per-nomor-surat-dengan-revisi-bertingkat.md) | BoQ per nomor surat dengan revisi bertingkat | Accepted |
| [0007](0007-alur-material-request-transaksional-di-server.md) | Alur material request transaksional di server | Accepted |
| [0008](0008-realtime-via-server-sent-events.md) | Realtime via Server-Sent Events | Accepted |
| [0009](0009-mesin-kuesioner-generik-untuk-qc-hse.md) | Mesin kuesioner generik untuk QC & HSE | Accepted |
| [0010](0010-deploy-pilot-vps-docker-compose-mysql-8.md) | Deploy pilot: VPS + Docker Compose + MySQL 8 | Accepted |
| [0011](0011-rumus-progres-proyek-berbobot.md) | Rumus progres proyek berbobot | Accepted |
| [0012](0012-pengembangan-dengan-ai-agent-berbasis-kartu-task.md) | Pengembangan dengan AI agent berbasis kartu task | Accepted |

| [0013](0013-design-system-swiss-industrial.md) | Design system "Swiss Industrial" (putih netral + aksen merah) | Superseded by 0014 |
| [0014](0014-design-system-minimal-modern.md) | Design system "Minimal Modern" (putih netral + aksen merah) | Accepted |

Template ADR baru: salin [`template.md`](template.md).
