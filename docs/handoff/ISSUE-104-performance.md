# Issue #104 — Pengukuran fetch Procurement/Finance

**Tanggal:** 11 Oktober 2026
**Branch:** `perf/ISSUE-104-procurement-finance-fetch`
**Issue:** [#104](https://github.com/fk0u/isms-galangan/issues/104)

## Hasil probe sintetis

Probe menjalankan repository HTTP yang sama dengan aplikasi, memakai respons server tiruan dan inventori sintetis 12.000 baris. Perbandingan adalah satu koleksi inventory yang dimuat penuh versus satu pencarian SKU dengan filter cabang, page 1, ukuran halaman 25.

| Skenario | Request | Payload respons JSON |
|---|---:|---:|
| Sebelum: full-list inventory (`limit=5000`, keyset) | 3 | 3.912.901 byte |
| Sesudah: exact SKU + cabang, `listPaged` | 1 | 405 byte |
| Pengurangan pada skenario ini | 66,67% | 99,99% |

Angka payload menghitung envelope JSON respons, tanpa header HTTP/TLS dan tanpa kompresi jaringan. Sebelum membutuhkan tiga halaman untuk 12.000 baris; sesudah hanya satu hasil pencarian yang cocok. Probe tidak mengakses atau memasukkan data produksi.

## Perubahan yang diukur/diuji

- Batch Procurement tidak lagi menarik koleksi `inventory`; saat picker PO besar atau penerimaan dibuka, pencarian memakai `q`, `branch`, `limit=25`, dan `offset` melalui `listPaged`.
- Pemenang RFQ mencocokkan nama inventory melalui filter API `exactName` (bukan substring halaman pertama): predicate JSON exact dijalankan server sebelum pagination dan tetap memakai branch/RBAC scope. Jika tidak ada tepat satu kecocokan, RFQ tidak ditetapkan dan PO tanpa `itemId` tidak dibuat. Di mode backend, kegagalan auth/jaringan/API untuk name-only lookup juga gagal tertutup karena cache Procurement parsial tidak membuktikan keunikan; fallback cache hanya dipakai di mode lokal setelah exact match unik, sedangkan jalur pilihan ID eksplisit tetap memakai `getById`/ID cache. Probe menempatkan 105 kecocokan substring sebelum item exact dan memastikan query branch palsu tidak memperluas hasil.
- Batch Finance mengikuti tab aktif, dan selalu memuat `invoices`, `payables`, `payroll`, serta `projects` yang dibutuhkan KPI global; koleksi spesifik tab tetap ditambahkan sesuai alur (misalnya tab **Akun** juga memuat `settings` + `coa`).
- Dependency Finance mencakup alur invoice secara utuh: **Invoice** menarik clients, client POs, BAST, contracts, services, termin, timesheet, warranty, dan work orders; **Piutang (AR)**/**Jadwal Bayar** juga mengambil data yang dibutuhkan saat settlement dari tab tersebut, bukan mengandalkan cache lama.
- WBS tidak diprefetch oleh tab Project P&L/Invoice/AR/Jadwal. Finance mengambil WBS proyek satu kali secara on-demand hanya saat settlement invoice memenuhi prasyarat penutupan (Handover, semua invoice proyek lunas, BAST disetujui); workflow dibatalkan jika generation sesi berubah, cache merge memeriksa epoch per-proyek yang ditangkap sebelum GET, endpoint tetap mengotorisasi proyek, dan kegagalan/staleness fetch remote tidak memakai WBS lama untuk menandai proyek selesai. Finance tidak memerlukan Team data sehingga tidak mengambilnya. Shell juga menunda WBS sync global selama route Finance saat bell tertutup; saat bell dibuka WBS tetap dimuat karena alert milestone dan critical-path shell membacanya. Sync Shell hanya meminta WBS (`includeTeam=false`).
- API membatasi list dan semua operasi by-ID ke `branch` dari identitas server; CRUD project PATCH/DELETE dan PUT WBS/Team memeriksa membership team setelah mengunci parent project row di dalam transaksi, sehingga revocation terserialisasi dengan side effects/side-map writes. SQL mutation terikat ke branch awal dan row di luar scope disamarkan sebagai 404. Row tanpa branch ditolak untuk koleksi terbatas cabang, sedangkan koleksi global dikecualikan secara eksplisit. Employee-linked user yang branch row-nya kosong/hilang atau lookup gagal ditolak dengan `503 BRANCH_SCOPE_UNAVAILABLE` (bukan dinaikkan ke scope global); list dan by-ID branch filter fail-closed untuk scope kosong. Probe cabang memeriksa query palsu, GET/PATCH/DELETE lintas cabang, grant/revoke membership proyek, PUT WBS/Team sebelum dan sesudah revoke, project di luar team scope, row kosong, akun global, dan pembersihan fixture.
- Filter cabang offline fail-closed: row tanpa label cabang, label kosong, atau label dengan casing berbeda tidak ikut masuk ke cabang aktif. Alert shell/dashboard juga membatasi koleksi dan WBS proyek ke cabang aktif.
- Hasil halaman picker dipakai ulang selama 30 detik; penulisan dan SSE menginvalidasi koleksi terkait. Hasil yang ditolak RBAC (401/403) tidak diganti dengan cache picker lokal; ketika offline, picker memakai cache lokal yang sudah dibatasi cabang.
- API list-response cache memakai generation token per tabel: GET yang dimulai sebelum invalidasi tidak dapat mengisi kembali cache/ETag dengan snapshot lama, dan transaksi menginvalidasi ulang setelah commit untuk menutup jendela pre-commit. Regression test mencakup invalidasi lintas tabel, cache clear, serta respons in-flight yang ditolak.
- Cache IndexedDB dibatasi owner dan sesi; writer memeriksa owner sebelum setiap write. WBS/Team offline maps beserta baseline compare-and-swap tersimpan owner-scoped dan dihidrasi kembali; edit offline tetap terlindungi konflik setelah reload. Pull WBS/Team menyimpan epoch per proyek sebelum GET dan menolak hasil maupun baseline jika mutasi online/offline proyek itu terjadi selama request; GET yang dimulai saat PUT masih in-flight juga tidak dapat merge sebelum write settle. Scope pruning dan row array project menggabungkan server snapshot dengan perubahan create/update/remove per-ID yang berhasil setelah request dimulai; ini mencegah GET usang menghapus create baru atau menghidupkan kembali delete. Project-side cache/baseline dengan active write, dirty edit, atau conflict hold tidak dibuang. PUT WBS/Team online mengirim `baseData`; baris server yang hilang diperlakukan sebagai snapshot `[]`, sehingga baseline lama menghasilkan 409 STALE, bukan overwrite diam-diam. Konflik mempertahankan draft lokal, menyimpan baseline server, dan menahan project dari auto-push. Pengguna harus meninjau lalu mengonfirmasi pengiriman ulang untuk mengganti versi server, sehingga konflik tidak auto-overwrite. Respons CRUD, WBS/Team, dan push lama yang selesai setelah owner/JWT berubah tidak diterapkan ke store baru dan tidak memulai retry lintas sesi.
- Probe yang dapat diulang: `npm run probe:fetch-performance --prefix apps/web`.

## Batas pengukuran

Perbandingan di atas mengukur alur inventory, bukan angka agregat seluruh halaman atau jumlah bytes aktual sesudah gzip. Batch Finance divalidasi lewat pemetaan koleksi per tab dan pemeriksaan aplikasi; jumlah request produksi tetap bergantung pada data, izin pengguna/cabang, cache, dan event SSE.

## Verifikasi

- `npm run check` dari root lulus pada source final; web **41/41 tests** (12 files), API **15/15 tests** (4 files), dan `git diff --check` bersih.
- Branch-scope probe lulus **32/32**; termasuk exact inventory lookup dengan 105 substring matches, target exact setelah halaman awal, query branch palsu, dan cleanup fixture di blok `finally`.
- Security-isolation probe lulus: caller DB/uploads tidak berubah; jika source DB hilang, skenario T02–T05 dicatat sebagai blocker K dan gate keluar non-zero (bukan dianggap tidak ada temuan). Drydock probe lulus **11/11** dan list-cache probe **9/9**.
- Regression suite mencakup session fence, persistence owner-scoped, branch/project scope, side-map epochs/conflict holds, exact-name lookup serta penolakan fallback name-only ambigu; API probe memeriksa CAS WBS/Team ketika side-map row telah dihapus.
- Predicate MySQL diverifikasi melalui generated-SQL assertions dan TypeScript/build, tetapi tidak diuji terhadap instance MySQL live pada run ini; SQLite/API integration probes lulus.
- Pemeriksaan visual demo Procurement: [picker PO besar](issue-104-procurement-picker.png).
