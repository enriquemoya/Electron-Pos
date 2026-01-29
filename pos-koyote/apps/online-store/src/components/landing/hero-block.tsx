import { CTAButton } from "@/components/landing/cta-button";
import { Section } from "@/components/landing/section";

type HeroBlockProps = {
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export function HeroBlock({
  title,
  subtitle,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref
}: HeroBlockProps) {
  return (
    <Section className="rounded-3xl border border-white/10 bg-gradient-to-br from-base-800 via-base-900 to-base-950 p-8">
      <div className="grid gap-6 md:grid-cols-[1.15fr,0.85fr] md:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-white/70">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton href={primaryCtaHref} label={primaryCtaLabel} />
            {secondaryCtaLabel && secondaryCtaHref ? (
              <CTAButton href={secondaryCtaHref} label={secondaryCtaLabel} variant="outline" />
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-base-800/60 p-6 text-sm text-white/60">
          <div className="h-32 rounded-xl border border-white/10 bg-base-900/60" />
        </div>
      </div>
    </Section>
  );
}
