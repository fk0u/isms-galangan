# Dokumentasi REST API (Bruno)

Koleksi [Bruno](https://www.usebruno.com/) ada di `docs/api/bruno/`. Isinya **dibangkitkan dari rute Fastify yang terdaftar**, jadi selalu sama dengan kode.

## Pakai
1. Buka Bruno → *Open Collection* → pilih folder `docs/api/bruno`.
2. Pilih environment **Lokal** (`http://localhost:3000`) atau **Server** (`https://galangan.alk-tech.my.id`), lalu isi `username` dan `password` (variabel rahasia, tidak ikut tersimpan ke git).
3. Jalankan **Auth → Login**. Token disimpan otomatis ke `{{token}}`, dan semua request lain memakainya.
4. Isi variabel `id` (dan `child` untuk POST related) di environment atau di tab *Params*.

## Struktur
| Folder | Isi |
|---|---|
| `CRUD/<koleksi>` | List (filter `where.<field>=`, `q`, `limit`/`offset`/`after`), Get, Create, Update (PATCH merge), Delete, **Related**, **Expand**, **Create related** |
| `Auth` | login, logout, me, sesi, demo |
| `Khusus/<modul>` | rute domain: status/revisi surat BoQ, PDF, WBS, pengeluaran/penambahan stok, PO parsial, event realtime, admin, dll. |

Format respons: `{ "ok": true, "data": ... }` atau `{ "ok": false, "error": { "message", "code" } }`.
Body create/update: `{ "data": { ...field }, "branch"?: "..." }`.

## Relasi antar-koleksi
- `GET /api/<koleksi>/<id>/related`: semua baris koleksi lain yang merujuk baris ini.
- `GET /api/<koleksi>/<id>/expand?fields=a,b|*`: baris beserta data induknya.
- `POST /api/<koleksi>/<id>/related/<anak>[?field=]`: membuat data anak dengan field relasi terisi otomatis.

Relasi **keras** (`services/api/src/refs.ts`) memakai id. Relasi **lunak** (`SOFT_REFS` di `routes/relations.ts`) memakai id atau nama, misalnya kapal, klien, subkon, vendor, dan equipment.

## Memperbarui
```bash
npm run gen:bruno --prefix services/api
```
`npm run check` menjalankan `probe:bruno`. Probe ini gagal bila ada rute baru yang belum masuk koleksi atau bila koleksi sudah basi.
