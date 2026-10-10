/* Probe F3-F-01: batas ukuran kapal per dock. */
import assert from "node:assert/strict";
import { dockFitIssue } from "../src/dockFit.js";

const dock = { maxLoa: 60, maxBeam: 12, maxDraft: 4 };
assert.equal(dockFitIssue(dock, { loa: 55, beam: 10, draft: 3.5 }), null, "kapal muat");
assert.match(String(dockFitIssue(dock, { loa: 72, beam: 10, draft: 3 })), /LOA/, "LOA berlebih ditolak");
assert.match(String(dockFitIssue(dock, { loa: 50, beam: 13, draft: 3 })), /lebar/, "lebar berlebih ditolak");
assert.match(String(dockFitIssue(dock, { loa: 50, beam: 10, draft: 4.5 })), /sarat/, "sarat berlebih ditolak");
assert.equal(dockFitIssue({}, { loa: 500 }), null, "tanpa batas = tidak dibatasi");
assert.equal(dockFitIssue(dock, {}), null, "data kapal kosong tidak dibandingkan");
assert.equal(dockFitIssue({ maxLoa: 0 }, { loa: 500 }), null, "batas 0 = tidak dibatasi");
console.log("[dock-fit-probe] 7/7 lulus");
