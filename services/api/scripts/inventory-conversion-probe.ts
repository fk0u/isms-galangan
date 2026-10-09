import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildApp } from "../src/app.js";
import { SEED_ACCOUNTS, signToken } from "../src/auth.js";
import { closeDb, exec, q } from "../src/db.js";
import { inventoryConversionError } from "../src/inventoryConversion.js";
import { migrate } from "../src/migrate.js";
import { runSeed } from "../src/seed.js";

let failures = 0;
let total = 0;
function assert(name: string, condition: boolean, detail = ""): void {
  total += 1;
  if (condition) console.log(`[PASS] ${name}`);
  else {
    failures += 1;
    console.error(`[FAIL] ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

function objectOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function bodyOf(response: { body: string }): Record<string, unknown> {
  try {
    return objectOf(JSON.parse(response.body) as unknown) ?? {};
  } catch {
    return {};
  }
}

async function runHelperChecks(): Promise<void> {
  const validCat = {
    category: "Cat",
    unit: "drum",
    eceran: false,
    conversion: { baseUnit: "liter", perUnit: 200 },
    uom2: "liter",
    konversi: 200,
  };
  assert("Cat menolak satuan pembelian kg", inventoryConversionError({ ...validCat, unit: "kg" }) !== null);
  assert("Cat mewajibkan nilai konversi", inventoryConversionError({ ...validCat, conversion: null, uom2: "", konversi: 0 }) !== null);
  assert("1 drum Cat = 200 liter diterima", inventoryConversionError(validCat) === null);
  assert("Cairan menerima satuan liter dan konversi positif", inventoryConversionError({
    category: "Cairan", unit: "liter", conversion: { baseUnit: "liter", perUnit: 18 },
  }) === null);

  assert("Plat menerima konversi kg dengan dimensi lengkap", inventoryConversionError({
    category: "Plat", unit: "lembar", conversion: {
      baseUnit: "kg", perUnit: 706.5, dims: { lengthMm: 6000, widthMm: 1500, thicknessMm: 10 },
    },
  }) === null);
  assert("Plat menolak konversi tanpa dimensi wajib", inventoryConversionError({
    category: "Plat", unit: "lembar", conversion: { baseUnit: "kg", perUnit: 706.5 },
  }) !== null);
  assert("Pipa menerima 6000 mm sebagai 6 meter dan berat batang", inventoryConversionError({
    category: "Pipa", unit: "batang", conversion: {
      baseUnit: "meter", perUnit: 6, dims: { lengthMm: 6000, weightKg: 24 },
    },
  }) === null);
  assert("Pipa menolak basis kg", inventoryConversionError({
    category: "Pipa", unit: "batang", conversion: {
      baseUnit: "kg", perUnit: 6, dims: { lengthMm: 6000, weightKg: 24 },
    },
  }) !== null);
  assert("Tonase menerima kg per ton", inventoryConversionError({
    category: "Tonase", unit: "ton", conversion: { baseUnit: "kg", perUnit: 1000 },
  }) === null);

  assert("Kategori umum tanpa konversi tetap dapat disimpan", inventoryConversionError({
    category: "Listrik", unit: "roll", eceran: false,
  }) === null);
  assert("Kategori umum eceran mewajibkan konversi", inventoryConversionError({
    category: "Listrik", unit: "roll", eceran: true,
  }) !== null);
  assert("Konversi kategori umum diterima", inventoryConversionError({
    category: "Listrik", unit: "roll", conversion: { baseUnit: "meter", perUnit: 100 },
  }) === null);

  const legacyWithoutConversion = { category: "Cat", unit: "drum", name: "Cat lama" };
  assert("PATCH field non-konversi tidak mengunci baris historis", inventoryConversionError({
    ...legacyWithoutConversion, name: "Nama baru",
  }, legacyWithoutConversion) === null);
  const legacyBar = { category: "Pipa", unit: "batang", uom2: "meter", konversi: 6 };
  assert("PATCH serialisasi ulang konversi UOM2 legacy tanpa dimensi tidak mengunci edit", inventoryConversionError({
    ...legacyBar, conversion: { baseUnit: "meter", perUnit: 6 },
  }, legacyBar) === null);
  assert("PATCH perubahan kategori/satuan tidak dapat membuat Cat → kg", inventoryConversionError({
    category: "Cat", unit: "kg", name: "Item lama",
  }, { category: "Listrik", unit: "roll", name: "Item lama" }) !== null);
  assert("PATCH perubahan kategori menjadi Cat tanpa konversi ditolak", inventoryConversionError({
    category: "Cat", unit: "drum", name: "Item lama",
  }, { category: "Listrik", unit: "drum", name: "Item lama" }) !== null);
}

async function runRouteChecks(): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "isms-inventory-conversion-probe-"));
  const envKeys = new Set([
    "DB_DIALECT", "SQLITE_PATH", "MYSQL_URL", "UPLOADS_DIR", "NODE_ENV",
    "JWT_SECRET", "WEB_ORIGINS", "HOST", "PORT", "ALLOW_SEED_LOGIN",
    "SETUP_TOKEN", "TRUST_PROXY",
  ]);
  for (const account of SEED_ACCOUNTS) envKeys.add(`SEED_PASSWORD_${account.role.toUpperCase()}`);
  const originalEnv = new Map<string, string | undefined>();
  for (const key of envKeys) originalEnv.set(key, process.env[key]);
  let app: ReturnType<typeof buildApp> | undefined;

  try {
    process.env.DB_DIALECT = "sqlite";
    process.env.SQLITE_PATH = path.join(tempDir, "probe.sqlite");
    process.env.UPLOADS_DIR = path.join(tempDir, "uploads");
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
    process.env.SETUP_TOKEN = crypto.randomBytes(32).toString("hex");
    process.env.WEB_ORIGINS = "http://localhost:5173";
    process.env.HOST = "localhost";
    process.env.PORT = "3000";
    process.env.ALLOW_SEED_LOGIN = "false";
    delete process.env.MYSQL_URL;
    for (const account of SEED_ACCOUNTS) {
      process.env[`SEED_PASSWORD_${account.role.toUpperCase()}`] = `inventory-probe-${crypto.randomUUID()}`;
    }

    await migrate();
    await runSeed();
    app = buildApp();
    await app.ready();

    const director = (await q<{ id: string; username: string; role: string; token_version: number }>(
      "SELECT id, username, role, token_version FROM users WHERE username = 'direktur@galangan.com' LIMIT 1",
    ))[0];
    if (!director) throw new Error("Akun direktur sementara tidak ditemukan");
    const token = signToken({
      id: director.id,
      username: director.username,
      role: director.role,
      branch: "SEMUA",
      v: director.token_version ?? 0,
    });
    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

    const invalidCreate = await app.inject({
      method: "POST",
      url: "/api/inventory",
      headers,
      payload: { data: { name: "Cat unit invalid", category: "Cat", unit: "kg" } },
    });
    assert("POST /api/inventory menolak pasangan Cat → kg dengan 422", invalidCreate.statusCode === 422, invalidCreate.body);

    const missingConversion = await app.inject({
      method: "POST",
      url: "/api/inventory",
      headers,
      payload: { data: { name: "Cat tanpa konversi", category: "Cat", unit: "drum" } },
    });
    assert("POST /api/inventory menolak kategori khusus tanpa konversi", missingConversion.statusCode === 422, missingConversion.body);

    const validCreate = await app.inject({
      method: "POST",
      url: "/api/inventory",
      headers,
      payload: {
        data: {
          name: "Cat probe valid",
          category: "Cat",
          unit: "drum",
          conversion: { baseUnit: "liter", perUnit: 200 },
          uom2: "liter",
          konversi: 200,
        },
      },
    });
    const validCreated = objectOf(bodyOf(validCreate).data);
    const validId = typeof validCreated?.id === "string" ? validCreated.id : null;
    assert("POST /api/inventory menerima konversi Cat yang valid", validCreate.statusCode === 201 && validId !== null, validCreate.body);

    if (validId) {
      const invalidPatch = await app.inject({
        method: "PATCH",
        url: `/api/inventory/${validId}`,
        headers,
        payload: { data: { unit: "kg" } },
      });
      assert("PATCH /api/inventory menolak perubahan satuan Cat ke kg", invalidPatch.statusCode === 422, invalidPatch.body);
      const unchanged = await app.inject({ method: "GET", url: `/api/inventory/${validId}`, headers });
      const unchangedRow = objectOf(objectOf(bodyOf(unchanged).data)?.data);
      assert("PATCH invalid tidak mengubah data yang tersimpan", unchangedRow?.unit === "drum");
    }

    const generalCreate = await app.inject({
      method: "POST",
      url: "/api/inventory",
      headers,
      payload: { data: { name: "Material umum probe", category: "Listrik", unit: "drum", eceran: false } },
    });
    const generalCreated = objectOf(bodyOf(generalCreate).data);
    const generalId = typeof generalCreated?.id === "string" ? generalCreated.id : null;
    assert("POST material umum tanpa konversi diterima sebagai basis uji PATCH", generalCreate.statusCode === 201 && generalId !== null, generalCreate.body);
    if (generalId) {
      const categoryPatch = await app.inject({
        method: "PATCH",
        url: `/api/inventory/${generalId}`,
        headers,
        payload: { data: { category: "Cat" } },
      });
      assert("PATCH perubahan kategori ke Cat tanpa conversion ditolak dengan 422", categoryPatch.statusCode === 422, categoryPatch.body);
    }

    const legacyId = `STK-PROBE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await exec("INSERT INTO inventory (id, branch, data, updated_at) VALUES (?, ?, ?, ?)", [
      legacyId,
      "Samarinda",
      JSON.stringify({ name: "Material historis", category: "Cat", unit: "drum" }),
      new Date().toISOString(),
    ]);
    const legacyPatch = await app.inject({
      method: "PATCH",
      url: `/api/inventory/${legacyId}`,
      headers,
      payload: { data: { name: "Material historis diperbarui" } },
    });
    assert("PATCH field biasa tetap dapat memperbarui baris historis", legacyPatch.statusCode === 200, legacyPatch.body);
  } finally {
    try { await app?.close(); } catch { /* tutup DB tetap wajib */ }
    await closeDb();
    for (const [key, value] of originalEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  console.log("=== ISMS Inventory Conversion Probe (F3-G-02) ===");
  await runHelperChecks();
  await runRouteChecks();
  console.log(`\nHasil: ${total - failures}/${total} pemeriksaan lolos.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error("Probe inventory-conversion gagal:", error);
  await closeDb();
  process.exitCode = 1;
});
