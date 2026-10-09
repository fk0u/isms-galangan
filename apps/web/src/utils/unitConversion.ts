export type ConversionKind = "volume" | "plate" | "bar" | "tonnage";

export interface UnitConversionDimensions {
  lengthMm?: number;
  widthMm?: number;
  thicknessMm?: number;
  weightKg?: number;
}

/** Konversi selalu berarti jumlah unit dasar untuk satu unit pembelian. */
export interface UnitConversion {
  baseUnit: string;
  perUnit: number;
  dims?: UnitConversionDimensions;
}

export interface UnitConversionDraft {
  conversionAmount?: string;
  conversionBaseUnit?: string;
  conversionLengthMm?: string;
  conversionWidthMm?: string;
  conversionThicknessMm?: string;
  conversionWeightKg?: string;
}

export interface UnitConversionRule {
  kind: ConversionKind;
  baseUnit: string;
}

const CATEGORY_RULES: Readonly<Record<string, UnitConversionRule>> = {
  cat: { kind: "volume", baseUnit: "liter" },
  "cat/cairan": { kind: "volume", baseUnit: "liter" },
  "cat & coating": { kind: "volume", baseUnit: "liter" },
  cairan: { kind: "volume", baseUnit: "liter" },
  plat: { kind: "plate", baseUnit: "kg" },
  pelat: { kind: "plate", baseUnit: "kg" },
  pipa: { kind: "bar", baseUnit: "meter" },
  "pipa/besi": { kind: "bar", baseUnit: "meter" },
  besi: { kind: "bar", baseUnit: "meter" },
  tonase: { kind: "tonnage", baseUnit: "kg" },
};
const UNITS_BY_KIND: Readonly<Record<ConversionKind, readonly string[]>> = {
  volume: ["drum", "galon", "kaleng", "liter"],
  plate: ["lembar"],
  bar: ["batang"],
  tonnage: ["ton", "kg", "unit"],
};

