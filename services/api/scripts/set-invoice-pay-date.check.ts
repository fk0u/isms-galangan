// Cek kecil parse argumen & nama dokumen jurnal.
import assert from "node:assert/strict";
import { dokumenOf, parseArg } from "./set-invoice-pay-date.js";

assert.deepEqual(parseArg("007/INV-SB/SMD/I/2026=2026-02-10"), { key: "007/INV-SB/SMD/I/2026", n: 1, date: "2026-02-10" });
assert.deepEqual(parseArg("INV-X#2=2026-03-01"), { key: "INV-X", n: 2, date: "2026-03-01" });
assert.throws(() => parseArg("INV-X=10-02-2026"));
assert.equal(dokumenOf("INV-X", 1), "CASH-INV-X");
assert.equal(dokumenOf("INV-X", 3), "CASH-INV-X-3");
console.log("set-invoice-pay-date: ok");
