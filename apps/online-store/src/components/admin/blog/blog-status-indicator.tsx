import { Loader2 } from "lucide-react";

export function BlogStatusIndicator({
  status,
  isPublished,
  publishedLabel,
  draftLabel,
  savingLabel,
  savedLabel
}: {
  status: "idle" | "saving" | "saved";
  isPublished: boolean;
  publishedLabel: string;
  draftLabel: string;
  savingLabel: string;
  savedLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/60">
      <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wide">
        {isPublished ? publishedLabel : draftLabel}
      </span>
      {status === "saving" ? (
        <span className="inline-flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> {savingLabel}
        </span>
      ) : status === "saved" ? (
        <span>{savedLabel}</span>
      ) : null}
    </div>
  );
}
