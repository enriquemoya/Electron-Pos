import { renderBlogContent } from "@/lib/blog-content";

export function BlogPreviewRenderer({
  contentJson,
  title,
  excerpt,
  previewLabel,
  untitledLabel
}: {
  contentJson: Record<string, unknown>;
  title: string;
  excerpt: string;
  previewLabel: string;
  untitledLabel: string;
}) {
  const rendered = renderBlogContent(contentJson);

  return (
    <section className="space-y-4 rounded-lg border border-white/10 bg-base-900 p-4">
      <p className="text-xs uppercase tracking-wide text-white/60">{previewLabel}</p>
      <h2 className="text-2xl font-semibold text-white">{title || untitledLabel}</h2>
      <p className="text-white/70">{excerpt}</p>
      <div className="space-y-4">{rendered.content}</div>
    </section>
  );
}
