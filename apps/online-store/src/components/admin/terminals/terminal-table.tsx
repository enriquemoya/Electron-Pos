"use client";

import type { AdminTerminal } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { TerminalActions, type TerminalActionsLabels } from "@/components/admin/terminals/terminal-actions";

type StatusTone = {
  className: string;
};

const statusTones: Record<AdminTerminal["status"], StatusTone> = {
  PENDING: { className: "bg-amber-500/20 text-amber-200" },
  ACTIVE: { className: "bg-emerald-500/20 text-emerald-200" },
  REVOKED: { className: "bg-red-500/20 text-red-200" }
};

type Labels = {
  columns: {
    name: string;
    branch: string;
    status: string;
    lastRotation: string;
    createdAt: string;
    actions: string;
  };
  status: {
    PENDING: string;
    ACTIVE: string;
    REVOKED: string;
  };
  empty: string;
  never: string;
  actions: TerminalActionsLabels;
};

type Props = {
  locale: string;
  items: AdminTerminal[];
  labels: Labels;
  onRegenerate: (terminalId: string) => Promise<void>;
  onRevoke: (terminalId: string) => Promise<void>;
};

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function TerminalTable({ locale, items, labels, onRegenerate, onRevoke }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-base-900/40">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th className="px-4 py-3">{labels.columns.name}</th>
            <th className="px-4 py-3">{labels.columns.branch}</th>
            <th className="px-4 py-3">{labels.columns.status}</th>
            <th className="px-4 py-3">{labels.columns.lastRotation}</th>
            <th className="px-4 py-3">{labels.columns.createdAt}</th>
            <th className="px-4 py-3 text-right">{labels.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-white/50">
                {labels.empty}
              </td>
            </tr>
          ) : (
            items.map((terminal) => (
              <tr key={terminal.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{terminal.name}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{terminal.branchName}</p>
                  <p className="text-xs text-white/50">{terminal.branchCity || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge className={statusTones[terminal.status].className}>{labels.status[terminal.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-white/70">{formatDate(terminal.lastSeenAt, locale, labels.never)}</td>
                <td className="px-4 py-3 text-white/70">{formatDate(terminal.createdAt, locale, labels.never)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <TerminalActions terminal={terminal} labels={labels.actions} onRegenerate={onRegenerate} onRevoke={onRevoke} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export type { Labels as TerminalTableLabels };
