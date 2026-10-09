import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function snapshotDirectory(root: string): string[] {
  const snapshot: string[] = [];
  const visit = (directory: string, relativeDirectory = ""): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = path.join(relativeDirectory, entry.name);
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        snapshot.push(`directory:${relativePath}`);
        visit(absolutePath, relativePath);
      } else if (entry.isFile()) {
        snapshot.push(`file:${relativePath}:${sha256(fs.readFileSync(absolutePath))}`);
      } else {
        snapshot.push(`other:${relativePath}`);
      }
    }
  };
  visit(root);
  return snapshot;
}

function probeTempArtifacts(root: string): string[] {
  return fs.readdirSync(root).filter((entry) => entry.startsWith("isms-security-probe-"));
}

function stripAnsi(output: string): string {
  return output.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

function runProbe(args: string[], callerDb: string, callerUploads: string, tempRoot: string): ReturnType<typeof spawnSync> {
  const childEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME ?? os.homedir(),
    USERPROFILE: process.env.USERPROFILE,
    TMPDIR: tempRoot,
    DB_DIALECT: "sqlite",
    SQLITE_PATH: callerDb,
    UPLOADS_DIR: callerUploads,
    NODE_ENV: "test",
    JWT_SECRET: randomBytes(32).toString("hex"),
    WEB_ORIGINS: "http://localhost:5173",
    HOST: "localhost",
    PORT: "3000",
    ALLOW_SEED_LOGIN: "false",
  };
  return spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "probe:security", "--", ...args],
    { cwd: process.cwd(), env: childEnv, encoding: "utf8", timeout: 120_000, maxBuffer: 2 * 1024 * 1024 },
  );
}

function main(): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "isms-security-isolation-check-"));
  const callerDb = path.join(root, "caller.db");
  const callerUploads = path.join(root, "caller-uploads");
  const successTempRoot = path.join(root, "probe-temp-success");
  const failureTempRoot = path.join(root, "probe-temp-failure");
  const missingSourceDb = path.join(root, "missing-source.db");
  const missingSourceTempRoot = path.join(root, "probe-temp-missing-source");
  fs.mkdirSync(callerUploads);
  fs.mkdirSync(successTempRoot);
  fs.mkdirSync(failureTempRoot);
  fs.mkdirSync(missingSourceTempRoot);

  try {
    const sentinelDb = new Database(callerDb);
    try {
      sentinelDb.exec("CREATE TABLE probe_guard (id TEXT PRIMARY KEY, value TEXT NOT NULL)");
      sentinelDb.prepare("INSERT INTO probe_guard (id, value) VALUES (?, ?)").run("keep", "unchanged");
    } finally {
      sentinelDb.close();
    }
    fs.writeFileSync(path.join(callerUploads, "sentinel.txt"), "must remain unchanged\n");

    const callerDbBefore = sha256(fs.readFileSync(callerDb));
    const callerUploadsBefore = snapshotDirectory(callerUploads);
    const success = runProbe(["--report"], callerDb, callerUploads, successTempRoot);
    if (success.error) throw new Error(`Security probe success-path subprocess failed to start: ${success.error.message}`);
    assert.equal(success.status, 0, `Security probe success path exited ${success.status}:\n${success.stderr}`);
    assert.equal(sha256(fs.readFileSync(callerDb)), callerDbBefore, "caller DB bytes changed on the success path");
    assert.deepEqual(snapshotDirectory(callerUploads), callerUploadsBefore, "caller uploads changed on the success path");
    assert.deepEqual(probeTempArtifacts(successTempRoot), [], "success path left a temporary DB or uploads directory behind");

    const failure = runProbe(["--test-fail-after-setup"], callerDb, callerUploads, failureTempRoot);
    if (failure.error) throw new Error(`Security probe failure-path subprocess failed to start: ${failure.error.message}`);
    assert.equal(failure.status, 1, `Intentional failure path should exit 1, got ${failure.status}`);
    assert.match(failure.stderr, /intentional security-probe cleanup verification failure/);
    assert.equal(sha256(fs.readFileSync(callerDb)), callerDbBefore, "caller DB bytes changed on the failure path");
    assert.deepEqual(snapshotDirectory(callerUploads), callerUploadsBefore, "caller uploads changed on the failure path");
    assert.deepEqual(probeTempArtifacts(failureTempRoot), [], "failure path left a temporary DB or uploads directory behind");

    const missingSource = runProbe([], missingSourceDb, callerUploads, missingSourceTempRoot);
    if (missingSource.error) throw new Error(`Missing-source subprocess failed to start: ${missingSource.error.message}`);
    const missingSourceOutput = stripAnsi(`${missingSource.stdout}\n${missingSource.stderr}`);
    assert.equal(missingSource.status, 1, `Missing-source gate must fail closed, got ${missingSource.status}:\n${missingSourceOutput}`);
    assert.match(missingSourceOutput, /TOTAL \d+ SKENARIO \| VULN: \d+ \| K\/T VULN: [1-9]\d*/);
    for (const id of ["T02", "T03", "T04", "T05"]) {
      const row = missingSourceOutput.split(/\r?\n/).find((line) => line.includes(`][K] ${id}`));
      assert.ok(row, `${id} must be reported with severity K when source DB is missing`);
      assert.doesNotMatch(row, /\[N\/A\s*\]/, `${id} must not be marked N/A without verified source data`);
      assert.match(row, new RegExp(`\\]\\[K\\]\\s+${id}\\b`));
    }
    assert.equal(fs.existsSync(missingSourceDb), false, "probe created the absent caller DB path");
    assert.equal(sha256(fs.readFileSync(callerDb)), callerDbBefore, "unrelated sentinel DB changed on the missing-source path");
    assert.deepEqual(snapshotDirectory(callerUploads), callerUploadsBefore, "caller uploads changed on the missing-source path");
    assert.deepEqual(probeTempArtifacts(missingSourceTempRoot), [], "missing-source path left a temporary DB or uploads directory behind");

    console.log("[probe:security-isolation] PASS — caller DB/uploads unchanged; temp files removed on success and exception; missing-source T02–T05 stay K and the gate fails closed.");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error("[probe:security-isolation] FAIL", error);
  process.exitCode = 1;
}
