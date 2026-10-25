import fs from "node:fs";
import path from "node:path";
import { exec, q, withTx, closeDb } from "../src/db.js";

interface InvoiceRecord {
  id: string;
  no: string;
  noInv: string;
  vessel: string;
  client: string;
  project: string;
  branch: string;
  jasaTotal: number;
  matTotal: number;
  amount: number;
  dpp: number;
  ppnAmt: number;
  pphAmt: number;
  ppnRate: number;
  pphRate: number;
  grandTotal: number;
  date: string;
  due: string;
  status: "Lunas" | "Belum Dibayar";
  sisa: number;
  paidTotal: number;
  paidAt: string;
  fakturPajak: string;
  buktiPotong: string;
  dockReport: string;
  pimpro: string;
  arsip: string;
  billingType: string;
  paymentTerm: string;
  payments: Array<{ termin: string; amount: number; date: string }>;
  costs: Array<{ desc: string; amount: number }>;
  modalTotal: number;
  lines: Array<{ desc: string; qty: number; unit: string; price: number; amount: number; kategori: string }>;
}

interface MasterData {
  companies: string[];
  vessels: Array<{ name: string; owner: string; type: string; status: string }>;
}

async function runImport(): Promise<void> {
  const dataDir = path.resolve(import.meta.dirname, "../data");
  const invPath = path.join(dataDir, "invoices-2026.json");
  const masterPath = path.join(dataDir, "master-data-2026.json");

  if (!fs.existsSync(invPath)) {
    throw new Error(`Berkas tidak ditemukan: ${invPath}. Jalankan parse Excel terlebih dahulu.`);
  }

  const invoices = JSON.parse(fs.readFileSync(invPath, "utf8")) as InvoiceRecord[];
  const master: MasterData = fs.existsSync(masterPath)
    ? JSON.parse(fs.readFileSync(masterPath, "utf8"))
    : { companies: [], vessels: [] };

  console.log(`=== Memulai Impor Data Invoice 2026 (${invoices.length} invoice) ===`);

  const now = new Date().toISOString();

  await withTx(async () => {
    // 1. Impor Master Klien / Perusahaan
    const existingClients = await q<{ id: string; data: string }>("SELECT id, data FROM clients");
    const clientNameMap = new Map<string, string>();
    for (const c of existingClients) {
      try {
        const d = JSON.parse(c.data) as { name?: string };
        if (d.name) clientNameMap.set(d.name.trim().toUpperCase(), c.id);
      } catch {
        // abaikan JSON korup
      }
    }

    let clientsInserted = 0;
    let clientSeq = 1;
    for (const comp of master.companies) {
      const key = comp.trim().toUpperCase();
      if (!key || clientNameMap.has(key)) continue;

      let newId = `C-SB-${String(clientSeq).padStart(3, "0")}`;
      while (existingClients.some((c) => c.id === newId)) {
        clientSeq += 1;
        newId = `C-SB-${String(clientSeq).padStart(3, "0")}`;
      }
      clientSeq += 1;

      const clientData = {
        name: comp.trim(),
        fleet: 1,
        rating: 90,
        since: 2026,
      };

      await exec("INSERT INTO clients (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
        newId,
        "Samarinda",
        JSON.stringify(clientData),
        now,
      ]);
      clientNameMap.set(key, newId);
      clientsInserted += 1;
    }
    console.log(`[clients] Berhasil memasukkan ${clientsInserted} pelanggan baru.`);

    // 2. Impor Master Kapal / Armada
    const existingVessels = await q<{ id: string; data: string }>("SELECT id, data FROM vessels");
    const vesselNameMap = new Map<string, string>();
    for (const v of existingVessels) {
      try {
        const d = JSON.parse(v.data) as { name?: string };
        if (d.name) vesselNameMap.set(d.name.trim().toUpperCase(), v.id);
      } catch {
        // abaikan JSON korup
      }
    }

    let vesselsInserted = 0;
    let vesselSeq = 1;
    for (const v of master.vessels) {
      const key = v.name.trim().toUpperCase();
      if (!key || vesselNameMap.has(key)) continue;

      let newId = `V-SB-${String(vesselSeq).padStart(3, "0")}`;
      while (existingVessels.some((row) => row.id === newId)) {
        vesselSeq += 1;
        newId = `V-SB-${String(vesselSeq).padStart(3, "0")}`;
      }
      vesselSeq += 1;

      const vesselData = {
        name: v.name.trim(),
        owner: v.owner.trim(),
        type: v.type,
        flag: "Indonesia",
        status: v.status || "Operasional",
      };

      await exec("INSERT INTO vessels (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
        newId,
        "Samarinda",
        JSON.stringify(vesselData),
        now,
      ]);
      vesselNameMap.set(key, newId);
      vesselsInserted += 1;
    }
    console.log(`[vessels] Berhasil memasukkan ${vesselsInserted} kapal/armada baru.`);

    // 3. Impor Faktur / Invoices
    let invInserted = 0;
    let invUpdated = 0;
    let totalNominal = 0;

    for (const inv of invoices) {
      totalNominal += inv.grandTotal;

      const existing = await q<{ id: string }>("SELECT id FROM invoices WHERE id = ?", [inv.id]);
      if (existing.length > 0) {
        await exec("UPDATE invoices SET branch = ?, data = ?, updated_at = ? WHERE id = ?", [
          "Samarinda",
          JSON.stringify(inv),
          now,
          inv.id,
        ]);
        invUpdated += 1;
      } else {
        await exec("INSERT INTO invoices (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
          inv.id,
          "Samarinda",
          JSON.stringify(inv),
          now,
        ]);
        invInserted += 1;
      }
    }

    console.log(`[invoices] Berhasil memproses ${invoices.length} invoice:`);
    console.log(`  - Disisipkan (baru): ${invInserted}`);
    console.log(`  - Diperbarui (lama): ${invUpdated}`);
    console.log(`  - Total Nilai Tagihan: Rp ${totalNominal.toLocaleString("id-ID")}`);
  });

  console.log("=== Impor Data Selesai dengan Sukses ===");
}

runImport()
  .then(() => closeDb().then(() => process.exit(0)))
  .catch((err) => {
    console.error("[import] Gagal:", err);
    closeDb().finally(() => process.exit(1));
  });
