type ConversionKind = "volume" | "plate" | "bar" | "tonnage";

interface ConversionRule {
  kind: ConversionKind;
  baseUnit: string;
  purchaseUnits: readonly string[];
}

const CATEGORY_RULES: Readonly<Record<string, ConversionRule>> = {
  cat: { kind: "volume", baseUnit: "liter", purchaseUnits: ["drum", "galon", "kaleng", "liter"] },
  "cat/cairan": { kind: "volume", baseUnit: "liter", purchaseUnits: ["drum", "galon", "kaleng", "liter"] },
  "cat & coating": { kind: "volume", baseUnit: "liter", purchaseUnits: ["drum", "galon", "kaleng", "liter"] },
  cairan: { kind: "volume", baseUnit: "liter", purchaseUnits: ["drum", "galon", "kaleng", "liter"] },
  plat: { kind: "plate", baseUnit: "kg", purchaseUnits: ["lembar"] },
  pelat: { kind: "plate", baseUnit: "kg", purchaseUnits: ["lembar"] },
  pipa: { kind: "bar", baseUnit: "meter", purchaseUnits: ["batang"] },
  "pipa/besi": { kind: "bar", baseUnit: "meter", purchaseUnits: ["batang"] },
  besi: { kind: "bar", baseUnit: "meter", purchaseUnits: ["batang"] },
  tonase: { kind: "tonnage", baseUnit: "kg", purchaseUnits: ["ton", "kg", "unit"] },
};

function normalized(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("id-ID").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function positiveNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(number) && number > 0 ? number : null;
}

function isEceran(value: unknown): boolean {
  return value === true || String(value ?? "").trim().toLowerCase() === "true";
}

function isSuppliedAmount(value: unknown): boolean {
  if (value === undefined || value === null || String(value).trim() === "") return false;
  const number = Number(String(value).trim());
  return !Number.isFinite(number) || number !== 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = asRecord(value);
  if (record) {
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function effectiveConversionFingerprint(data: Record<string, unknown>): string {
  const raw = asRecord(data.conversion);
  const rawBaseUnit = String(raw?.baseUnit ?? "").trim();
  const rawPerUnit = positiveNumber(raw?.perUnit);
  if (raw && rawBaseUnit !== "" && rawPerUnit !== null) {
    return stableJson({
      baseUnit: normalized(rawBaseUnit),
      perUnit: rawPerUnit,
      dims: raw.dims ?? null,
    });
  }
  const legacyBaseUnit = String(data.uom2 ?? "").trim();
  const legacyPerUnit = positiveNumber(data.konversi);
  if (legacyBaseUnit !== "" && legacyPerUnit !== null) {
    return stableJson({ baseUnit: normalized(legacyBaseUnit), perUnit: legacyPerUnit, dims: null });
  }
  return raw ? stableJson(raw) : "null";
}

function conversionStateChanged(previous: Record<string, unknown>, next: Record<string, unknown>): boolean {
  return normalized(previous.category) !== normalized(next.category)
    || normalized(previous.unit) !== normalized(next.unit)
    || isEceran(previous.eceran) !== isEceran(next.eceran)
    || effectiveConversionFingerprint(previous) !== effectiveConversionFingerprint(next);
}

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= Math.max(1, Math.abs(left), Math.abs(right)) * 1e-9;
}

/**
 * Validate only material conversion writes. Passing `previous` lets PATCH leave
 * untouched legacy rows alone while requiring valid data for every new change.
 */
export function inventoryConversionError(
  data: Record<string, unknown>,
  previous?: Record<string, unknown>,
): string | null {
  if (previous && !conversionStateChanged(previous, data)) return null;

  const category = String(data.category ?? "").trim();
  const rule = CATEGORY_RULES[normalized(category)];
  const purchaseUnit = String(data.unit ?? "").trim();
  if (rule && !rule.purchaseUnits.some((unit) => normalized(unit) === normalized(purchaseUnit))) {
    return `Satuan pembelian "${purchaseUnit || "(kosong)"}" tidak valid untuk kategori "${category}".`;
  }

  const rawConversion = asRecord(data.conversion);
  const legacyBaseUnit = String(data.uom2 ?? "").trim();
  const legacyAmountSupplied = isSuppliedAmount(data.konversi);
  const conversionSupplied = data.conversion !== undefined && data.conversion !== null
    || legacyBaseUnit !== ""
    || legacyAmountSupplied;
  const requiresConversion = rule !== undefined || isEceran(data.eceran) || conversionSupplied;

  let conversion = rawConversion;
  let baseUnit = String(conversion?.baseUnit ?? "").trim();
  let perUnit = positiveNumber(conversion?.perUnit);
  if (baseUnit === "" || perUnit === null) {
    conversion = legacyBaseUnit !== "" && positiveNumber(data.konversi) !== null
      ? { baseUnit: legacyBaseUnit, perUnit: positiveNumber(data.konversi) as number }
      : null;
    baseUnit = String(conversion?.baseUnit ?? "").trim();
    perUnit = positiveNumber(conversion?.perUnit);
  }

  if (!conversion) {
    return requiresConversion ? "Konversi material wajib diisi dengan nilai positif." : null;
  }
  if (baseUnit === "" || perUnit === null) return "Konversi material harus memiliki satuan dasar dan nilai positif.";

  if (rule && normalized(baseUnit) !== normalized(rule.baseUnit)) {
    return `Satuan dasar konversi kategori "${category}" harus ${rule.baseUnit}.`;
  }

  if (legacyBaseUnit !== "" || legacyAmountSupplied) {
    const legacyPerUnit = positiveNumber(data.konversi);
    if (legacyBaseUnit === "" || legacyPerUnit === null
      || normalized(legacyBaseUnit) !== normalized(baseUnit)
      || !closeEnough(legacyPerUnit, perUnit)) {
      return "Field konversi lama uom2/konversi harus konsisten dengan conversion.";
    }
  }

  if (!rule) return null;
  const dims = asRecord(conversion.dims);
  if (rule.kind === "plate") {
    const lengthMm = positiveNumber(dims?.lengthMm);
    const widthMm = positiveNumber(dims?.widthMm);
    const thicknessMm = positiveNumber(dims?.thicknessMm);
    if (lengthMm === null || widthMm === null || thicknessMm === null) {
      return "Konversi kategori Plat/Pelat memerlukan panjang, lebar, dan tebal positif.";
    }
  } else if (rule.kind === "bar") {
    const lengthMm = positiveNumber(dims?.lengthMm);
    const weightKg = positiveNumber(dims?.weightKg);
    if (lengthMm === null || weightKg === null) {
      return "Konversi kategori Pipa/Besi memerlukan panjang dan berat positif.";
    }
    if (!closeEnough(perUnit, lengthMm / 1000)) {
      return "Nilai konversi Pipa/Besi harus sama dengan panjang batang dalam meter.";
    }
  }

  return null;
}
