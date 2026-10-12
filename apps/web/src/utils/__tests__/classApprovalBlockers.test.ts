import { describe, it, expect } from "vitest";
import { getStageTransitionBlockers, isClassApprovalSatisfied, PLANNING_SUBCLASSES } from "../classApprovalBlockers";
import type { StoreItem } from "../../data/store";

describe("classApprovalBlockers", () => {
  const dummyProject: StoreItem = {
    id: "RP-2026-003",
    name: "Tugboat Perkasa",
    tahap: "Desain",
    status: "Sedang Berjalan",
    designStages: [
      { name: "Basic Design & GA", status: "Disetujui" },
      { name: "Class Approval", status: "Diajukan" },
    ],
  };

  it("mendeteksi Class Approval belum selesai jika dokumen kelas belum Disetujui", () => {
    const data = {
      documents: [
        { id: "DOC-1", project: "RP-2026-003", type: "Sertifikat", subType: "Sertifikat Kelas", status: "Diajukan", title: "Sertifikat BKI" },
      ],
      wbs: [],
    };

    expect(isClassApprovalSatisfied(dummyProject, data)).toBe(false);
    const blockers = getStageTransitionBlockers("Desain", "Produksi", dummyProject, data, "id");
    expect(blockers.length).toBeGreaterThan(0);

    const certBlocker = blockers.find((b) => b.id === "CLASS_CERTIFICATE");
    expect(certBlocker).toBeDefined();
    expect(certBlocker?.statusReason).toContain("belum disetujui");
    expect(certBlocker?.tab).toBe("Dokumen");
  });

  it("mendeteksi dokumen Draft sebagai perlu diajukan", () => {
    const data = {
      documents: [
        { id: "DOC-1", project: "RP-2026-003", type: "Sertifikat", subType: "Sertifikat Kelas", status: "Draft", title: "Sertifikat BKI" },
      ],
      wbs: [],
    };

    const blockers = getStageTransitionBlockers("Desain", "Produksi", dummyProject, data, "id");
    const certBlocker = blockers.find((b) => b.id === "CLASS_CERTIFICATE");
    expect(certBlocker?.statusReason).toContain("perlu diajukan");
  });

  it("lolos Class Approval jika dokumen Sertifikat Kelas berstatus Disetujui", () => {
    const data = {
      documents: [
        { id: "DOC-1", project: "RP-2026-003", type: "Sertifikat", subType: "Sertifikat Kelas", status: "Disetujui", title: "Sertifikat BKI" },
        ...PLANNING_SUBCLASSES.map((sub, i) => ({
          id: `DOC-SUB-${i}`,
          project: "RP-2026-003",
          type: "Drawing",
          title: sub.name,
          status: "Disetujui",
        })),
      ],
      wbs: [],
    };

    expect(isClassApprovalSatisfied(dummyProject, data)).toBe(true);
    const blockers = getStageTransitionBlockers("Desain", "Produksi", dummyProject, data, "id");
    expect(blockers.length).toBe(0);
  });

  it("mendeteksi blocker kontrak jika quotationId ada namun belum ada kontrak", () => {
    const convProject: StoreItem = {
      id: "RP-2026-CONV",
      tahap: "Quotation",
      quotationId: "Q-2026-001",
    };
    const data = {
      contracts: [],
    };

    const blockers = getStageTransitionBlockers("Quotation", "Kontrak", convProject, data, "id");
    const contractBlocker = blockers.find((b) => b.id === "CONTRACT_MISSING");
    expect(contractBlocker).toBeDefined();
    expect(contractBlocker?.tab).toBe("Ringkasan");
  });

  it("mendeteksi blocker Handover jika WBS belum 100% atau ada NCR terbuka", () => {
    const trialProject: StoreItem = {
      id: "RP-2026-003",
      tahap: "Trial",
    };
    const data = {
      wbs: [
        { id: "W1", task: "Hull", progress: 80 },
      ],
      ncr: [
        { id: "NCR-1", project: "RP-2026-003", status: "Terbuka" },
      ],
    };

    const blockers = getStageTransitionBlockers("Trial", "Handover", trialProject, data, "id");
    expect(blockers.some((b) => b.id === "WBS_INCOMPLETE")).toBe(true);
    expect(blockers.some((b) => b.id === "NCR_OPEN")).toBe(true);
  });
});
