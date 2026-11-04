import { createBackup, defaultBackupRootDir } from "./backup.js";
import { writeAudit } from "./audit.js";

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Menghitung selisih milidetik menuju jam 00:00 (12 malam) berikutnya.
 */
export function getMsUntilNextMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // 00:00:00 hari berikutnya
  const diff = next.getTime() - now.getTime();
  return diff > 0 ? diff : 24 * 60 * 60 * 1000;
}

/**
 * Menginisialisasi scheduler auto-backup otomatis setiap jam 12 malam (00:00).
 * Sesuai aturan: simpan 2 database terbaru (latest 2 db), hapus yang lebih lama.
 */
export function initBackupScheduler(): void {
  if (process.env.DISABLE_BACKUP_SCHEDULER === "1") {
    console.log("[auto-backup] Scheduler dinonaktifkan (DISABLE_BACKUP_SCHEDULER=1)");
    return;
  }

  // Jika timer sudah aktif, bersihkan dulu
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  const scheduleNext = () => {
    const delayMs = getMsUntilNextMidnight();
    const nextRun = new Date(Date.now() + delayMs);
    console.log(
      `[auto-backup] Jadwal auto-backup aktif: setiap jam 12 malam (00:00). Jadwal berikutnya: ${nextRun.toLocaleString("id-ID")} (dalam ${(delayMs / 1000 / 3600).toFixed(2)} jam).`,
    );

    schedulerTimer = setTimeout(async () => {
      console.log(`[auto-backup] [${new Date().toISOString()}] Menjalankan auto-backup terjadwal jam 12 malam...`);
      try {
        const rootDir = defaultBackupRootDir();
        const res = await createBackup({
          rootDir,
          prune: true,
          keepCount: 2,
        });

        console.log(
          `[auto-backup] Auto-backup jam 12 malam sukses di ${res.outDir}. Menahan 2 DB terbaru (menghapus: ${res.deletedBackups.length} cadangan lama).`,
        );

        await writeAudit({
          actor: "system-scheduler",
          action: "backup.auto_midnight",
          table: "database",
          rowId: res.timestamp,
          diff: {
            tablesCount: res.tablesCount,
            sizeBytes: res.sizeBytes,
            kept: 2,
            deletedCount: res.deletedBackups.length,
          },
          ip: "127.0.0.1",
        }).catch(() => undefined);
      } catch (err) {
        console.error("[auto-backup] Gagal menjalankan auto-backup jam 12 malam:", err);
      } finally {
        scheduleNext();
      }
    }, delayMs);
  };

  scheduleNext();
}

export function stopBackupScheduler(): void {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
    console.log("[auto-backup] Scheduler dihentikan.");
  }
}
