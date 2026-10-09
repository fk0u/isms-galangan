/* Probe F3-F-04: tanggal booking drydock divalidasi server-side, termasuk update. */
import { buildApp } from "../src/app.js";
import { signToken } from "../src/auth.js";
import { closeDb, q } from "../src/db.js";

interface ProbeRow { id: string; username: string; role: string; token_version: number }
interface CreatedRow { id: string; data?: Record<string, unknown> }

function witaDate(offset: number): string {
  const parts = new Map(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const today = `${parts.get("year")}-${parts.get("month")}-${parts.get("day")}`;
  return new Date(Date.parse(`${today}T00:00:00.000Z`) + offset * 86_400_000).toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  console.log("=== ISMS Drydock Booking Probe (F3-F-04) ===");
  const app = await buildApp();
  let passed = 0;
  let total = 0;
  const createdIds: string[] = [];
  let headers: Record<string, string> = {};
  const assert = (name: string, condition: boolean, detail = ""): void => {
    total += 1;
    if (condition) { passed += 1; console.log(`[PASS] ${name}`); }
    else { console.error(`[FAIL] ${name} ${detail}`); process.exitCode = 1; }
  };
  try {
    const director = (await q<ProbeRow>(
      "SELECT id, username, role, token_version FROM users WHERE role = 'direktur' LIMIT 1",
    ))[0];
    const project = (await q<{ id: string }>("SELECT id FROM projects LIMIT 1"))[0];
    const docks = await q<{ id: string }>("SELECT id FROM drydocks ORDER BY id LIMIT 2");
    if (!director || !project || docks.length === 0) throw new Error("Probe membutuhkan akun direktur, proyek, dan drydock hasil seed");
    headers = {
      authorization: `Bearer ${signToken({ id: director.id, username: director.username, role: director.role, branch: "SEMUA", v: director.token_version ?? 0 })}`,
    };
    const primaryDock = docks[0]!.id;
    const create = async (dockId: string, startDate: string, endDate: string, branch?: string) => {
      const response = await app.inject({
        method: "POST",
        url: "/api/dockSlots",
        headers,
        payload: { ...(branch ? { branch } : {}), data: {
          dockId, project: project.id, vessel: "Probe Kapal Sintetis", from: 0, to: 3,
          startDate, endDate, priority: "Normal", ratePerDay: 0,
        } },
      });
      if (response.statusCode === 201) {
        const row = (response.json() as { data: CreatedRow }).data;
        createdIds.push(row.id);
      }
      return response;
    };

    const first = await create(primaryDock, "2099-11-01", "2099-11-03");
    assert("booking rentang tanggal valid diterima", first.statusCode === 201, first.body);
    const firstData = (first.json() as { data?: CreatedRow }).data?.data;
    assert("from/to diselaraskan server dengan tanggal ISO", Boolean(firstData)
      && Number(firstData?.to) - Number(firstData?.from) === 3 && Number(firstData?.from) !== 0, JSON.stringify(firstData));
    const collision = await create(primaryDock, "2099-11-03", "2099-11-05");
    const collisionBody = collision.json() as { error?: { code?: string } };
    assert("tanggal yang sama di fasilitas yang sama ditolak dengan 409", collision.statusCode === 409 && collisionBody.error?.code === "CONFLICT", collision.body);

    const adjacent = await create(primaryDock, "2099-11-04", "2099-11-05");
    assert("rentang bersebelahan tanpa tanggal yang sama diterima", adjacent.statusCode === 201, adjacent.body);

    if (docks[1]) {
      const otherDock = await create(docks[1].id, "2099-11-01", "2099-11-03");
      assert("rentang sama di fasilitas berbeda diterima", otherDock.statusCode === 201, otherDock.body);
    }

    const malformed = await create(primaryDock, "2099-11-08", "2099-11-07");
    assert("tanggal selesai sebelum mulai ditolak sebagai input tidak valid", malformed.statusCode === 422, malformed.body);

    const adjacentBody = adjacent.json() as { data?: CreatedRow };
    if (adjacentBody.data?.id) {
      const movedIntoConflict = await app.inject({
        method: "PATCH",
        url: `/api/dockSlots/${encodeURIComponent(adjacentBody.data.id)}`,
        headers,
        payload: { data: { startDate: "2099-11-03", endDate: "2099-11-06" } },
      });
      assert("perubahan tanggal slot yang menciptakan bentrok juga ditolak 409", movedIntoConflict.statusCode === 409, movedIntoConflict.body);
    }

    const datePatchBase = await create(primaryDock, "2099-11-20", "2099-11-21");
    const datePatchId = (datePatchBase.json() as { data?: CreatedRow }).data?.id;
    let alignedPatchStatus = 0;
    let alignedPatchData: Record<string, unknown> | undefined;
    if (datePatchId) {
      const alignedPatch = await app.inject({
        method: "PATCH",
        url: `/api/dockSlots/${encodeURIComponent(datePatchId)}`,
        headers,
        payload: { data: { startDate: "2099-11-22", endDate: "2099-11-24", from: 0, to: 1 } },
      });
      alignedPatchStatus = alignedPatch.statusCode;
      alignedPatchData = (alignedPatch.json() as { data?: CreatedRow }).data?.data;
    }
    assert("PATCH menyelaraskan from/to dengan tanggal ISO", alignedPatchStatus === 200
      && Number(alignedPatchData?.to) - Number(alignedPatchData?.from) === 3 && Number(alignedPatchData?.from) !== 0,
      JSON.stringify({ status: alignedPatchStatus, data: alignedPatchData }));

    const legacy = await app.inject({
      method: "POST",
      url: "/api/dockSlots",
      headers,
      payload: { branch: "Probe-Legacy-Branch", data: {
        dockId: primaryDock, project: project.id, vessel: "Probe Kapal Lama", from: 10, to: 13,
        priority: "Normal", ratePerDay: 0,
      } },
    });
    if (legacy.statusCode === 201) createdIds.push((legacy.json() as { data: CreatedRow }).data.id);
    const legacyCollision = await create(primaryDock, witaDate(12), witaDate(14), "Probe-Legacy-Branch");
    assert("booking tanggal tetap memeriksa slot lama berbasis indeks hari", legacy.statusCode === 201
      && legacyCollision.statusCode === 409, legacyCollision.body);

    const branchTarget = await create(primaryDock, "2099-12-01", "2099-12-03", "Probe-Target-Branch");
    const branchSource = await create(primaryDock, "2099-12-01", "2099-12-03", "Probe-Source-Branch");
    const branchSourceId = (branchSource.json() as { data?: CreatedRow }).data?.id;
    let movedIntoBranchStatus = 0;
    if (branchSourceId) {
      const movedIntoBranchConflict = await app.inject({
        method: "PATCH",
        url: `/api/dockSlots/${encodeURIComponent(branchSourceId)}`,
        headers,
        payload: { branch: "Probe-Target-Branch" },
      });
      movedIntoBranchStatus = movedIntoBranchConflict.statusCode;
    }
    assert("perubahan branch saja yang menciptakan bentrok ditolak 409", branchTarget.statusCode === 201
      && branchSource.statusCode === 201 && movedIntoBranchStatus === 409,
      JSON.stringify({ target: branchTarget.statusCode, source: branchSource.statusCode, patch: movedIntoBranchStatus }));

    const simultaneous = await Promise.all([
      create(primaryDock, "2099-12-10", "2099-12-12"),
      create(primaryDock, "2099-12-10", "2099-12-12"),
    ]);
    assert("dua create serentak hanya mengizinkan satu rentang pada dock yang sama",
      simultaneous.filter((response) => response.statusCode === 201).length === 1
        && simultaneous.filter((response) => response.statusCode === 409).length === 1,
      simultaneous.map((response) => response.statusCode).join(","));
    console.log(`\n${passed}/${total} pemeriksaan drydock booking lolos.`);
  } finally {
    for (const id of createdIds) {
      await app.inject({ method: "DELETE", url: `/api/dockSlots/${encodeURIComponent(id)}`, headers }).catch(() => undefined);
    }
    await app.close();
    await closeDb();
  }
}

main().catch(async (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
  await closeDb();
});
