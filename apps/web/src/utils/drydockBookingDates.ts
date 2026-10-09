const DAY_MS = 86_400_000;

export interface DayOffsets {
  from: number;
  to: number;
}

export interface SlotDateFields {
  startDate?: unknown;
  endDate?: unknown;
  from?: unknown;
  to?: unknown;
}

/** Tanggal kalender aplikasi selalu mengikuti zona waktu WITA, bukan zona host/browser. */
export function witaTodayISO(now: Date = new Date()): string {
  const parts = new Map(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.get("year")}-${parts.get("month")}-${parts.get("day")}`;
}

export function isoDayNumber(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return Math.floor(time / DAY_MS);
}

export function isCalendarDate(value: unknown): value is string {
  return isoDayNumber(value) !== null;
}

export function dayToISO(day: number, today: string = witaTodayISO()): string {
  const todayDay = isoDayNumber(today);
  if (todayDay === null || !Number.isInteger(day)) return "";
  return new Date((todayDay + day) * DAY_MS).toISOString().slice(0, 10);
}

export interface BookingDateValues {
  startDate: string;
  endDate: string;
}

export interface BookingDateEdits {
  startDate: boolean;
  endDate: boolean;
}

export type BookingDateField = keyof BookingDateEdits;

export function emptyBookingDateEdits(): BookingDateEdits {
  return { startDate: false, endDate: false };
}

export function markBookingDateEdited(current: BookingDateEdits, field: BookingDateField): BookingDateEdits {
  return { ...current, [field]: true };
}

export function markProjectScheduleDatesEdited(
  current: BookingDateEdits,
  startDate: unknown,
  endDate: unknown,
): BookingDateEdits {
  return {
    startDate: current.startDate || isCalendarDate(startDate),
    endDate: current.endDate || isCalendarDate(endDate),
  };
}

export function bookingDateDefaults(today: string = witaTodayISO()): BookingDateValues {
  return { startDate: today, endDate: dayToISO(29, today) };
}

export function refreshUntouchedBookingDates(
  current: BookingDateValues,
  edited: BookingDateEdits,
  today: string = witaTodayISO(),
): BookingDateValues {
  const defaults = bookingDateDefaults(today);
  return {
    startDate: edited.startDate ? current.startDate : defaults.startDate,
    endDate: edited.endDate ? current.endDate : defaults.endDate,
  };
}

/** Rentang tanggal akhir-inklusif dikonversi ke offset akhir-eksklusif relatif ke hari WITA. */
export function bookingDateOffsets(
  startDate: unknown,
  endDate: unknown,
  today: string = witaTodayISO(),
): DayOffsets | null {
  const start = isoDayNumber(startDate);
  const end = isoDayNumber(endDate);
  const todayDay = isoDayNumber(today);
  if (start === null || end === null || todayDay === null || end < start) return null;
  return { from: start - todayDay, to: end - todayDay + 1 };
}

/** ISO mengalahkan offset tersimpan; from/to hanya menjadi fallback data lama tanpa tanggal. */
export function slotDateOffsets(
  slot: object,
  today: string = witaTodayISO(),
): DayOffsets | null {
  const fields = slot as SlotDateFields;
  const hasStartDate = fields.startDate !== undefined && fields.startDate !== null && fields.startDate !== "";
  const hasEndDate = fields.endDate !== undefined && fields.endDate !== null && fields.endDate !== "";
  if (hasStartDate || hasEndDate) return bookingDateOffsets(fields.startDate, fields.endDate, today);

  const from = Number(fields.from);
  const to = Number(fields.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  return { from, to };
}

export function dateBasedSlotStatus(
  slot: object,
  projectComplete: boolean,
  today: string = witaTodayISO(),
): "Selesai" | "Berjalan" | "Terjadwal" {
  const offsets = slotDateOffsets(slot, today);
  if (projectComplete || (offsets !== null && offsets.to <= 0)) return "Selesai";
  if (offsets !== null && offsets.from <= 0) return "Berjalan";
  return "Terjadwal";
}

/** Tanggal kalender untuk tampilan; baris tanpa tanggal ISO tetap mempertahankan kompatibilitas legacy. */
export function slotDateRange(
  slot: object,
  today: string = witaTodayISO(),
): { startDate: string; endDate: string } | null {
  const fields = slot as SlotDateFields;
  if (isoDayNumber(fields.startDate) !== null && isoDayNumber(fields.endDate) !== null) {
    return bookingDateOffsets(fields.startDate, fields.endDate, today)
      ? { startDate: String(fields.startDate), endDate: String(fields.endDate) }
      : null;
  }
  const offsets = slotDateOffsets(fields, today);
  if (!offsets) return null;
  const startDate = dayToISO(offsets.from, today);
  const endDate = dayToISO(offsets.to, today);
  return startDate && endDate ? { startDate, endDate } : null;
}

/** Rentang booking memakai [from, to), sehingga sentuhan di batas bukan bentrok. */
export function intervalsOverlap(a: DayOffsets, b: DayOffsets): boolean {
  return a.from < b.to && b.from < a.to;
}
