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
- Batch Finance mengikuti tab aktif, dan selalu memuat `invoices`, `payables`, `payroll`, serta `projects` yang dibutuhkan KPI global; koleksi spesifik tab tetap ditambahkan sesuai alur (misalnya tab **Akun** juga memuat `settings` + `coa`).
- API membatasi list dan get-by-id ke `branch` dari identitas server; row tanpa branch ditolak untuk koleksi terbatas cabang, sedangkan koleksi global dikecualikan secara eksplisit. Probe cabang memeriksa query palsu, lintas cabang, row kosong, akun global, dan pembersihan fixture.
- Hasil halaman picker dipakai ulang selama 30 detik; penulisan dan SSE menginvalidasi koleksi terkait. Hasil yang ditolak RBAC (401/403) tidak diganti dengan cache picker lokal; ketika offline, picker memakai cache lokal yang sudah dibatasi cabang.
- Probe yang dapat diulang: `npm run probe:fetch-performance --prefix apps/web`.

## Batas pengukuran

Perbandingan di atas mengukur alur inventory, bukan angka agregat seluruh halaman atau jumlah bytes aktual sesudah gzip. Batch Finance divalidasi lewat pemetaan koleksi per tab dan pemeriksaan aplikasi; jumlah request produksi tetap bergantung pada data, izin pengguna/cabang, cache, dan event SSE.
