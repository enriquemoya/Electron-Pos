"use client";

import { Copy, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Labels = {
  title: string;
  description: string;
  hint: string;
  copy: string;
  copied: string;
  close: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activationApiKey: string | null;
  copied: boolean;
  labels: Labels;
  onCopy: () => Promise<void>;
};

export function TerminalActivationKeyDialog({ open, onOpenChange, activationApiKey, copied, labels, onCopy }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
            <p className="text-xs text-emerald-100/80">{labels.hint}</p>
          </div>
          <code className="block overflow-x-auto rounded-md border border-white/10 bg-base-950/80 p-3 text-xs text-white">
            {activationApiKey || ""}
          </code>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              {copied ? labels.copied : labels.copy}
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)}>
              {labels.close}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Labels as TerminalActivationKeyDialogLabels };
