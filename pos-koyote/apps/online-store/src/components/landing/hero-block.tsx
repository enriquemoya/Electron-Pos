import { CTAButton } from "@/components/landing/cta-button";
import { Section } from "@/components/landing/section";
type HeroBlockProps = {
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageAlt: string;
};

export function HeroBlock({
  title,
  subtitle,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  imageAlt
}: HeroBlockProps) {
  return (
    <Section
      className="relative md:h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[url('/assets/hero/landing-banner.png')] bg-cover bg-center p-8"
      aria-label={imageAlt}
    >
      <div className="absolute inset-0 bg-base-900/80" />
      <div className="relative">
        <div className="flex flex-col justify-center items-center self-center">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-white/70">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton href={primaryCtaHref} label={primaryCtaLabel} />
            {secondaryCtaLabel && secondaryCtaHref ? (
              <CTAButton href={secondaryCtaHref} label={secondaryCtaLabel} variant="outline" />
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
