// Cek kecil plan(): dedupe nama klien/kapal, satu proyek per invoice, idempoten.
import assert from "node:assert/strict";
import { plan, vesselType } from "./generate-from-invoices.js";

const inv = [
  { id: "INV-A", data: { client: "PT Satu", vessel: "TB  Alfa 1", date: "2026-01-02", amount: 100, modal: [{ amount: 30 }, { amount: 20 }], pimpro: "X", project: "" } },
  { id: "INV-B", data: { client: "pt satu", vessel: "TB Alfa 1", date: "2026-02-01", grandTotal: 50, project: "PRJ-LAMA" } },
  { id: "INV-C", data: { client: "PT Dua", vessel: "", date: "2026-03-01" } },
];
const p = plan(inv, new Set(["PT DUA"]), new Set(), new Set());
assert.deepEqual(p.clients.map((c) => c.name), ["PT Satu"]);
assert.deepEqual(p.vessels.map((v) => [v.name, v.type, v.owner]), [["TB Alfa 1", "Tugboat", "PT Satu"]]);
assert.deepEqual(p.projects.map((x) => [x.id, x.data.budget, x.data.actual]), [["PRJ-INV-A", 100, 50], ["PRJ-INV-B", 50, 0]]);
assert.deepEqual(p.links, [{ id: "INV-A", project: "PRJ-INV-A" }]); // INV-B sudah punya proyek, INV-C tanpa kapal
const again = plan(inv, new Set(["PT SATU", "PT DUA"]), new Set(["TB ALFA 1"]), new Set(["PRJ-INV-A", "PRJ-INV-B"]));
assert.equal(again.clients.length + again.vessels.length + again.projects.length, 0);
assert.equal(vesselType("BG Santoso"), "Barge");
console.log("generate-from-invoices: ok");
