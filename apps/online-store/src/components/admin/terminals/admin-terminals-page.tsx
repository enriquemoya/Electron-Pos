"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { AdminTerminal, PickupBranch } from "@/lib/admin-api";
import { Link } from "@/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TerminalCreateDialog, type CreateTerminalPayload, type CreateTerminalResult, type TerminalCreateDialogLabels } from "@/components/admin/terminals/terminal-create-dialog";
import { TerminalTable, type TerminalTableLabels } from "@/components/admin/terminals/terminal-table";

type ApiErrorPayload = {
  error?: string;
  code?: string;
};

type Labels = {
  title: string;
  subtitle: string;
  summary: string;
  create: TerminalCreateDialogLabels;
  table: TerminalTableLabels;
  pagination: {
    prev: string;
    next: string;
    page: string;
  };
  toasts: {
    revokeOk: string;
    revokeError: string;
  };
  errors: {
    generic: string;
    unauthorized: string;
    notFound: string;
    revoked: string;
    rateLimited: string;
  };
};

type Props = {
  locale: string;
  page: number;
  total: number;
  totalPages: number;
  branches: PickupBranch[];
  items: AdminTerminal[];
  labels: Labels;
};

class RequestError extends Error {
  readonly code: string;

  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.code = code;
  }
}

async function parseApiResponse(response: Response) {
  let payload: ApiErrorPayload | Record<string, unknown> | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "request failed";
    const code = typeof payload?.code === "string" ? payload.code : "UNKNOWN";
    throw new RequestError(message, code);
  }

  return payload as Record<string, unknown>;
}

export function AdminTerminalsPage({ locale, page, total, totalPages, branches, items, labels }: Props) {
  const [terminals, setTerminals] = useState<AdminTerminal[]>(items);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const pageSummary = useMemo(
    () => labels.summary.replace("{count}", String(total)).replace("{page}", String(page)).replace("{pages}", String(totalPages)),
    [labels.summary, page, total, totalPages]
  );

  const errorFromCode = (code?: string) => {
    switch (code) {
      case "UNAUTHORIZED":
        return labels.errors.unauthorized;
      case "POS_TERMINAL_NOT_FOUND":
      case "TERMINAL_NOT_FOUND":
        return labels.errors.notFound;
      case "TERMINAL_REVOKED":
      case "POS_TERMINAL_ALREADY_REVOKED":
        return labels.errors.revoked;
      case "POS_RATE_LIMITED":
      case "TERMINAL_RATE_LIMITED":
        return labels.errors.rateLimited;
      default:
        return labels.errors.generic;
    }
  };

  const handleCreateTerminal = async (payload: CreateTerminalPayload): Promise<CreateTerminalResult> => {
    const response = await fetch("/api/admin/terminals", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    try {
      const data = (await parseApiResponse(response)) as CreateTerminalResult & Partial<AdminTerminal>;
      if (page === 1) {
        setTerminals((current) => {
          const nextItem: AdminTerminal = {
            id: String(data.id || ""),
            name: payload.name,
            branchId: payload.branchId,
            branchName: branches.find((branch) => branch.id === payload.branchId)?.name || "-",
            branchCity: branches.find((branch) => branch.id === payload.branchId)?.city || null,
            status: "PENDING",
            revokedAt: null,
            revokedByAdminId: null,
            revokedByAdminName: null,
            lastSeenAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return [nextItem, ...current].slice(0, current.length || 10);
        });
      }
      const activationApiKey = typeof data.activationApiKey === "string" ? data.activationApiKey : "";
      if (!activationApiKey) {
        throw new Error(labels.errors.generic);
      }
      return { activationApiKey };
    } catch (error) {
      const code = error instanceof RequestError ? error.code : undefined;
      throw new Error(errorFromCode(code));
    }
  };

  const handleRevokeTerminal = async (terminalId: string) => {
    try {
      const response = await fetch(`/api/admin/terminals/${terminalId}/revoke`, {
        method: "POST"
      });
      await parseApiResponse(response);

      setTerminals((current) =>
        current.map((terminal) =>
          terminal.id === terminalId
            ? {
                ...terminal,
                status: "REVOKED",
                revokedAt: new Date().toISOString(),
                lastSeenAt: terminal.lastSeenAt
              }
            : terminal
        )
      );

      toast.success(labels.toasts.revokeOk);
    } catch (error) {
      const code = error instanceof RequestError ? error.code : undefined;
      const message = errorFromCode(code);
      toast.error(labels.toasts.revokeError, { description: message });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{labels.title}</h1>
            <p className="text-sm text-white/60">{labels.subtitle}</p>
            <p className="text-xs text-white/50">{pageSummary}</p>
          </div>
          <TerminalCreateDialog branches={branches} labels={labels.create} onCreate={handleCreateTerminal} />
        </CardHeader>
        <CardContent className="space-y-4">
          <TerminalTable locale={locale} items={terminals} labels={labels.table} onRevoke={handleRevokeTerminal} />

          <div className="flex items-center justify-between text-sm text-white/70">
            {canGoPrev ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/terminals?page=${Math.max(1, page - 1)}`}>{labels.pagination.prev}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                {labels.pagination.prev}
              </Button>
            )}
            <span>{labels.pagination.page.replace("{page}", String(page)).replace("{pages}", String(totalPages))}</span>
            {canGoNext ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/terminals?page=${Math.min(totalPages, page + 1)}`}>{labels.pagination.next}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                {labels.pagination.next}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export type { Labels as AdminTerminalsPageLabels };