function normalizedCategory(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("id-ID").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function positiveNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function optionalPositiveNumber(value: unknown): number | undefined {
  const parsed = positiveNumber(value);
  return parsed === null ? undefined : parsed;
}

export function conversionRuleForCategory(category: unknown): UnitConversionRule | null {
  return CATEGORY_RULES[normalizedCategory(category)] ?? null;
}

export function purchaseUnitsForCategory(category: unknown, currentUnit = ""): string[] {
  const rule = conversionRuleForCategory(category);
  const units = rule
    ? [...UNITS_BY_KIND[rule.kind]]
    : ["pcs", "drum", "galon", "kaleng", "lembar", "batang", "kg", "ton", "liter", "meter", "unit", "roll"];
  const current = currentUnit.trim();
  if (current !== "" && !units.some((unit) => normalizedCategory(unit) === normalizedCategory(current))) units.unshift(current);
  return units;
}

export function defaultPurchaseUnitForCategory(category: unknown, currentUnit: string): string {
  const rule = conversionRuleForCategory(category);
  if (!rule) return currentUnit;
  const units = UNITS_BY_KIND[rule.kind];
  return units.some((unit) => normalizedCategory(unit) === normalizedCategory(currentUnit)) ? currentUnit : units[0];
}

export function hasUnitConversionDraft(draft: UnitConversionDraft): boolean {
  return [
    draft.conversionAmount,
    draft.conversionBaseUnit,
    draft.conversionLengthMm,
    draft.conversionWidthMm,
    draft.conversionThicknessMm,
    draft.conversionWeightKg,
  ].some((value) => String(value ?? "").trim() !== "");
}

export function unitConversionRequired(
  category: unknown,
  eceran: boolean,
  draft: UnitConversionDraft,
): boolean {
  return eceran || conversionRuleForCategory(category) !== null || hasUnitConversionDraft(draft);
}

export interface ExistingUnitConversionState {
  category: unknown;
  unit: unknown;
  eceran?: unknown;
  conversion?: unknown;
  uom2?: unknown;
  konversi?: unknown;
}

function eceranEnabled(value: unknown): boolean {
  return value === true || String(value ?? "").trim().toLowerCase() === "true";
}

/** Legacy material tanpa conversion boleh diedit di field lain hanya jika state konversinya tetap sama. */
export function unitConversionRequiredForEdit(
  category: unknown,
  purchaseUnit: string,
  eceran: boolean,
  draft: UnitConversionDraft,
  existing?: ExistingUnitConversionState | null,
): boolean {
  const hasStoredConversion = existing !== undefined && existing !== null && (
    (existing.conversion !== undefined && existing.conversion !== null)
    || String(existing.uom2 ?? "").trim() !== ""
    || (String(existing.konversi ?? "").trim() !== "" && Number(existing.konversi) !== 0)
  );
  const legacyStateUnchanged = existing !== undefined && existing !== null
    && !hasStoredConversion
    && normalizedCategory(existing.category) === normalizedCategory(category)
    && normalizedCategory(existing.unit) === normalizedCategory(purchaseUnit)
    && eceranEnabled(existing.eceran) === eceran
    && !hasUnitConversionDraft(draft);
  if (legacyStateUnchanged) return false;
  return unitConversionRequired(category, eceran, draft);
}

/** Membuat skema baru tanpa membuang nilai fisik yang diperlukan untuk tahap potong berikutnya. */
export function buildUnitConversion(
  category: unknown,
  purchaseUnit: string,
  draft: UnitConversionDraft,
): UnitConversion | null {
  const rule = conversionRuleForCategory(category);
  if (!rule) {
    const baseUnit = String(draft.conversionBaseUnit ?? "").trim();
    const perUnit = positiveNumber(draft.conversionAmount);
    return baseUnit !== "" && perUnit !== null ? { baseUnit, perUnit } : null;
  }
  if (!UNITS_BY_KIND[rule.kind].some((unit) => normalizedCategory(unit) === normalizedCategory(purchaseUnit))) return null;

  if (rule.kind === "volume" || rule.kind === "tonnage") {
    const perUnit = positiveNumber(draft.conversionAmount);
    return perUnit === null ? null : { baseUnit: rule.baseUnit, perUnit };
  }

  if (rule.kind === "plate") {
    const lengthMm = positiveNumber(draft.conversionLengthMm);
    const widthMm = positiveNumber(draft.conversionWidthMm);
    const thicknessMm = positiveNumber(draft.conversionThicknessMm);
    const weightKg = positiveNumber(draft.conversionWeightKg);
    if (lengthMm === null || widthMm === null || thicknessMm === null || weightKg === null) return null;
    return {
      baseUnit: rule.baseUnit,
      perUnit: weightKg,
      dims: { lengthMm, widthMm, thicknessMm },
    };
  }

  const lengthMm = positiveNumber(draft.conversionLengthMm);
  const weightKg = positiveNumber(draft.conversionWeightKg);
  if (lengthMm === null || weightKg === null) return null;
  return {
    baseUnit: rule.baseUnit,
    perUnit: lengthMm / 1000,
    dims: { lengthMm, weightKg },
  };
}

/** Membaca conversion baru atau field UOM2 lama tanpa mengubah data asal. */
export function unitConversionOf(value: unknown): UnitConversion | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const stored = item.conversion;
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    const raw = stored as Record<string, unknown>;
    const baseUnit = String(raw.baseUnit ?? "").trim();
    const perUnit = positiveNumber(raw.perUnit);
    if (baseUnit !== "" && perUnit !== null) {
      const rawDims = raw.dims && typeof raw.dims === "object" && !Array.isArray(raw.dims)
        ? raw.dims as Record<string, unknown>
        : null;
      const dims: UnitConversionDimensions = {};
      if (rawDims) {
        const lengthMm = optionalPositiveNumber(rawDims.lengthMm);
        const widthMm = optionalPositiveNumber(rawDims.widthMm);
        const thicknessMm = optionalPositiveNumber(rawDims.thicknessMm);
        const weightKg = optionalPositiveNumber(rawDims.weightKg);
        if (lengthMm !== undefined) dims.lengthMm = lengthMm;
        if (widthMm !== undefined) dims.widthMm = widthMm;
        if (thicknessMm !== undefined) dims.thicknessMm = thicknessMm;
        if (weightKg !== undefined) dims.weightKg = weightKg;
      }
      return Object.keys(dims).length > 0 ? { baseUnit, perUnit, dims } : { baseUnit, perUnit };
    }
  }

  const baseUnit = String(item.uom2 ?? "").trim();
  const perUnit = positiveNumber(item.konversi);
  return baseUnit !== "" && perUnit !== null ? { baseUnit, perUnit } : null;
}

function numberText(value: number, locale: "id" | "en"): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    maximumFractionDigits: 3,
  }).format(value);
}

function displayUnit(unit: string): string {
  const normalized = unit.trim().toLocaleLowerCase("id-ID");
  if (normalized === "liter" || normalized === "litre") return "L";
  if (normalized === "meter" || normalized === "metre") return "m";
  return unit;
}

export function formatUnitConversion(
  purchaseUnit: string,
  conversion: UnitConversion | null,
  locale: "id" | "en",
): string {
  if (!conversion) return "";
  const summary = `1 ${purchaseUnit} = ${numberText(conversion.perUnit, locale)} ${displayUnit(conversion.baseUnit)}`;
  const dims = conversion.dims;
  if (!dims) return summary;
  if (dims.lengthMm !== undefined && dims.widthMm !== undefined && dims.thicknessMm !== undefined) {
    return `${summary} (${numberText(dims.lengthMm, locale)} × ${numberText(dims.widthMm, locale)} × ${numberText(dims.thicknessMm, locale)} mm)`;
  }
  if (dims.lengthMm !== undefined && dims.weightKg !== undefined) {
    return `${summary} · ${numberText(dims.weightKg, locale)} kg`;
  }
  return summary;
}
