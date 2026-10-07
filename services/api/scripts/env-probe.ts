import { loadEnv } from "../src/env.js";

// Simpan process.env asli
const originalEnv = { ...process.env };

function runWithEnv(envOverrides: Record<string, string | undefined>, fn: () => void) {
  process.env = { ...originalEnv, ...envOverrides };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) {
      delete process.env[k];
    }
  }
  try {
    fn();
  } finally {
    process.env = { ...originalEnv };
  }
}

let passed = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}:`, (err as Error).message);
    process.exitCode = 1;
  }
}

console.log("=== ISMS API Environment Validation Probe ===");

const VALID_SECRET = "valid-random-secret-key-that-is-at-least-32-chars-long";

test("boot gagal bila JWT_SECRET kosong", () => {
  runWithEnv({ JWT_SECRET: "" }, () => {
    let threw = false;
    try {
      loadEnv();
    } catch (e) {
      threw = (e as Error).message.includes("JWT_SECRET is required");
    }
    if (!threw) throw new Error("Expected throw with missing JWT_SECRET");
  });
});

test("boot gagal bila JWT_SECRET < 32 karakter", () => {
  runWithEnv({ JWT_SECRET: "short-secret" }, () => {
    let threw = false;
    try {
      loadEnv();
    } catch (e) {
      threw = (e as Error).message.includes("must be at least 32 characters long");
    }
    if (!threw) throw new Error("Expected throw for short JWT_SECRET");
  });
});

test("boot gagal bila JWT_SECRET memakai nilai default contoh", () => {
  runWithEnv({ JWT_SECRET: "change-me-to-a-long-random-string" }, () => {
    let threw = false;
    try {
      loadEnv();
    } catch (e) {
      threw = (e as Error).message.includes("cannot use default example value");
    }
    if (!threw) throw new Error("Expected throw for example JWT_SECRET");
  });
});

test("boot gagal bila SETUP_TOKEN diisi tapi < 32 karakter", () => {
  runWithEnv({ JWT_SECRET: VALID_SECRET, SETUP_TOKEN: "short-setup-token" }, () => {
    let threw = false;
    try {
      loadEnv();
    } catch (e) {
      threw = (e as Error).message.includes("SETUP_TOKEN must be at least 32 characters long");
    }
    if (!threw) throw new Error("Expected throw for short SETUP_TOKEN");
  });
});

test("boot gagal bila WEB_ORIGINS memuat wildcard *", () => {
  runWithEnv({ JWT_SECRET: VALID_SECRET, WEB_ORIGINS: "http://localhost:5173,*" }, () => {
    let threw = false;
    try {
      loadEnv();
    } catch (e) {
      threw = (e as Error).message.includes('must not contain wildcard "*"');
    }
    if (!threw) throw new Error("Expected throw for wildcard WEB_ORIGINS");
  });
});

test("boot gagal di production bila WEB_ORIGINS kosong", () => {
  runWithEnv({ JWT_SECRET: VALID_SECRET, NODE_ENV: "production", WEB_ORIGINS: "", WEB_ORIGIN: "" }, () => {
    let threw = false;
    try {
      loadEnv();
    } catch (e) {
      threw = (e as Error).message.includes("WEB_ORIGINS is required");
    }
    if (!threw) throw new Error("Expected throw for missing WEB_ORIGINS in production");
  });
});

test("boot sukses bila konfigurasi valid", () => {
  runWithEnv({
    JWT_SECRET: VALID_SECRET,
    SETUP_TOKEN: "valid-setup-token-longer-than-32-characters-here",
    WEB_ORIGINS: "http://localhost:5173",
  }, () => {
    const env = loadEnv();
    if (env.jwtSecret !== VALID_SECRET) throw new Error("Unexpected jwtSecret");
    if (env.setupToken !== "valid-setup-token-longer-than-32-characters-here") throw new Error("Unexpected setupToken");
  });
});

console.log(`\nResult: ${passed}/${total} checks passed.\n`);
