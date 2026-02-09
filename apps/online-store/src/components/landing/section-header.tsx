import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: ReactNode;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  children
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white md:text-2xl">{title}</h2>
        {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
      </div>
      <div className={cn("flex items-center gap-3", !actionLabel && !children && "hidden") }>
        {children}
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="text-sm text-accent-500 hover:text-accent-600">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
