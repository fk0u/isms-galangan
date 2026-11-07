// Cek kecil plan(): dedupe nama klien/kapal, satu proyek per invoice, idempoten.
import assert from "node:assert/strict";
import { plan, planSubkon, vesselType } from "./generate-from-invoices.js";

const inv = [
  { id: "INV-A", data: { client: "PT Satu", vessel: "TB  Alfa 1", date: "2026-01-02", amount: 100, modal: [{ amount: 30 }, { amount: 20 }], pimpro: "X", project: "" } },
  { id: "INV-B", data: { client: "pt satu", vessel: "TB Alfa 1", date: "2026-02-01", grandTotal: 50, project: "PRJ-LAMA" } },
  { id: "INV-D", data: { client: "PT Dua", vessel: "BG Beta", date: "2026-02-03", grandTotal: 70, modalTotal: 40 } },
  { id: "INV-C", data: { client: "PT Dua", vessel: "", date: "2026-03-01" } },
];
const p = plan(inv, new Set(["PT DUA"]), new Set(), new Set());
assert.deepEqual(p.clients.map((c) => c.name), ["PT Satu"]);
assert.deepEqual(p.vessels.map((v) => [v.name, v.type, v.owner]), [["TB Alfa 1", "Tugboat", "PT Satu"], ["BG Beta", "Barge", "PT Dua"]]);
// INV-B sudah punya proyek, INV-C tanpa kapal → tidak dibuatkan.
assert.deepEqual(p.projects.map((x) => [x.id, x.data.budget, x.data.actual]), [["PRJ-INV-A", 100, 50], ["PRJ-INV-D", 70, 40]]);
assert.deepEqual(p.links.map((l) => l.id), ["INV-A", "INV-D"]);
// Jalankan ulang setelah apply: invoice sudah tertaut → tidak ada apa pun.
const linked = inv.map((x) => ({ ...x, data: { ...x.data, project: x.data.project || `PRJ-${x.id}` } }));
const again = plan(linked, new Set(["PT SATU", "PT DUA"]), new Set(["TB ALFA 1", "BG BETA"]), new Set(["PRJ-INV-A", "PRJ-INV-D"]));
assert.equal(again.clients.length + again.vessels.length + again.projects.length + again.links.length, 0);
assert.equal(vesselType("BG Santoso"), "Barge");
// Subkon: pos biaya umum dilewati, nama sama digabung, yang sudah ada dilewati.
const sub = planSubkon([
  { data: { modal: [{ label: "Material", amount: 9 }, { label: "Budi", amount: 10 }, { label: "Karyawan & Listrik", amount: 5 }] } },
  { data: { modal: [{ label: " budi ", amount: 15 }, { label: "Joko", amount: 1 }, { label: "Fee", amount: 2 }] } },
], new Set(["JOKO"]));
assert.deepEqual(sub.map((x) => [x.name, x.contract, x.active]), [["Budi", 25, 2]]);
console.log("generate-from-invoices: ok");
