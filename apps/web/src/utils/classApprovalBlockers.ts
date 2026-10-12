/* classApprovalBlockers.ts — Logika evaluasi blocker transisi approval tahapan proyek.
 * Memeriksa prasyarat Class Approval, kontrak, dan penutupan tahapan secara real-time.
 */
import type { StoreItem } from "../data/store";
import { hasContract } from "../pages/proyek/Projects";

export interface PlanningSubclass {
  id: string;
  name: string;
  nameEn: string;
  kw: RegExp;
}

export const PLANNING_SUBCLASSES: PlanningSubclass[] = [
  { id: "GA", name: "General Arrangement (Rencana Umum)", nameEn: "General Arrangement", kw: /rencana umum|general arrangement|ga/i },
  { id: "LINES", name: "Lines Plan & Data Hidrostatis", nameEn: "Lines Plan & Hydrostatic Data", kw: /lines plan|hidrostatis|garis/i },
  { id: "MIDSHIP", name: "Midship Section & Scantling BKI", nameEn: "Midship Section & Classification Scantling", kw: /midship|penampang|scantling/i },
  { id: "CONSTR", name: "Profil Konstruksi & Geladak", nameEn: "Construction Profile & Decks", kw: /konstruksi|profile|geladak|deck/i },
  { id: "SHELL", name: "Shell Expansion (Bukaan Kulit)", nameEn: "Shell Expansion (Hull Plating)", kw: /shell|kulit|bukaan/i },
  { id: "MACH", name: "Machinery Arrangement & Shafting", nameEn: "Machinery Arrangement & Shafting", kw: /machinery|mesin|poros|shaft/i },
  { id: "PIPING", name: "Piping & Bilge/Ballast Diagram", nameEn: "Piping & Bilge/Ballast Diagram", kw: /piping|perpipaan|bilga|ballast/i },
  { id: "ELEC", name: "Electrical One-Line Diagram", nameEn: "Electrical One-Line Diagram", kw: /electrical|listrik|one-line/i },
  { id: "STAB", name: "Buku Stabilitas Kapal (Stability)", nameEn: "Stability Booklet", kw: /stability|stabilitas|booklet/i },
  { id: "SAFETY", name: "Safety Plan & Sertifikat Kelas", nameEn: "Safety Plan & Class Certificate", kw: /kelas|class|safety|sertifikat/i },
];

export interface StageBlocker {
  id: string;
  name: string;
  section: string;
  tab: string;
  statusReason: string;
  statusTone: "amber" | "red" | "gray";
  targetDocId?: string;
}

export interface TransitionBlockerData {
  documents?: StoreItem[];
  wbs?: StoreItem[];
  contracts?: StoreItem[];
  ncr?: StoreItem[];
  quotations?: StoreItem[];
}

export function isClassApprovalSatisfied(project: StoreItem, data: TransitionBlockerData): boolean {
  const pid = String(project.id ?? "");
  const docs = data.documents ?? [];
  const classDocApproved = docs.some(
    (d) => String(d.project ?? "") === pid && String(d.type ?? "") === "Sertifikat" && String(d.subType ?? "") === "Sertifikat Kelas" && String(d.status ?? "") === "Disetujui",
  );
  if (classDocApproved) return true;

  const stages = (project.designStages ?? []) as { name: string; status: string }[];
  const ca = stages.find((s) => s.name === "Class Approval");
  return ca?.status === "Disetujui";
}

