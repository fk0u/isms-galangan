/* Angka keterlambatan satu proyek, dipakai bersama.
 *
 * Dulu `delayDaysOf` hidup di dalam Monitoring.tsx sebagai helper lokal,
 * sehingga ProjectDetail tidak bisa menampilkan angka yang sama di card
 * progresnya - padahal yang diminta justru "tambah detail saat terlambat" di
 * halaman detail. Dua tempat menghitungnya sendiri akan berbeda begitu
 * definisi "terlambat" berubah, jadi perhitungannya harus punya satu sumber.
 */

/** Sisa hari sampai tanggal selesai; negatif = sudah lewat. */
export function endInDays(end: unknown, today: string): number | null {
  const m = String(end ?? "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const day = m[3]
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(Number(m[1]), Number(m[2]), 0);
  const from = new Date(`${today}T00:00:00`);
  return Math.round((day.getTime() - from.getTime()) / 86400000);
}

/**
 * Berapa hari proyek terlambat, atau null kalau tidak terlambat.
 *
 * Penentuan "terlambat" milik pemanggil: Monitoring memakai status badge ATAU
 * lewat jatuh tempo, sedangkan detail proyek sudah punya status yang
 * definitive. Fungsi ini hanya menghitung angkanya.
 */
export function delayDaysOf(end: unknown, today: string, isLate: boolean): number | null {
  if (!isLate) return null;
  const d = endInDays(end, today);
  if (d === null) return null;
  return Math.max(0, -d);
}

export interface DelayWbsItem {
  task?: unknown;
  end?: unknown;
  progress?: unknown;
  status?: unknown;
}

export interface ProjectDelayDetails {
  cause: string | null;
  targetDate: string | null;
  causeTargetDate: string | null;
  daysLate: number | null;
  causeDaysLate: number | null;
  projectDaysRemaining: number | null;
}

/** Sumber bersama detail penundaan: target proyek, hari lewat target, dan WBS penyebab. */
export function projectDelayDetailsOf(
  projectEnd: unknown,
  wbs: readonly DelayWbsItem[],
  today: string,
  isLate: boolean,
): ProjectDelayDetails {
  const projectEndValue = String(projectEnd ?? "").trim();
  const projectDaysRemaining = endInDays(projectEndValue, today);
  const unfinished = wbs.flatMap((item, index) => {
    const task = String(item.task ?? "").trim();
    const targetDate = String(item.end ?? "").trim();
    const daysRemaining = endInDays(targetDate, today);
    if (!task || daysRemaining === null || String(item.status ?? "") === "Selesai" || Number(item.progress ?? 0) >= 100) return [];
    return [{ task, targetDate, daysRemaining, index }];
  });
  const overdue = unfinished.filter((item) => item.daysRemaining < 0);
  const candidates = overdue.length > 0 ? overdue : isLate ? [] : unfinished;
  candidates.sort((a, b) => a.daysRemaining - b.daysRemaining || a.index - b.index);
  const cause = candidates[0] ?? null;
  const daysLate = isLate || (projectDaysRemaining !== null && projectDaysRemaining < 0)
    ? delayDaysOf(projectEndValue, today, true)
    : null;

  return {
    cause: cause?.task ?? null,
    targetDate: projectDaysRemaining === null ? null : projectEndValue,
    causeTargetDate: cause?.targetDate ?? null,
    daysLate,
    causeDaysLate: cause && cause.daysRemaining < 0 ? -cause.daysRemaining : null,
    projectDaysRemaining,
  };
}

/* Override status "Terlambat" (P8).
 *
 * Sebelumnya status "Terlambat" ditulis otomatis oleh dua useEffect
 * (ProjectDetail dan Projects) tanpa jalan keluar: user yang mengubah status
 * ke sesuatu yang lain akan melihatnya ditulis balik ke "Terlambat" oleh
 * efek berikutnya. Client meminta status ini bisa di-override manual.
 *
 * Solusi: field `statusOverride` di project record. Kalau ada override dan
 * override-nya bukan "Terlambat", auto-logic tidak menulis status.
 * Override otomatis di-clear kalau proyek sudah tidak lagi overdue.
 */

interface StatusOverrideLike {
  status?: string;
  reason?: string;
  at?: string;
  by?: string;
}

/** Apakah auto-logic harus menulis status "Terlambat" ke proyek ini? */
export function shouldAutoSetLate(
  project: Record<string, unknown>,
  today: string,
  isOverdueFn: (p: Record<string, unknown>, today: string) => boolean,
): boolean {
  const status = String(project.status ?? "");
  if (status !== "Dalam Proses" && status !== "Sedang Berjalan" && status !== "Tertunda") return false;
  const override = project.statusOverride as StatusOverrideLike | undefined;
  if (override && String(override.status ?? "") !== "Terlambat") return false;
  return isOverdueFn(project, today);
}

/**
 * Apakah `statusOverride` harus di-clear?
 *
 * True kalau override ada tapi proyek sudah tidak lagi overdue (mis. end
 * diperbaiki atau progress mencapai 100%) — auto-logic tidak akan menulis
 * "Terlambat" lagi, jadi override sudah tidak berguna.
 */
export function shouldClearOverride(
  project: Record<string, unknown>,
  today: string,
  isOverdueFn: (p: Record<string, unknown>, today: string) => boolean,
): boolean {
  if (!project.statusOverride) return false;
  return !isOverdueFn(project, today);
}
