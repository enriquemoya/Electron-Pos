"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type TerminalRevokeDialogLabels = {
  title: string;
  description: string;
  cancel: string;
  confirm: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalName: string;
  isPending: boolean;
  labels: TerminalRevokeDialogLabels;
  onConfirm: () => void;
};

export function TerminalRevokeDialog({
  open,
  onOpenChange,
  terminalName,
  isPending,
  labels,
  onConfirm
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{labels.title}</AlertDialogTitle>
          <AlertDialogDescription>{labels.description.replace("{name}", terminalName)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="ghost" disabled={isPending}>
              {labels.cancel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {labels.confirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type { TerminalRevokeDialogLabels };
