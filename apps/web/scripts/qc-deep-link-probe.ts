/* Regression probe: tab Drawing di QC/Safety disembunyikan.
   Menjaga agar deep-link ?tab=Drawing tidak bisa mengaktifkan workflow lama.
   Jalankan: npm run probe:qc-deep-link */
import { allowlistedDeepLinkTab } from "../src/components/useDeepLink";
import { QC_SAFETY_TABS } from "../src/pages/qc/qcTabs";

declare const process: { exit(code: number): never };

let fail = 0;
const assert = (ok: boolean, label: string, detail = ""): void => {
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail !== "" ? ` -> ${detail}` : ""}`);
};

const defaultTab = QC_SAFETY_TABS[0] ?? "";
const rawTab = new URLSearchParams("tab=Drawing").get("tab") ?? "";
const acceptedTab = allowlistedDeepLinkTab(rawTab, QC_SAFETY_TABS);
let activeTab = defaultTab;
if (acceptedTab !== "") activeTab = acceptedTab;

assert(!QC_SAFETY_TABS.includes("Drawing"), "Drawing tidak ada di daftar tab QC/Safety yang terlihat");
assert(acceptedTab === "", "?tab=Drawing ditolak oleh allowlist", `accepted=${acceptedTab || "(kosong)"}`);
assert(activeTab === defaultTab, "deep-link Drawing tidak mengubah tab aktif ke workflow tersembunyi", `active=${activeTab}`);
assert(QC_SAFETY_TABS.includes(activeTab), "tab aktif tetap salah satu tab QC/Safety yang diizinkan", activeTab);

const acceptedNcr = allowlistedDeepLinkTab("NCR", QC_SAFETY_TABS);
assert(acceptedNcr === "NCR", "deep-link untuk tab yang diizinkan tetap diterima", acceptedNcr);

console.log(fail === 0 ? "QC deep-link probe: PASS" : `QC deep-link probe: FAIL (${fail} assertion)`);
if (fail > 0) process.exit(1);
