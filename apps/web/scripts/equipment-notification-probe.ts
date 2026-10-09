/* Probe regresi F3-H-01: notifikasi equipment harus membuka target setelah
   search/filter Register dibersihkan dan paginator dihitung dari hasil baru.
   Skenario lama menghitung indeks dari daftar penuh, tetapi memanggil go()
   dari paginator yang masih ter-clamp oleh jumlah hasil filter lama.
   Jalankan: npm run probe:equipment-notif */
import { findEquipmentNotificationTarget } from "../src/utils/equipmentNotifications";
import { rowMatches, sortRows } from "../src/components/ui";

declare const process: { exit(code: number): never };
let fail = 0;
const assert = (ok: boolean, label: string, detail = ""): void => {
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` -> ${detail}` : ""}`);
};

const rows = [
  { id: "EQ-01", name: "Crane Alfa", status: "Tersedia", category: "Pengangkat" },
  { id: "EQ-02", name: "Forklift Beta", status: "Tersedia", category: "Transportasi" },
  { id: "EQ-03", name: "Generator Cakra", status: "Maintenance", category: "Tenaga" },
  { id: "EQ-04", name: "Kompresor Delta", status: "Tersedia", category: "Tenaga" },
  { id: "EQ-05", name: "Pompa Elang", status: "Terpakai", category: "Tenaga" },
  { id: "EQ-06", name: "Winch Fajar", status: "Terpakai", category: "Pengangkat" },
  { id: "EQ-07", name: "Zebra Target", status: "Maintenance", category: "Transportasi" },
];
const sorted = sortRows(rows, { key: "name", dir: "asc" }, (row) => row.name);
const targetIds = ["EQ-07"];
const size = 2;
const currentFiltered = sorted.filter((row) =>
  row.status === "Tersedia" &&
  row.category === "Pengangkat" &&
  rowMatches(row, "forklift", ["id", "name", "status", "category"]),
);
const beforeReset = findEquipmentNotificationTarget(currentFiltered, targetIds, size);
assert(beforeReset === null, "target tak ditemukan saat search/status/kategori masih memfilter Register");

/* Fallback mengosongkan ketiga filter, lalu effect mencari target dari hasil
   Register baru sebelum memanggil paginator. Target ketujuh ada di halaman 4
   ketika ukuran halaman 2; halaman itu harus dipilih, bukan page lama yang
   ter-clamp oleh satu hasil pencarian. */
const afterReset = findEquipmentNotificationTarget(sorted, targetIds, size);
assert(afterReset?.index === 6, "indeks target dihitung dari hasil sesudah filter dibersihkan", String(afterReset?.index));
assert(afterReset?.page === 4, "paginator diarahkan ke halaman target dari hasil sesudah filter dibersihkan", String(afterReset?.page));
assert(
  findEquipmentNotificationTarget(sorted, ["EQ-02", "EQ-07"], size)?.index === 1,
  "kelompok notifikasi tetap memilih target pertama yang terlihat dalam urutan baru",
  String(findEquipmentNotificationTarget(sorted, ["EQ-02", "EQ-07"], size)?.index),
);

if (fail > 0) {
  console.error(`\nGAGAL: ${fail} pemeriksaan notifikasi equipment`);
  process.exit(1);
}
console.log("\nLULUS: seluruh pemeriksaan notifikasi equipment");
