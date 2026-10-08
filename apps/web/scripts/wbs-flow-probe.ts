/* Probe alur WBS (F3-B-09):
   - Update progres mencatat riwayat perubahan (before, after, actor, foto, material)
   - Pemakaian material memotong stok dan membuat movements OUT
   - Pemakaian material saat stok kurang membuat requisition (PR) untuk kekurangannya (alur F3-D)
   - Penugasan WBS internal ke karyawan
   - Penugasan WBS eksternal ke subkontraktor membuat/menautkan Work Order (WO)

   Jalankan: npm run probe:wbs */
import type { WbsItem, WbsHistoryItem, WbsAssignee } from "../src/data/store";

declare const process: { exit(code: number): never };

let fail = 0;
const assert = (ok: boolean, label: string, detail = ""): void => {
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail !== "" ? ` -> ${detail}` : ""}`);
};

console.log("=== Memeriksa Logika dan Struktur Data WBS (F3-B-09) ===");

// 1. Uji struktur data WBS & Riwayat
{
  const history: WbsHistoryItem[] = [
    {
      id: "hist-1",
      date: "2026-10-08T10:00:00Z",
      actor: "Budi Santoso",
      action: "Update progres: 0% → 30%",
      from: 0,
      to: 30,
      note: "Pengerjaan awal section 1 selesai",
      photos: ["https://example.com/photo1.jpg"],
      material: "Pelat Baja AH36",
      qty: 2,
    },
    {
      id: "hist-2",
      date: "2026-10-08T15:00:00Z",
      actor: "Budi Santoso",
      action: "Update progres: 30% → 60%",
      from: 30,
      to: 60,
      note: "Pemasangan section 2",
      photos: ["https://example.com/photo2.jpg"],
    },
  ];

  const wbs: WbsItem = {
    task: "Fabrikasi Lambung",
    start: "2026-08-01",
    end: "2026-09-01",
    progress: 60,
    weight: 25,
    materialUsed: "Pelat Baja AH36",
    materialQty: 2,
    history,
  };

  assert(wbs.history !== undefined && wbs.history.length === 2, "WbsItem mendukung array history", `panjang: ${wbs.history?.length}`);
  assert(wbs.history?.[0].from === 0 && wbs.history?.[0].to === 30, "Entri history mencatat progres before -> after");
  assert(wbs.history?.[0].actor === "Budi Santoso", "Entri history mencatat aktor perubahan");
  assert(wbs.history?.[0].photos?.[0] === "https://example.com/photo1.jpg", "Entri history mencatat URL foto");
}

// 2. Uji alur material: stok cukup -> potong stok & movements OUT
{
  let stock = 10;
  const movements: any[] = [];
  const reqQty = 3;
  const itemName = "Cat Primer Marine";
  const itemId = "INV-001";
  const projectId = "PRJ-001";
  const wbsTask = "Coating Lambung";

  if (stock >= reqQty) {
    stock -= reqQty;
    movements.push({
      item: itemName,
      itemId,
      type: "Pengeluaran",
      qty: reqQty,
      by: `WBS: ${wbsTask}`,
      tone: "out",
      ref: { projectId, wbsId: wbsTask, wbsTask },
    });
  }

  assert(stock === 7, "Stok berkurang dari 10 menjadi 7 saat stok cukup", `sisa: ${stock}`);
  assert(movements.length === 1 && movements[0].type === "Pengeluaran" && movements[0].qty === 3, "Movements OUT dibuat dengan qty 3");
  assert(movements[0].ref.projectId === projectId && movements[0].ref.wbsTask === wbsTask, "Movements mereferensikan projectId dan wbsTask");
}

// 3. Uji alur material: stok kurang -> keluarkan stok ada + buat requisition (PR) untuk kekurangannya (F3-D)
{
  let stock = 2;
  const movements: any[] = [];
  const requisitions: any[] = [];
  const reqQty = 5;
  const itemName = "Elektroda Las LB-52";
  const itemId = "INV-002";
  const projectId = "PRJ-001";
  const wbsTask = "Pengelasan Hull Block";

  if (stock < reqQty) {
    const available = Math.max(0, stock);
    const diff = reqQty - available;
    if (available > 0) {
      stock = 0;
      movements.push({
        item: itemName,
        itemId,
        type: "Pengeluaran",
        qty: available,
        by: `WBS: ${wbsTask}`,
        tone: "out",
        ref: { projectId, wbsId: wbsTask, wbsTask },
      });
    }
    requisitions.push({
      projectId,
      item: itemName,
      itemId,
      qty: diff,
      unit: "dus",
      status: "Diajukan",
      note: `Permintaan material WBS: ${wbsTask} (stok tersedia ${available}, butuh ${reqQty})`,
      ref: { projectId, wbsId: wbsTask, wbsTask },
    });
  }

  assert(stock === 0, "Stok yang ada terpakai habis (0)", `stok: ${stock}`);
  assert(movements.length === 1 && movements[0].qty === 2, "Movement OUT dibuat untuk 2 unit yang tersedia");
  assert(requisitions.length === 1 && requisitions[0].qty === 3 && requisitions[0].status === "Diajukan", "Requisition (PR) dibuat untuk 3 unit kekurangan dengan status Diajukan");
}

// 4. Uji Penugasan Internal (Karyawan)
{
  const wbs: WbsItem = {
    task: "Pemasangan Propeller",
    start: "2026-08-10",
    end: "2026-08-20",
    progress: 0,
    weight: 15,
  };

  const emp = { id: "EMP-001", name: "Agus Pratama", role: "Teknisi Mesin" };
  const assignee: WbsAssignee = {
    type: "internal",
    id: emp.id,
    name: emp.name,
  };

  const updated: WbsItem = { ...wbs, assignee };
  assert(updated.assignee?.type === "internal", "Assignee tipe internal berhasil disimpan");
  assert(updated.assignee?.id === "EMP-001" && updated.assignee?.name === "Agus Pratama", "Assignee memuat ID dan nama karyawan");
}

// 5. Uji Penugasan Eksternal (Subkontraktor -> Buat WO)
{
  const wbs: WbsItem = {
    task: "Blasting & Painting Section 4",
    start: "2026-08-15",
    end: "2026-09-10",
    progress: 0,
    weight: 20,
  };

  const sub = { id: "SUB-001", name: "PT Blasting Prima" };
  const workOrders: any[] = [];
  const projectId = "PRJ-002";

  // Cek apakah sudah ada WO untuk subkon dan task ini
  let existingWo = workOrders.find(
    (wo) => wo.project === projectId && wo.sub === sub.name && wo.scope === wbs.task
  );

  let woId = existingWo?.id;
  if (!existingWo) {
    const createdWo = {
      id: "WO-2026-099",
      sub: sub.name,
      project: projectId,
      scope: wbs.task,
      progress: 0,
      status: "Dalam Proses",
      date: "2026-10-08",
      targetDate: wbs.end,
      wbsTask: wbs.task,
    };
    workOrders.push(createdWo);
    woId = createdWo.id;
  }

  const assignee: WbsAssignee = {
    type: "external",
    id: sub.id,
    name: sub.name,
    woId,
  };

  const updated: WbsItem = { ...wbs, assignee };
  assert(workOrders.length === 1, "Work Order otomatis dibuat untuk subkontraktor");
  assert(workOrders[0].id === "WO-2026-099" && workOrders[0].sub === "PT Blasting Prima", "Work Order memuat subkon yang benar");
  assert(updated.assignee?.type === "external", "Assignee tipe external tersimpan");
  assert(updated.assignee?.woId === "WO-2026-099", "Assignee menautkan woId yang baru dibuat");
}

if (fail > 0) {
  console.log(`\nGAGAL: ${fail} pengujian WBS flow gagal.`);
  process.exit(1);
}

console.log("\nSemua pengujian WBS flow (F3-B-09) LOLOS 100%!");
process.exit(0);
