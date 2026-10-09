import {
  bookingDateDefaults,
  bookingDateOffsets,
  dateBasedSlotStatus,
  emptyBookingDateEdits,
  intervalsOverlap,
  markBookingDateEdited,
  markProjectScheduleDatesEdited,
  refreshUntouchedBookingDates,
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

const staleModalDefaults = bookingDateDefaults("2026-10-09");
equal(
  staleModalDefaults,
  { startDate: "2026-10-09", endDate: "2026-11-07" },
  "default modal sebelum rollover memakai tanggal WITA saat itu",
);
equal(
  refreshUntouchedBookingDates(staleModalDefaults, { startDate: false, endDate: false }, "2026-10-10"),
  { startDate: "2026-10-10", endDate: "2026-11-08" },
  "modal yang dibuka setelah rollover memperbarui kedua tanggal yang belum diedit",
);
equal(
  refreshUntouchedBookingDates(
    { startDate: "2026-10-20", endDate: staleModalDefaults.endDate },
    { startDate: true, endDate: false },
    "2026-10-10",
  ),
  { startDate: "2026-10-20", endDate: "2026-11-08" },
  "modal mempertahankan tanggal mulai yang diedit dan hanya memperbarui tanggal akhir default",
);
equal(
  refreshUntouchedBookingDates(
    { startDate: staleModalDefaults.startDate, endDate: "2026-10-25" },
    { startDate: false, endDate: true },
    "2026-10-10",
  ),
  { startDate: "2026-10-10", endDate: "2026-10-25" },
  "modal mempertahankan tanggal akhir yang diedit dan hanya memperbarui tanggal mulai default",
);
const untouchedDateEdits = emptyBookingDateEdits();
const manuallyEditedStart = markBookingDateEdited(untouchedDateEdits, "startDate");
equal(
  manuallyEditedStart,
  { startDate: true, endDate: false },
  "perubahan manual menandai hanya field tanggal yang diubah",
);
const projectFilledDates = markProjectScheduleDatesEdited(manuallyEditedStart, "2026-10-20", "2026-10-30");
equal(
  projectFilledDates,
  { startDate: true, endDate: true },
  "auto-fill jadwal proyek menandai field tanggal valid sebagai telah diubah",
);
equal(
  refreshUntouchedBookingDates({ startDate: "2026-10-20", endDate: "2026-10-30" }, projectFilledDates, "2026-10-10"),
  { startDate: "2026-10-20", endDate: "2026-10-30" },
  "tanggal manual dan auto-fill tetap dipertahankan setelah modal ditutup lalu dibuka kembali",
);
equal(
  refreshUntouchedBookingDates(
    { startDate: "2026-10-20", endDate: "2026-10-30" },
    emptyBookingDateEdits(),
    "2026-10-10",
  ),
  { startDate: "2026-10-10", endDate: "2026-11-08" },
  "reset setelah save membuat pembukaan modal baru memakai default WITA terbaru",
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
const rescheduleBeyondPlan = bookingDateOffsets("2027-01-15", "2027-01-20", "2026-10-10");
check(
  rescheduleBeyondPlan !== null && rescheduleBeyondPlan.from >= 90 && rescheduleBeyondPlan.to > 90,
  "rentang reschedule tanggal ISO di luar horizon 90 hari tetap menghasilkan offset valid",
);
equal(
  bookingDateOffsets("2026-10-07", "2026-10-09", "2026-10-10"),
  { from: -3, to: 0 },
  "reschedule tanggal ISO sebelum hari ini mempertahankan offset negatif",
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
equal(
  slotDateRange({ from: 4, to: 7 }, "2026-10-10"),
  { startDate: "2026-10-14", endDate: "2026-10-16" },
  "fallback legacy mengubah batas to exclusive menjadi tanggal akhir inklusif to minus satu",
);
check(
  slotDateOffsets({ startDate: "invalid", endDate: "2026-10-11", from: 0, to: 2 }, "2026-10-10") === null,
  "baris dengan tanggal ISO parsial/rusak tidak menyamarkan data dengan offset tersimpan",
);

if (failures > 0) throw new Error(`Probe tanggal drydock gagal: ${failures} pemeriksaan.`);
console.log("Probe tanggal drydock lulus: WITA, rollover ISO/status, fallback legacy, overlap aktual, dan booking bersebelahan.");
