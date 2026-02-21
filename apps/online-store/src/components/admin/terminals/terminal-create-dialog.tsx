"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import type { PickupBranch } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateTerminalPayload = {
  name: string;
  branchId: string;
};

type CreateTerminalResult = {
  activationApiKey: string;
};

type Labels = {
  trigger: string;
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  branchLabel: string;
  branchPlaceholder: string;
  cancel: string;
  submit: string;
  creating: string;
  keyTitle: string;
  keyDescription: string;
  keyHint: string;
  copy: string;
  copied: string;
  close: string;
  errors: {
    generic: string;
    nameRequired: string;
    branchRequired: string;
  };
  toasts: {
    created: string;
    createError: string;
  };
};

type Props = {
  branches: PickupBranch[];
  labels: Labels;
  onCreate: (payload: CreateTerminalPayload) => Promise<CreateTerminalResult>;
};

export function TerminalCreateDialog({ branches, labels, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const orderedBranches = useMemo(
    () => [...branches].sort((a, b) => `${a.name} ${a.city}`.localeCompare(`${b.name} ${b.city}`)),
    [branches]
  );

  const resetForm = () => {
    setName("");
    setBranchId("");
    setError(null);
    setCreatedKey(null);
    setCopied(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  };

  const handleCopy = async () => {
    if (!createdKey) {
      return;
    }
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(labels.errors.nameRequired);
      return;
    }
    if (!branchId) {
      setError(labels.errors.branchRequired);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await onCreate({ name: trimmedName, branchId });
        setCreatedKey(result.activationApiKey);
        toast.success(labels.toasts.created);
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : labels.errors.generic;
        setError(message);
        toast.error(labels.toasts.createError, { description: message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="gap-2">
          <Plus className="h-4 w-4" />
          {labels.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-200">{labels.keyTitle}</p>
                <p className="text-xs text-emerald-100/80">{labels.keyDescription}</p>
              </div>
            </div>
            <code className="block overflow-x-auto rounded-md border border-white/10 bg-base-950/80 p-3 text-xs text-white">
              {createdKey}
            </code>
            <p className="text-xs text-white/60">{labels.keyHint}</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
                <Copy className="h-4 w-4" />
                {copied ? labels.copied : labels.copy}
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                {labels.close}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">{labels.nameLabel}</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.namePlaceholder} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">{labels.branchLabel}</label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder={labels.branchPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {orderedBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
                {labels.cancel}
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending ? labels.creating : labels.submit}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { CreateTerminalPayload, CreateTerminalResult, Labels as TerminalCreateDialogLabels };
