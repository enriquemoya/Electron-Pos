import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";

type GameCardProps = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  badge?: ReactNode;
  className?: string;
};

export function GameCard({ title, description, href, ctaLabel, badge, className }: GameCardProps) {
  return (
    <Link href={href} className="group">
      <Card className={cn("relative h-full border border-white/10 bg-base-800/70 transition group-hover:border-white/20", className)}>
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {badge ? <span className="text-xs text-white/50">{badge}</span> : null}
          </div>
          <p className="text-sm text-white/60">{description}</p>
          <span className="mt-auto text-xs text-accent-500">{ctaLabel}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
