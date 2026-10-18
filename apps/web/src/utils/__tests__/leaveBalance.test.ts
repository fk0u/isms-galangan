import { describe, expect, it } from "vitest";
import { leaveUsedByEmployee, reducesLeaveBalance } from "../leaveBalance";

describe("saldo cuti tahunan (K17-HR-02)", () => {
  const leaves = [
    { employeeId: "E1", type: "Tahunan", status: "Disetujui", days: 3 },
    { employeeId: "E1", type: "Sakit", status: "Disetujui", days: 5 },
    { employeeId: "E1", type: "Izin", status: "Disetujui", days: 1 },
    { employeeId: "E1", type: "Tahunan", status: "Diajukan", days: 2 },
    { employeeId: "E2", type: "Sakit", status: "Disetujui", days: 4 },
  ];
  it("cuti sakit (dan jenis lain) tidak memotong saldo; hanya Tahunan yang Disetujui", () => {
    const used = leaveUsedByEmployee(leaves);
    expect(used.get("E1")).toBe(3);
    expect(used.get("E2")).toBeUndefined();
  });
  it("hanya pengajuan Tahunan yang dicek kecukupan saldonya", () => {
    expect(reducesLeaveBalance("Tahunan")).toBe(true);
    expect(reducesLeaveBalance("Sakit")).toBe(false);
  });
});
