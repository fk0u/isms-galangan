/* Penanda satu kali "sesi berakhir" dari AppShell ke halaman Login (K17-UMUM-01). */
const KEY = "isms.sessionExpired";

export function markSessionExpired(): void {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* storage diblokir: pesan dilewati */ }
}

/** Baca lalu hapus penanda, jadi pesan hanya tampil sekali. */
export function takeSessionExpired(): boolean {
  try {
    const hit = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
    return hit;
  } catch {
    return false;
  }
}
