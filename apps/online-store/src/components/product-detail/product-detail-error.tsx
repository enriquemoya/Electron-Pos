import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";

export function ProductDetailError({
  title,
  body,
  backToCatalogLabel
}: {
  title: string;
  body: string;
  backToCatalogLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-base-800 p-6">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/70">{body}</p>
        <Button asChild variant="outline">
          <Link href="/catalog">{backToCatalogLabel}</Link>
        </Button>
      </div>
    </section>
  );
}

