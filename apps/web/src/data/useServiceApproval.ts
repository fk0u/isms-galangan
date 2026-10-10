/* Persetujuan service oleh procurement (F3-D-02, F3-J-04).
 * Tersambung server → POST /api/services/:id/approval (server memeriksa
 * peran & transisi). Mode lokal meniru aturan yang sama. */
import { useCallback } from "react";
import { useStore } from "./store";
import { apiFetch, getJwt, isBackendConfigured } from "../services/http";

export type ServiceApproval = "Diajukan" | "Disetujui" | "Ditolak";

/** Baris lama tanpa field approval dianggap sudah disetujui (sama dengan server). */
export function approvalOf(s: Record<string, unknown>): ServiceApproval {
  const a = String(s.approval ?? "");
  return a === "Diajukan" || a === "Ditolak" || a === "Disetujui" ? a : "Disetujui";
}

const APPROVER_ROLES = new Set(["procurement", "direktur", "developer"]);
export function canApproveService(role: string | undefined): boolean {
  return APPROVER_ROLES.has(String(role ?? "").toLowerCase());
}

export function useServiceApproval(): (id: string, approval: ServiceApproval, note: string, actor: string) => Promise<void> {
  const { data, update, log, resyncCollections } = useStore();
  return useCallback(async (id, approval, note, actor) => {
    if (isBackendConfigured() && getJwt() !== null) {
      await apiFetch(`/api/services/${encodeURIComponent(id)}/approval`, {
        method: "POST", body: JSON.stringify({ approval, ...(note ? { note } : {}) }),
      });
      await resyncCollections(["services", "activities"]);
      return;
    }
    const svc = (data.services ?? []).find((s) => String(s.id) === id);
    if (!svc) throw new Error(`Service ${id} tidak ditemukan`);
    const cur = approvalOf(svc);
    if (approval === "Diajukan" ? cur !== "Ditolak" : cur !== "Diajukan") throw new Error(`Service sudah ${cur}`);
    if (approval === "Ditolak" && !note.trim()) throw new Error("Alasan penolakan wajib diisi");
    await update("services", id, {
      approval, approvalNote: note,
      ...(approval === "Diajukan" ? {} : { approvedBy: actor, approvedAt: new Date().toISOString() }),
    });
    log(`service ${approval.toLowerCase()}`, id, "Procurement");
  }, [data.services, update, log, resyncCollections]);
}
