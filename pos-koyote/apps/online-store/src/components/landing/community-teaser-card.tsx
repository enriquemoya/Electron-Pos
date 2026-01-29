import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/navigation";

type CommunityTeaserCardProps = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export function CommunityTeaserCard({ title, body, href, linkLabel }: CommunityTeaserCardProps) {
  return (
    <Card className="border-white/10 bg-base-900/60">
      <CardContent className="flex h-full flex-col gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/60">{body}</p>
        </div>
        <Link href={href} className="mt-auto text-xs text-accent-500 hover:text-accent-600">
          {linkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
