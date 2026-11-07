// Cek kecil linesFor: cicilan, kelebihan bayar, dokumen idempoten.
import assert from "node:assert/strict";
import { linesFor } from "./journal-invoice-payments.js";

const l = linesFor("INV-X", { grandTotal: 100, payments: [{ date: "2026-01-01", amount: 40, method: "Transfer" }, { date: "2026-01-02", amount: 70, method: "Tunai" }] });
assert.deepEqual(l.map((x) => [x.dokumen, x.db, x.kr, x.amount]), [
  ["CASH-INV-X", "1-120", "1-130", 40],
  ["CASH-INV-X-2", "1-111", "1-130", 60],
  ["CASH-INV-X-2-LEBIH", "1-111", "2-150", 10],
]);
assert.match(l[1].uraian, /^Pelunasan/);
assert.deepEqual(linesFor("INV-Y", { grandTotal: 5 }), []);
assert.equal(linesFor("INV-Z", { amount: 100, retentionAmt: 10, payments: [{ date: "2026-01-01", amount: 90 }] })[0].kr, "1-130");
console.log("journal-invoice-payments: ok");
