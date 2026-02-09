import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/navigation";

type CommunityTeaserCardProps = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  backgroundImage: string;
  imageAlt: string;
};

export function CommunityTeaserCard({
  title,
  body,
  href,
  linkLabel,
  backgroundImage,
  imageAlt
}: CommunityTeaserCardProps) {
  return (
    <Card
      className="relative md:h-[200px] overflow-hidden border-white/10 bg-base-900/60"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
      aria-label={imageAlt}
    >
      <div className="absolute inset-0 bg-base-900/75" />
      <CardContent className="relative flex h-full flex-col items-center justify-center">
        <div>
          <h3 className="text-base font-semibold text-white pt-8">{title}</h3>
        </div>
        <Link href={href} className="mt-auto text-xs text-accent-500 hover:text-accent-600">
          {linkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
