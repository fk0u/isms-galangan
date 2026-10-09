import {
  bookingDateOffsets,
  dateBasedSlotStatus,
  intervalsOverlap,
  slotDateOffsets,
  slotDateRange,
  witaTodayISO,
} from "../src/utils/drydockBookingDates";

let failures = 0;
const check = (condition: boolean, label: string, detail = ""): void => {
  if (condition) {
    console.log(`PASS  ${label}`);
    return;
  }
  failures += 1;
  console.log(`FAIL  ${label}${detail === "" ? "" : ` -> ${detail}`}`);
};
const equal = (actual: unknown, expected: unknown, label: string): void => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  check(actualJson === expectedJson, label, `${actualJson} !== ${expectedJson}`);
};

check(
  witaTodayISO(new Date("2026-10-08T16:30:00.000Z")) === "2026-10-09",
  "tanggal aplikasi mengikuti WITA meski UTC masih hari sebelumnya",
  witaTodayISO(new Date("2026-10-08T16:30:00.000Z")),
);

const savedBooking = {
  startDate: "2026-10-10",
  endDate: "2026-10-12",
  from: 31,
  to: 34,
};
equal(
  slotDateOffsets(savedBooking, "2026-10-09"),
  { from: 1, to: 4 },
  "offset tampilan booking dihitung dari tanggal ISO sebelum rollover",
);
equal(
  slotDateOffsets(savedBooking, "2026-10-10"),
  { from: 0, to: 3 },
  "offset bergeser satu hari setelah rollover, bukan memakai from/to lama",
);
equal(
  slotDateRange(savedBooking, "2026-10-10"),
  { startDate: "2026-10-10", endDate: "2026-10-12" },
  "tanggal tampilan tetap tanggal ISO yang tersimpan",
);

const statusBooking = { startDate: "2026-10-10", endDate: "2026-10-12", from: -99, to: -96 };
check(dateBasedSlotStatus(statusBooking, false, "2026-10-09") === "Terjadwal", "status sebelum mulai mengikuti ISO meski offset stale menyatakan selesai");
check(dateBasedSlotStatus(statusBooking, false, "2026-10-10") === "Berjalan", "status bergeser ke berjalan pada hari WITA tanggal mulai");
check(dateBasedSlotStatus(statusBooking, false, "2026-10-13") === "Selesai", "status selesai pada hari setelah tanggal akhir inklusif");

const existingBeforeRollover = { startDate: "2026-10-09", endDate: "2026-10-10", from: 0, to: 2 };
const existingAfterRollover = slotDateOffsets(existingBeforeRollover, "2026-10-10");
const adjacentBooking = bookingDateOffsets("2026-10-11", "2026-10-12", "2026-10-10");
equal(existingAfterRollover, { from: -1, to: 1 }, "booking lama ikut bergeser terhadap hari kini");
equal(adjacentBooking, { from: 1, to: 3 }, "booking berikutnya mulai tepat saat slot lama berakhir");
if (existingAfterRollover === null || adjacentBooking === null) {
  check(false, "rentang tanggal valid untuk uji booking bersisian");
} else {
  check(
    !intervalsOverlap(existingAfterRollover, adjacentBooking),
    "booking yang bersisian setelah pergantian hari tidak ditolak sebagai bentrok",
  );
}

const overlappingBooking = bookingDateOffsets("2026-10-10", "2026-10-11", "2026-10-10");
if (existingAfterRollover === null || overlappingBooking === null) {
  check(false, "rentang tanggal valid untuk uji booking bertumpang tindih");
} else {
  check(
    intervalsOverlap(existingAfterRollover, overlappingBooking),
    "bentrok tanggal aktual tetap terdeteksi setelah rollover",
  );
}

equal(
  slotDateOffsets({ from: -3, to: 1 }, "2026-10-10"),
  { from: -3, to: 1 },
  "data legacy tanpa tanggal ISO memakai from/to",
);
check(
  slotDateOffsets({ startDate: "invalid", endDate: "2026-10-11", from: 0, to: 2 }, "2026-10-10") === null,
  "baris dengan tanggal ISO parsial/rusak tidak menyamarkan data dengan offset tersimpan",
);

if (failures > 0) throw new Error(`Probe tanggal drydock gagal: ${failures} pemeriksaan.`);
console.log("Probe tanggal drydock lulus: WITA, rollover ISO/status, fallback legacy, overlap aktual, dan booking bersebelahan.");
