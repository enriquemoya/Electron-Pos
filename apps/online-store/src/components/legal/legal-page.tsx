import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  subtitle?: string;
  sections: LegalSection[];
  backHref: string;
  backLabel: string;
  fallbackTitle: string;
  fallbackBody: string;
  fallbackCta: string;
};

export function LegalPage({
  title,
  subtitle,
  sections,
  backHref,
  backLabel,
  fallbackTitle,
  fallbackBody,
  fallbackCta
}: LegalPageProps) {
  const hasSections = Array.isArray(sections) && sections.length > 0;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Button asChild variant="ghost" className="w-fit px-0 text-xs uppercase tracking-[0.2em]">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
      </header>
      {hasSections ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-base-800/60 p-6">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm text-white/70">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-base-800/60 p-6 text-sm text-white/70">
          <h2 className="text-lg font-semibold text-white">{fallbackTitle}</h2>
          <p className="mt-2">{fallbackBody}</p>
          <Button asChild variant="ghost" className="mt-4 px-0 text-amber-300">
            <Link href={backHref}>{fallbackCta}</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