export function getStageTransitionBlockers(
  from: string,
  to: string,
  project: StoreItem,
  data: TransitionBlockerData,
  locale: "id" | "en" = "id",
): StageBlocker[] {
  const blockers: StageBlocker[] = [];
  const isEn = locale === "en";
  const pid = String(project.id ?? "");
  const projectDocs = (data.documents ?? []).filter((d) => String(d.project ?? "") === pid);
  const wbs = data.wbs ?? [];
  const stages = (project.designStages ?? []) as { name: string; status: string }[];

  // Gate Class Approval (Desain/Perencanaan -> Produksi)
  if ((from === "Desain" || from === "Perencanaan") && to === "Produksi") {
    const classApproved = isClassApprovalSatisfied(project, data);

    if (!classApproved) {
      // 1. Dokumen Sertifikat Kelas Utama
      const classDoc = projectDocs.find((d) => String(d.type ?? "") === "Sertifikat" && String(d.subType ?? "") === "Sertifikat Kelas");
      const caStage = stages.find((s) => s.name === "Class Approval");

      let certReason = isEn ? "Class Certificate not uploaded yet" : "Sertifikat Kelas belum diunggah";
      let certTone: "amber" | "red" | "gray" = "red";

      if (classDoc) {
        const st = String(classDoc.status ?? "");
        if (st === "Draft") {
          certReason = isEn ? "Certificate is Draft (needs submission)" : "Sertifikat Kelas berstatus Draft (perlu diajukan)";
          certTone = "amber";
        } else if (st === "Diajukan" || st === "Ditinjau") {
          certReason = isEn ? "Certificate is Submitted (pending approval)" : "Sertifikat Kelas telah diajukan (belum disetujui)";
          certTone = "amber";
        } else if (st === "Ditolak") {
          certReason = isEn ? "Certificate was Rejected (needs revision)" : "Sertifikat Kelas ditolak (perlu revisi)";
          certTone = "red";
        } else {
          certReason = isEn ? `Certificate status is ${st} (pending approval)` : `Sertifikat Kelas berstatus ${st} (belum disetujui)`;
          certTone = "amber";
        }
      } else if (caStage) {
        const st = String(caStage.status ?? "");
        if (st === "Diajukan") {
          certReason = isEn ? "Stage is Submitted (pending approval)" : "Tahap telah diajukan (belum disetujui)";
          certTone = "amber";
        } else {
          certReason = isEn ? `Sub-stage status is ${st} (needs submission & approval)` : `Sub-stage berstatus ${st} (perlu diajukan dan disetujui)`;
          certTone = "amber";
        }
      }

      blockers.push({
        id: "CLASS_CERTIFICATE",
        name: isEn ? "Class Approval Certificate" : "Sertifikat Class Approval",
        section: isEn ? "Documents" : "Dokumen",
        tab: "Dokumen",
        statusReason: certReason,
        statusTone: certTone,
        targetDocId: classDoc ? String(classDoc.id ?? "") : undefined,
      });

      // 2. Evaluasi 10 Subclass Perencanaan & Gambar Teknik
      for (const item of PLANNING_SUBCLASSES) {
        if (item.id === "SAFETY" && classApproved) continue;

        const docMatched = projectDocs.find((d) => item.kw.test(String(d.title ?? "")) && String(d.status ?? "") === "Disetujui");
        const wbsMatched = wbs.find((w) => item.kw.test(String(w.task ?? "")) && Number(w.progress ?? 0) >= 100);
        const stageMatched = stages.find((s) => item.kw.test(String(s.name ?? "")) && s.status === "Disetujui");

        if (docMatched || wbsMatched || stageMatched) {
          continue; // Item ini sudah selesai
        }

        // Tentukan alasan status untuk item yang belum selesai
        const pendingDoc = projectDocs.find((d) => item.kw.test(String(d.title ?? "")));
        const pendingWbs = wbs.find((w) => item.kw.test(String(w.task ?? "")));
        const pendingStage = stages.find((s) => item.kw.test(String(s.name ?? "")));

        let reason = isEn ? "Not filled / not uploaded yet" : "Belum diisi / belum diunggah";
        let tone: "amber" | "red" | "gray" = "red";
        let targetTab = "Dokumen";

        if (pendingDoc) {
          const st = String(pendingDoc.status ?? "");
          targetTab = "Dokumen";
          if (st === "Draft") {
            reason = isEn ? `Document "${pendingDoc.title}" is Draft (needs submission)` : `Dokumen "${pendingDoc.title}" Draft (perlu diajukan)`;
            tone = "amber";
          } else if (st === "Diajukan" || st === "Ditinjau") {
            reason = isEn ? `Document "${pendingDoc.title}" is Submitted (pending approval)` : `Dokumen "${pendingDoc.title}" Diajukan (belum disetujui)`;
            tone = "amber";
          } else if (st === "Ditolak") {
            reason = isEn ? `Document "${pendingDoc.title}" was Rejected` : `Dokumen "${pendingDoc.title}" Ditolak`;
            tone = "red";
          } else {
            reason = isEn ? `Document "${pendingDoc.title}" status: ${st}` : `Dokumen "${pendingDoc.title}" status: ${st}`;
            tone = "amber";
          }
        } else if (pendingWbs) {
          targetTab = "WBS";
          const pct = Number(pendingWbs.progress ?? 0);
          reason = isEn ? `WBS task "${pendingWbs.task}" is at ${pct}% (needs 100%)` : `WBS "${pendingWbs.task}" baru ${pct}% (perlu 100%)`;
          tone = "amber";
        } else if (pendingStage) {
          targetTab = "Ringkasan";
          reason = isEn ? `Sub-stage "${pendingStage.name}" is ${pendingStage.status}` : `Sub-stage "${pendingStage.name}" berstatus ${pendingStage.status}`;
          tone = "amber";
        }

        blockers.push({
          id: `SUBCLASS_${item.id}`,
          name: isEn ? item.nameEn : item.name,
          section: targetTab === "Dokumen" ? (isEn ? "Documents" : "Dokumen") : targetTab === "WBS" ? "WBS" : (isEn ? "Overview" : "Ringkasan"),
          tab: targetTab,
          statusReason: reason,
          statusTone: tone,
          targetDocId: pendingDoc ? String(pendingDoc.id ?? "") : undefined,
        });
      }
    }
  }

  // Gate Kontrak (untuk proyek hasil konversi penawaran)
  if (project.quotationId && !hasContract(project, data.contracts ?? [])) {
    blockers.push({
      id: "CONTRACT_MISSING",
      name: isEn ? "Signed Project Contract" : "Kontrak Proyek Tertandatangani",
      section: isEn ? "Contracts" : "Kontrak",
      tab: "Ringkasan",
      statusReason: isEn ? `No contract signed for quotation ${project.quotationId}` : `Belum ada kontrak yang ditandatangani untuk penawaran ${project.quotationId}`,
      statusTone: "amber",
    });
  }

  // Gate Handover
  if (to === "Handover") {
    const undoneWbs = wbs.filter((w) => Number(w.progress ?? 0) < 100);
    if (undoneWbs.length > 0) {
      blockers.push({
        id: "WBS_INCOMPLETE",
        name: isEn ? `WBS Completion (${undoneWbs.length} tasks remain)` : `Penyelesaian WBS (${undoneWbs.length} pekerjaan tersisa)`,
        section: "WBS",
        tab: "WBS",
        statusReason: isEn ? `${undoneWbs.length} WBS tasks are not 100% completed` : `${undoneWbs.length} pekerjaan WBS belum tuntas 100%`,
        statusTone: "red",
      });
    }

    const openNcr = (data.ncr ?? []).filter((n) => String(n.project ?? "") === pid && String(n.status ?? "") !== "Tertutup");
    if (openNcr.length > 0) {
      blockers.push({
        id: "NCR_OPEN",
        name: isEn ? `Open NCR Findings (${openNcr.length} open)` : `Temuan NCR Terbuka (${openNcr.length} temuan)`,
        section: "QC & Safety",
        tab: "Terkait",
        statusReason: isEn ? `${openNcr.length} NCRs must be closed before Handover` : `${openNcr.length} temuan NCR harus ditutup sebelum Handover`,
        statusTone: "red",
      });
    }
  }

  return blockers;
}
