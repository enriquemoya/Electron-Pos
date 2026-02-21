"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";

import type { AdminTerminal } from "@/lib/admin-api";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TerminalRevokeDialog, type TerminalRevokeDialogLabels } from "@/components/admin/terminals/terminal-revoke-dialog";

type Labels = {
  details: string;
  regenerate: string;
  regenerating: string;
  revoke: string;
  revoking: string;
  disabled: string;
  menuLabel: string;
  revokeDialog: TerminalRevokeDialogLabels;
};

type Props = {
  terminal: AdminTerminal;
  labels: Labels;
  onRegenerate: (terminalId: string) => Promise<void>;
  onRevoke: (terminalId: string) => Promise<void>;
};

export function TerminalActions({ terminal, labels, onRegenerate, onRevoke }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isRevoked = terminal.status === "REVOKED";

  const handleRegenerate = () => {
    startTransition(async () => {
      await onRegenerate(terminal.id);
    });
  };

  const handleRevoke = () => {
    startTransition(async () => {
      await onRevoke(terminal.id);
      setConfirmOpen(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" aria-label={labels.menuLabel}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/terminals/${terminal.id}`}>{labels.details}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onSelect={handleRegenerate}>
            {isPending ? labels.regenerating : labels.regenerate}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isRevoked || isPending}
            className={isRevoked ? "text-white/50" : "text-red-200 focus:text-red-100"}
            onSelect={(event) => {
              event.preventDefault();
              if (!isRevoked) {
                setConfirmOpen(true);
              }
            }}
          >
            {isRevoked ? labels.disabled : isPending ? labels.revoking : labels.revoke}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TerminalRevokeDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        terminalName={terminal.name}
        isPending={isPending}
        labels={labels.revokeDialog}
        onConfirm={handleRevoke}
      />
    </>
  );
}

export type { Labels as TerminalActionsLabels };
