"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TerminalActivationKeyDialog, type TerminalActivationKeyDialogLabels } from "@/components/admin/terminals/terminal-activation-key-dialog";
import { Button } from "@/components/ui/button";
import { TerminalRevokeDialog, type TerminalRevokeDialogLabels } from "@/components/admin/terminals/terminal-revoke-dialog";

type Labels = {
  regenerate: string;
  regenerating: string;
  revoke: string;
  revokeDisabled: string;
  regenerateDialog: TerminalActivationKeyDialogLabels;
  revokeDialog: TerminalRevokeDialogLabels;
  regenerateOk: string;
  regenerateError: string;
  revokeOk: string;
  revokeError: string;
  genericError: string;
  unauthorized: string;
  notFound: string;
  revoked: string;
  rateLimited: string;
};

type Props = {
  terminalId: string;
  terminalName: string;
  isRevoked: boolean;
  labels: Labels;
};

class RequestError extends Error {
  readonly code: string;

  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.code = code;
  }
}

function mapCodeToMessage(code: string, labels: Labels) {
  switch (code) {
    case "UNAUTHORIZED":
      return labels.unauthorized;
    case "POS_TERMINAL_NOT_FOUND":
    case "TERMINAL_NOT_FOUND":
      return labels.notFound;
    case "TERMINAL_REVOKED":
    case "POS_TERMINAL_ALREADY_REVOKED":
      return labels.revoked;
    case "POS_RATE_LIMITED":
    case "TERMINAL_RATE_LIMITED":
      return labels.rateLimited;
    default:
      return labels.genericError;
  }
}

export function TerminalDetailActions({ terminalId, terminalName, isRevoked, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [activationApiKey, setActivationApiKey] = useState<string | null>(null);
  const [activationKeyCopied, setActivationKeyCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const regenerate = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/terminals/${terminalId}/regenerate-key`, {
          method: "POST"
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; code?: string; activationApiKey?: string }
          | null;
        if (!response.ok) {
          throw new RequestError(payload?.error || "request failed", payload?.code || "UNKNOWN");
        }
        const key = typeof payload?.activationApiKey === "string" ? payload.activationApiKey : "";
        if (!key) {
          throw new RequestError(labels.genericError, "UNKNOWN");
        }
        setActivationApiKey(key);
        setActivationKeyCopied(false);
        setKeyDialogOpen(true);
        toast.success(labels.regenerateOk);
        router.refresh();
      } catch (error) {
        const code = error instanceof RequestError ? error.code : "UNKNOWN";
        toast.error(labels.regenerateError, { description: mapCodeToMessage(code, labels) });
      }
    });
  };

  const revoke = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/terminals/${terminalId}/revoke`, {
          method: "POST"
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; code?: string } | null;
        if (!response.ok) {
          throw new RequestError(payload?.error || "request failed", payload?.code || "UNKNOWN");
        }

        toast.success(labels.revokeOk);
        setOpen(false);
        router.refresh();
      } catch (error) {
        const code = error instanceof RequestError ? error.code : "UNKNOWN";
        toast.error(labels.revokeError, { description: mapCodeToMessage(code, labels) });
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        disabled={isPending}
        onClick={regenerate}
        className="bg-emerald-600 text-white hover:bg-emerald-500"
      >
        {isPending ? labels.regenerating : labels.regenerate}
      </Button>
      <Button
        type="button"
        disabled={isRevoked || isPending}
        onClick={() => setOpen(true)}
        className="bg-red-600 text-white hover:bg-red-500"
      >
        {isRevoked ? labels.revokeDisabled : labels.revoke}
      </Button>
      <TerminalRevokeDialog
        open={open}
        onOpenChange={setOpen}
        terminalName={terminalName}
        isPending={isPending}
        labels={labels.revokeDialog}
        onConfirm={revoke}
      />
      <TerminalActivationKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        activationApiKey={activationApiKey}
        copied={activationKeyCopied}
        labels={labels.regenerateDialog}
        onCopy={async () => {
          if (!activationApiKey) {
            return;
          }
          await navigator.clipboard.writeText(activationApiKey);
          setActivationKeyCopied(true);
        }}
      />
    </>
  );
}

export type { Labels as TerminalDetailActionsLabels };
