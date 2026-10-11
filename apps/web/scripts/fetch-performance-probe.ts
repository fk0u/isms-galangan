import { remoteRepository } from "../src/services/repositories";
import { PROCUREMENT_COLLECTIONS, financeCollectionsForTab } from "../src/data/moduleCollections";

const DATASET_SIZE = 12_000;
const syntheticRows = Array.from({ length: DATASET_SIZE }, (_, index) => ({
  id: `INV-SIM-${String(index).padStart(5, "0")}`,
  branch: index % 2 === 0 ? "JAKARTA" : "SURABAYA",
  updated_at: "2026-10-01T00:00:00.000Z",
  data: {
    name: `Material sintetis ${String(index).padStart(5, "0")}`,
    sku: `SIM-MAT-${String(index).padStart(5, "0")}`,
    category: index % 3 === 0 ? "Bahan baku" : "Komponen",
    stock: index % 997,
    unit: "kg",
    warehouse: "Gudang simulasi Jakarta",
    description: "Baris sintetis untuk mengukur payload inventory tanpa mengakses data produksi.",
  },
}));

let requestCount = 0;
let payloadBytes = 0;

const syntheticFetch = async <T>(path: string): Promise<T> => {
  requestCount += 1;
  const url = new URL(path, "https://synthetic.invalid");
  const params = url.searchParams;
  const q = (params.get("q") ?? "").toLocaleLowerCase();
  const branch = params.get("branch") ?? "";
  const limit = Number(params.get("limit") ?? 100);
  const offset = Number(params.get("after") ?? params.get("offset") ?? 0);
  const filtered = syntheticRows.filter((row) => {
    const matchesBranch = !branch || row.branch === branch;
    const matchesQuery = !q || JSON.stringify(row.data).toLocaleLowerCase().includes(q);
    return matchesBranch && matchesQuery;
  });
  const rows = filtered.slice(offset, offset + limit);
  const response = {
    rows,
    total: filtered.length,
    limit,
    offset,
    nextCursor: rows.length === limit ? String(offset + limit) : null,
  };
  payloadBytes += new TextEncoder().encode(JSON.stringify({ ok: true, data: response })).length;
  return response as T;
};

async function main(): Promise<void> {
  if (PROCUREMENT_COLLECTIONS.includes("inventory")) {
    throw new Error("Procurement batch masih memuat seluruh inventory");
  }
  const invoiceCollections = financeCollectionsForTab("Invoice");
  if (!invoiceCollections.includes("invoices") || invoiceCollections.includes("inventory")) {
    throw new Error("Batch tab Invoice Finance tidak selektif");
  }

  const fullList = await remoteRepository("inventory", syntheticFetch).list();
  const before = { requests: requestCount, payloadBytes };
  if (fullList.length !== DATASET_SIZE) throw new Error(`Full-list probe kehilangan baris: ${fullList.length}`);

  requestCount = 0;
  payloadBytes = 0;
  const result = await remoteRepository("inventory", syntheticFetch).listPaged?.({
    q: "SIM-MAT-00042",
    branch: "JAKARTA",
    page: 1,
    size: 25,
  });
  if (!result) throw new Error("listPaged tidak tersedia");
  const after = { requests: requestCount, payloadBytes };
  if (result.rows.length !== 1 || result.rows[0]?.branch !== "JAKARTA") {
    throw new Error("Filter server-side item/branch tidak menghasilkan baris yang benar");
  }
  if (before.requests < 3 || after.requests !== 1 || after.payloadBytes >= before.payloadBytes) {
    throw new Error("Probe tidak menunjukkan pengurangan request/payload yang diharapkan");
  }

  const report = {
    probe: "fetch-performance-issue-104",
    datasetRows: DATASET_SIZE,
    scenario: "full inventory sync versus exact server-side picker search (page size 25)",
    before,
    after,
    requestReductionPercent: Math.round((1 - after.requests / before.requests) * 10000) / 100,
    payloadReductionPercent: Math.round((1 - after.payloadBytes / before.payloadBytes) * 10000) / 100,
  };
  console.log(JSON.stringify(report, null, 2));
}

void main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
