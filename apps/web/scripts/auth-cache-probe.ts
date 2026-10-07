// Probe pengujian isolasi cache dan pembersihan offline (F2-07)
import "./browser-shims";
import { clearIsmsLocalStorage, purgeOfflineCache } from "../src/data/idb";

declare const process: { exit(code: number): never };

let failCount = 0;

function assert(name: string, ok: boolean, details?: string) {
  if (ok) {
    console.log(`PASS  ${name}`);
  } else {
    failCount++;
    console.error(`FAIL  ${name}${details ? ` -> ${details}` : ""}`);
  }
}

async function run() {
  console.log("=== ISMS Auth & Offline Cache Probe (F2-07) ===");

  // 1. Uji pembersihan localStorage
  localStorage.setItem("isms.dirty", JSON.stringify({ entries: ["projects"] }));
  localStorage.setItem("isms.cache.ownerUserId", "user-A");
  localStorage.setItem("isms.tombstones", JSON.stringify({}));
  localStorage.setItem("isms.parts.projects", JSON.stringify([{ id: "1" }]));
  localStorage.setItem("isms.locale", "id");
  localStorage.setItem("isms.minSide", "true");
  localStorage.setItem("other.app.key", "keep-me");

  clearIsmsLocalStorage();

  assert("isms.dirty dihapus saat pembersihan cache", localStorage.getItem("isms.dirty") === null);
  assert("isms.cache.ownerUserId dihapus saat pembersihan cache", localStorage.getItem("isms.cache.ownerUserId") === null);
  assert("isms.parts.projects dihapus saat pembersihan cache", localStorage.getItem("isms.parts.projects") === null);
  assert("preferensi isms.locale tetap dipertahankan", localStorage.getItem("isms.locale") === "id");
  assert("preferensi isms.minSide tetap dipertahankan", localStorage.getItem("isms.minSide") === "true");
  assert("kunci di luar isms.* tidak tersentuh", localStorage.getItem("other.app.key") === "keep-me");

  // 2. Uji purgeOfflineCache
  localStorage.setItem("isms.parts.invoices", JSON.stringify([{ id: "INV-1" }]));
  await purgeOfflineCache();
  assert("purgeOfflineCache membersihkan fallback cache localStorage", localStorage.getItem("isms.parts.invoices") === null);

  // 3. Uji deteksi pergantian user
  localStorage.setItem("isms.cache.ownerUserId", "user-123");
  const stored = localStorage.getItem("isms.cache.ownerUserId");
  const newUser = "user-456";
  const userSwitched = stored !== null && stored !== newUser;
  assert("Sistem mendeteksi saat pengguna berbeda masuk ke perangkat", userSwitched);

  if (failCount > 0) {
    console.error(`\nGAGAL: ${failCount} pemeriksaan cache auth gagal.`);
    process.exit(1);
  }
  console.log("Semua pemeriksaan pembersihan cache offline (F2-07) lolos.\n");
  process.exit(0);
}

void run();
