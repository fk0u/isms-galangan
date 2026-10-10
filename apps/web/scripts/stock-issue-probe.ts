import { formatStockWithBase, issueBase, plateCutKg, totalBase } from "../src/utils/stockIssue";

/* F3-G-03: barang keluar eceran (kemasan terbuka) & potongan plat. */
declare const process: { exit(code: number): never };
let failures = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  if (condition) console.log(`PASS  ${name}`);
  else {
    failures++;
    console.error(`FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

const drum = { baseUnit: "liter", perUnit: 200 };
const r1 = issueBase({ stock: 3, openBase: 0 }, 200, 50);
assert("Keluar 50 L dari 3 drum utuh → buka 1 drum, sisa 150 L", r1.ok && r1.next.stock === 2 && r1.next.openBase === 150 && r1.opened === 1, JSON.stringify(r1));
assert("Tampilan '3 drum (550 L)'", r1.ok && formatStockWithBase(r1.next, "drum", drum) === "3 drum (550 L)", r1.ok ? formatStockWithBase(r1.next, "drum", drum) : "");
const r2 = r1.ok ? issueBase(r1.next, 200, 100) : r1;
assert("Keluar 100 L memakai kemasan terbuka dulu", r2.ok && r2.next.stock === 2 && r2.next.openBase === 50 && r2.opened === 0);
const r3 = r2.ok ? issueBase(r2.next, 200, 300) : r2;
assert("Keluar 300 L: sisa 50 + buka 2 drum, sisa 150", r3.ok && r3.next.stock === 0 && r3.next.openBase === 150 && r3.opened === 2, JSON.stringify(r3));
assert("Total satuan dasar konsisten (600 - 450 = 150)", r3.ok && totalBase(r3.next, 200) === 150);
const over = issueBase({ stock: 1, openBase: 20 }, 200, 221);
assert("Melebihi stok ditolak", !over.ok);
assert("Qty 0 ditolak", !issueBase({ stock: 1, openBase: 0 }, 200, 0).ok);

const plat = { baseUnit: "kg", perUnit: 1100, dims: { lengthMm: 6000, widthMm: 1500, thicknessMm: 12, weightKg: 848 } };
const cut = plateCutKg(plat, 1500, 750);
assert("Potongan 1500×750 dari 6000×1500 = 1/8 berat (106 kg)", cut === 106, String(cut));
assert("Potongan melebihi lembar ditolak", plateCutKg(plat, 7000, 100) === null);

if (failures > 0) {
  console.error(`stock-issue-probe: ${failures} gagal.`);
  process.exit(1);
}
console.log("Semua pemeriksaan barang keluar eceran & potongan (F3-G-03) lolos.");
