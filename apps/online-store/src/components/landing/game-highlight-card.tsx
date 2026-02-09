import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/navigation";

type GameHighlightCardProps = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export function GameHighlightCard({ title, description, href, ctaLabel }: GameHighlightCardProps) {
  return (
    <Card className="border-white/10 bg-base-800/60">
      <CardContent className="flex h-full flex-col gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/60">{description}</p>
        </div>
        <Link href={href} className="mt-auto text-xs text-accent-500 hover:text-accent-600">
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
