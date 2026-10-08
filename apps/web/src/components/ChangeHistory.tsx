import { useEffect, useState } from "react";
import { apiFetch, isBackendConfigured } from "../services/http";

interface AuditRow {
  id?: unknown;
  actor?: unknown;
  action?: unknown;
  diff?: unknown;
  created_at?: unknown;
}

interface AuditChange {
  field: string;
  before: unknown;
  after: unknown;
}

function changesOf(diff: unknown): AuditChange[] {
  if (typeof diff !== "object" || diff === null || Array.isArray(diff)) return [];
  return Object.entries(diff).flatMap(([field, raw]) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw) || !("before" in raw) || !("after" in raw)) return [];
    const pair = raw as { before: unknown; after: unknown };
    return [{ field, before: pair.before, after: pair.after }];
  });
}

function displayValue(field: string, value: unknown, redactedLabel: string): string {
  if (/password|token|secret|salary|payroll|npwp|ktp|credential/i.test(field)) return redactedLabel;
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

function formatTime(value: unknown, locale: "id" | "en"): string {
  const raw = String(value ?? "");
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) return raw || "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Makassar",
  }).format(date);
}

export interface HistoryEntryItem {
  id?: string;
  actor: string;
  date: string;
  action?: string;
  before?: unknown;
  after?: unknown;
  note?: string;
  photos?: string[];
}

/** Riwayat audit server yang difilter tepat pada nama tabel dan ID baris, atau entri riwayat kustom. */
export function ChangeHistory({
  table,
  rowId,
  locale = "id",
  labels,
  entries,
}: {
  table?: string;
  rowId?: string;
  locale?: "id" | "en";
  labels: {
    title: string;
    loading: string;
    empty: string;
    error: string;
    serverUnavailable: string;
    before: string;
    after: string;
    redacted: string;
  };
  entries?: HistoryEntryItem[];
}) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "unavailable">("loading");

  useEffect(() => {
    if (entries !== undefined) {
      setState("ready");
      return;
    }
    if (!isBackendConfigured()) {
      setRows([]);
      setState("unavailable");
      return;
    }
    if (!table || !rowId) {
      setRows([]);
      setState("ready");
      return;
    }

    let cancelled = false;
    setState("loading");
    const params = new URLSearchParams({ table, rowId, limit: "100" });
    void apiFetch<{ rows?: AuditRow[] } | AuditRow[]>(`/api/audit?${params.toString()}`)
      .then((result) => {
        const list = Array.isArray(result) ? result : (result.rows ?? []);
        if (!cancelled) {
          setRows(list);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setState("error");
        }
      });

    return () => { cancelled = true; };
  }, [table, rowId, entries]);

  if (entries !== undefined) {
    return (
      <section className="rounded-xl border border-steel-200 bg-white p-3" aria-label={labels.title}>
        <h4 className="text-sm font-semibold text-navy-900">{labels.title}</h4>
        {entries.length === 0 ? (
          <p className="mt-2 text-xs text-steel-500">{labels.empty}</p>
        ) : (
          <ol className="mt-2 max-h-64 space-y-3 overflow-y-auto">
            {entries.map((item, index) => (
              <li key={item.id ?? index} className="border-t border-steel-100 pt-2 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                  <span className="font-medium text-navy-900">{item.actor || "—"}</span>
                  <time className="text-steel-500">{formatTime(item.date, locale)}</time>
                </div>
                {item.action && <p className="mt-0.5 text-xs text-steel-600">{item.action}</p>}
                {(item.before !== undefined || item.after !== undefined) && (
                  <p className="mt-1 text-xs text-steel-700">
                    <span className="text-steel-500">{labels.before}: </span>
                    <span className="font-mono">{String(item.before ?? "—")}</span>
                    <span aria-hidden="true" className="mx-1 text-steel-400">→</span>
                    <span className="text-steel-500">{labels.after}: </span>
                    <span className="font-semibold text-navy-800">{String(item.after ?? "—")}</span>
                  </p>
                )}
                {item.note && <p className="mt-1 text-xs italic text-steel-600">"{item.note}"</p>}
                {item.photos && item.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.photos.map((url, pIdx) => (
                      <a key={pIdx} href={url} target="_blank" rel="noopener noreferrer" className="inline-block overflow-hidden rounded border border-steel-200 hover:opacity-80">
                        <img src={url} alt={`Dokumentasi ${pIdx + 1}`} className="h-10 w-14 object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-steel-200 bg-white p-3" aria-label={labels.title}>
      <h4 className="text-sm font-semibold text-navy-900">{labels.title}</h4>
      {state === "loading" && <p role="status" className="mt-2 text-xs text-steel-500">{labels.loading}</p>}
      {state === "unavailable" && <p className="mt-2 text-xs text-steel-500">{labels.serverUnavailable}</p>}
      {state === "error" && <p role="alert" className="mt-2 text-xs text-rose-700">{labels.error}</p>}
      {state === "ready" && rows.length === 0 && <p className="mt-2 text-xs text-steel-500">{labels.empty}</p>}
      {state === "ready" && rows.length > 0 && (
        <ol className="mt-2 max-h-64 space-y-3 overflow-y-auto">
          {rows.map((row, index) => (
            <li key={String(row.id ?? index)} className="border-t border-steel-100 pt-2 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                <span className="font-medium text-navy-900">{String(row.actor ?? "—")}</span>
                <time className="text-steel-500">{formatTime(row.created_at, locale)}</time>
              </div>
              <p className="mt-1 text-xs text-steel-600">{String(row.action ?? "—")}</p>
              {changesOf(row.diff).map((change) => (
                <div key={change.field} className="mt-1 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 text-xs">
                  <span className="truncate text-steel-500" title={change.field}>{change.field}</span>
                  <span className="break-words text-steel-700">
                    <span className="sr-only">{labels.before}: </span>{displayValue(change.field, change.before, labels.redacted)}
                    <span aria-hidden="true"> → </span>
                    <span className="sr-only">{labels.after}: </span>{displayValue(change.field, change.after, labels.redacted)}
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
