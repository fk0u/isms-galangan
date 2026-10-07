import path from "node:path";

export interface Env {
  port: number;
  dialect: "sqlite" | "mysql";
  sqlitePath: string;
  mysqlUrl: string | undefined;
  jwtSecret: string;
  webOrigins: string[];
  setupToken: string | undefined;
  allowSeedLogin: boolean;
  trustProxy: boolean;
  uploadsDir: string;
  /** Folder TTF untuk embedding PDF. Kosong berarti tidak ada font lokal. */
  fontsDir: string;
  nodeEnv: string;
}

function parseOrigins(): string[] {
  const rawList = process.env.WEB_ORIGINS;
  if (rawList !== undefined && rawList.trim() !== "") {
    return rawList.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  }
  const single = process.env.WEB_ORIGIN;
  if (single !== undefined && single.trim() !== "") return [single.trim()];
  return [];
}

export function loadEnv(): Env {
  const rawDialect = (process.env.DB_DIALECT ?? "sqlite").trim().toLowerCase();
  if (rawDialect !== "sqlite" && rawDialect !== "mysql") {
    throw new Error(`DB_DIALECT must be "sqlite" or "mysql" (got "${process.env.DB_DIALECT}").`);
  }
  const dialect: "sqlite" | "mysql" = rawDialect === "mysql" ? "mysql" : "sqlite";

  const sqlitePath = process.env.SQLITE_PATH ?? "./data/isms.db";
  if (dialect === "sqlite" && sqlitePath.trim() === "") {
    throw new Error('SQLITE_PATH must not be empty when DB_DIALECT=sqlite (e.g. "./data/isms.db").');
  }
  const mysqlUrl = process.env.MYSQL_URL;
  if (dialect === "mysql" && !mysqlUrl) {
    throw new Error("MYSQL_URL is required when DB_DIALECT=mysql (e.g. mysql://user:pass@localhost:3306/isms).");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim() === "") {
    throw new Error("JWT_SECRET is required (set it in the environment, no dev fallback).");
  }
  if (jwtSecret.length < 32) {
    throw new Error(`JWT_SECRET must be at least 32 characters long (got ${jwtSecret.length}).`);
  }
  const FORBIDDEN_JWT_SECRETS = new Set([
    "change-me-to-a-long-random-string",
    "change-me-to-a-long-random-string-here",
    "your-secret-here",
    "your-jwt-secret-here",
    "12345678901234567890123456789012",
    "abcdefghijklmnopqrstuvwxyz123456",
  ]);
  if (FORBIDDEN_JWT_SECRETS.has(jwtSecret.toLowerCase().trim())) {
    throw new Error('JWT_SECRET cannot use default example value from .env.example ("change-me-to-a-long-random-string").');
  }

  const portRaw = process.env.PORT ?? "3000";
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535 (got "${portRaw}").`);
  }

  // SETUP_TOKEN guards POST /api/admin/seed (fail-closed when missing).
  // When specified, it must be at least 32 characters long.
  const setupToken = process.env.SETUP_TOKEN?.trim();
  if (setupToken && setupToken.length < 32) {
    throw new Error(`SETUP_TOKEN must be at least 32 characters long when specified (got ${setupToken.length}).`);
  }
  if (!setupToken) {
    console.warn("[env] SETUP_TOKEN is missing — /api/admin/seed stays fail-closed (403).");
  }

  const trustRaw = (process.env.TRUST_PROXY ?? "").toLowerCase().trim();
  if (trustRaw !== "" && !["true", "1", "false", "0"].includes(trustRaw)) {
    throw new Error(`TRUST_PROXY must be "true" or "false" (got "${process.env.TRUST_PROXY}").`);
  }
  const trustProxy = trustRaw === "true" || trustRaw === "1";

  // Demo seed accounts can only log in when explicitly allowed.
  const allowRaw = (process.env.ALLOW_SEED_LOGIN ?? "").toLowerCase().trim();
  if (allowRaw !== "" && !["true", "1", "false", "0"].includes(allowRaw)) {
    throw new Error(`ALLOW_SEED_LOGIN must be "true" or "false" (got "${process.env.ALLOW_SEED_LOGIN}").`);
  }
  const allowSeedLogin = allowRaw === "true" || allowRaw === "1";

  const uploadsDir = process.env.UPLOADS_DIR ?? "./data/uploads";
  if (uploadsDir.trim() === "") {
    throw new Error('UPLOADS_DIR must not be empty (e.g. "./data/uploads").');
  }

  /* Folder font PDF. Default `assets/fonts` relatif repo root, yaitu tempat
     README font.ts menjelaskan letakkan regular/bold/italic.ttf. Env ini
     ada supaya deployment tidak perlu menyalin font berlisensi ke dalam
     repo - arahkan ke system font server (mis. /usr/share/fonts/galangan). */
  const fontsDir = path.resolve(
    process.cwd(),
    process.env.PDF_FONTS_DIR ?? path.join("assets", "fonts"),
  );

  const nodeEnvRaw = (process.env.NODE_ENV ?? "development").trim().toLowerCase();
  if (!["development", "test", "production"].includes(nodeEnvRaw)) {
    throw new Error(`NODE_ENV must be "development", "test", or "production" (got "${process.env.NODE_ENV}").`);
  }
  const nodeEnv = nodeEnvRaw;

  let origins = parseOrigins();
  const hostRaw = (process.env.HOST ?? "localhost").trim().toLowerCase();
  const isLocalhostHost = hostRaw === "localhost" || hostRaw === "127.0.0.1" || hostRaw === "::1";

  if (origins.length === 0) {
    if ((nodeEnv === "development" || nodeEnv === "test") && isLocalhostHost) {
      origins = ["http://localhost:5173", "http://127.0.0.1:5173"];
    } else {
      throw new Error('WEB_ORIGINS is required (e.g. "https://app.galangan.com" or "http://localhost:5173"). Wildcard "*" is forbidden.');
    }
  }

  for (const o of origins) {
    if (o === "*") {
      throw new Error('WEB_ORIGINS must not contain wildcard "*": specify explicit origin URLs.');
    }
    try {
      const u = new URL(o);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        throw new Error(`WEB_ORIGINS entries must be valid http(s) URLs: invalid "${o}".`);
      }
    } catch {
      throw new Error(`WEB_ORIGINS entries must be valid http(s) URLs: invalid "${o}".`);
    }
  }

  return {
    port,
    dialect,
    sqlitePath,
    mysqlUrl,
    jwtSecret,
    webOrigins: origins,
    setupToken,
    allowSeedLogin,
    trustProxy,
    uploadsDir,
    fontsDir,
    nodeEnv,
  };
}
