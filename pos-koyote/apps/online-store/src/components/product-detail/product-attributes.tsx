import { cn } from "@/lib/utils";

export type ProductAttribute = {
  label: string;
  value: string;
};

export function ProductAttributes({
  title,
  attributes,
  className
}: {
  title?: string | null;
  attributes: ProductAttribute[];
  className?: string;
}) {
  if (!attributes.length) {
    return null;
  }

  return (
    <section className={cn("rounded-2xl border border-white/10 bg-base-800/70 p-5", className)}>
      {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
      <dl className={cn("mt-4 divide-y divide-white/10", title ? "" : "divide-y-0")}>
        {attributes.map((attr) => (
          <div key={attr.label} className="grid grid-cols-2 gap-4 py-3">
            <dt className="text-sm text-white/60">{attr.label}</dt>
            <dd className="text-sm text-white">{attr.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

