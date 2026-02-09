import * as React from "react";

import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/20 text-emerald-200",
  LOW_STOCK: "bg-amber-500/20 text-amber-200",
  SOLD_OUT: "bg-slate-500/20 text-slate-200",
  PENDING_SYNC: "bg-slate-500/20 text-slate-200"
};

export function Badge({ className, state, children }: { className?: string; state?: string; children: React.ReactNode }) {
  const stateClass = state ? badgeStyles[state] : "bg-white/10 text-white";
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", stateClass, className)}>
      {children}
    </span>
  );
}
