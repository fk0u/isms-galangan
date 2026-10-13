import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "../../../scripts/browser-shims";
import { toast } from "../Toast";
import { Alert, AlertModal } from "../Alert";
import * as UI from "../ui";

interface NodeGlobalScope {
  window?: unknown;
  CustomEvent?: typeof CustomEvent;
}

const scope = globalThis as unknown as NodeGlobalScope;
if (typeof scope.window === "undefined") {
  scope.window = globalThis;
}
if (typeof scope.CustomEvent === "undefined") {
  scope.CustomEvent = class CustomEvent<T = unknown> extends Event {
    detail: T;
    constructor(type: string, init?: { detail?: T }) {
      super(type);
      this.detail = init?.detail as T;
    }
  } as unknown as typeof CustomEvent;
}

interface ToastEventDetail {
  message: string;
  tone: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
}

describe("Toast and Alert System", () => {
  let eventDispatched: CustomEvent<ToastEventDetail> | null = null;
  let dismissDispatched: CustomEvent<{ id?: number | string }> | null = null;

  beforeEach(() => {
    eventDispatched = null;
    dismissDispatched = null;

    vi.spyOn(window, "dispatchEvent").mockImplementation((event: Event) => {
      if (event.type === "isms:toast") {
        eventDispatched = event as CustomEvent;
      }
      if (event.type === "isms:toast:dismiss") {
        dismissDispatched = event as CustomEvent;
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toast function & event dispatching", () => {
    it("dispatches default success toast with legacy signature", () => {
      const id = toast("Data berhasil disimpan");
      expect(typeof id).toBe("number");
      expect(eventDispatched).not.toBeNull();
      expect(eventDispatched?.detail).toMatchObject({
        message: "Data berhasil disimpan",
        tone: "success",
        duration: 3500,
        dismissible: true,
      });
    });

    it("dispatches info tone with legacy tone argument", () => {
      toast("Mode offline aktif", "info");
      expect(eventDispatched?.detail).toMatchObject({
        message: "Mode offline aktif",
        tone: "info",
      });
    });

    it("supports toast.success with title and options", () => {
      toast.success("Dokumen telah divalidasi", {
        title: "Sukses Verifikasi",
        duration: 5000,
      });
      expect(eventDispatched?.detail).toMatchObject({
        message: "Dokumen telah divalidasi",
        title: "Sukses Verifikasi",
        tone: "success",
        duration: 5000,
      });
    });

    it("supports toast.error and maps danger to error", () => {
      toast.error("Koneksi terputus");
      expect(eventDispatched?.detail.tone).toBe("error");

      toast.danger("Gagal menyimpan ke server");
      expect(eventDispatched?.detail.tone).toBe("error");
    });

    it("supports toast.warning and action callback", () => {
      const onUndo = vi.fn();
      toast.warning("File dihapus", {
        action: { label: "Urungkan", onClick: onUndo },
      });
      expect(eventDispatched?.detail.tone).toBe("warning");
      expect(eventDispatched?.detail.action?.label).toBe("Urungkan");
      eventDispatched?.detail.action?.onClick();
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it("dispatches dismiss event via toast.dismiss", () => {
      toast.dismiss(123);
      expect(dismissDispatched).not.toBeNull();
      expect(dismissDispatched?.detail).toEqual({ id: 123 });
    });

    it("handles toast.promise for resolved and rejected states", async () => {
      const okPromise = Promise.resolve("OK");
      const res = await toast.promise(okPromise, {
        loading: "Sedang mengunggah...",
        success: "Unggah selesai!",
        error: "Gagal mengunggah",
      });
      expect(res).toBe("OK");
      expect(eventDispatched?.detail.message).toBe("Unggah selesai!");
      expect(eventDispatched?.detail.tone).toBe("success");

      const failPromise = Promise.reject(new Error("Timeout"));
      await expect(
        toast.promise(failPromise, {
          loading: "Memproses...",
          success: "Berhasil",
          error: (err) => (err instanceof Error ? err.message : "Error"),
        }),
      ).rejects.toThrow("Timeout");
      expect(eventDispatched?.detail.message).toBe("Timeout");
      expect(eventDispatched?.detail.tone).toBe("error");
    });
  });

  describe("UI exports", () => {
    it("re-exports toast, Toaster, Alert, and AlertModal through UI", () => {
      expect(UI.toast).toBeDefined();
      expect(UI.Toaster).toBeDefined();
      expect(UI.Alert).toBeDefined();
      expect(UI.AlertModal).toBeDefined();
      expect(UI.Alert).toBe(Alert);
      expect(UI.AlertModal).toBe(AlertModal);
    });
  });
});
