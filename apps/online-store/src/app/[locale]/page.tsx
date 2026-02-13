import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import { Suspense } from "react";
import { ProfileCompletionDialog } from "@/components/account/profile-completion-dialog";
import { LogoutReload } from "@/components/auth/logout-reload";
import { CTAButton } from "@/components/landing/cta-button";
import { FeaturedGrid, FeaturedSkeleton } from "@/components/landing/featured-grid";
import { GameHighlightCard } from "@/components/landing/game-highlight-card";
import { CommunityTeaserCard } from "@/components/landing/community-teaser-card";
import { HeroBlock } from "@/components/landing/hero-block";
import { Section } from "@/components/landing/section";
import { SectionHeader } from "@/components/landing/section-header";
import { fetchProfile } from "@/lib/profile-api";
import { JsonLd } from "@/components/seo/json-ld";
import { BRAND_CONFIG } from "@/config/brand-config";

export default async function HomePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const token = cookies().get("auth_access")?.value;
  let showProfilePrompt = false;
  if (token) {
    const profile = await fetchProfile();
    showProfilePrompt = Boolean(
      profile?.user && (!profile.user.firstName || !profile.user.lastName)
    );
  }
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: t("common.brand.name"),
    url: BRAND_CONFIG.siteUrl,
    logo: `${BRAND_CONFIG.siteUrl}${BRAND_CONFIG.logoPath}`,
    sameAs: BRAND_CONFIG.social.map((item) => item.href)
  };

  return (
    <div className="flex flex-col gap-16">
      <JsonLd id="danimezone-organization" data={organization} />
      <LogoutReload />
      <ProfileCompletionDialog
        open={showProfilePrompt}
        href="/account/profile"
        labels={{
          title: t("account.profilePrompt.title"),
          description: t("account.profilePrompt.description"),
          primary: t("account.profilePrompt.primary"),
          secondary: t("account.profilePrompt.secondary")
        }}
      />
      <HeroBlock
        title={t("landing.hero.title")}
        subtitle={t("landing.hero.subtitle")}
        primaryCtaLabel={t("landing.hero.primaryCta")}
        primaryCtaHref="/catalog"
        secondaryCtaLabel={t("landing.hero.secondaryCta")}
        secondaryCtaHref="/catalog?category=pokemon"
        imageAlt={t("landing.hero.imageAlt")}
      />

      <Section className="flex flex-col gap-6">
        <SectionHeader
          title={t("landing.featured.title")}
          actionLabel={t("common.viewAll")}
          actionHref="/catalog"
        />
        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedGrid
            emptyLabel={t("landing.featured.empty")}
            errorLabel={t("landing.featured.error")}
          />
        </Suspense>
      </Section>

      <Section className="flex flex-col gap-6">
        <SectionHeader title={t("landing.games.title")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: "pokemon",
              title: t("navigation.items.pokemon"),
              description: t("landing.games.pokemon"),
              href: "/catalog?category=pokemon"
            },
            {
              id: "one-piece",
              title: t("navigation.items.onePiece"),
              description: t("landing.games.onePiece"),
              href: "/catalog?category=one%20piece"
            },
            {
              id: "yugioh",
              title: t("navigation.items.yugioh"),
              description: t("landing.games.yugioh"),
              href: "/catalog?category=yugioh"
            },
            {
              id: "others",
              title: t("navigation.items.others"),
              description: t("landing.games.others"),
              href: "/catalog"
            }
          ].map((item) => (
            <GameHighlightCard
              key={item.id}
              title={item.title}
              description={item.description}
              href={item.href}
              ctaLabel={t("common.learnMore")}
            />
          ))}
        </div>
      </Section>

      <Section className="rounded-3xl border border-white/10 bg-base-800/60 p-8">
        <SectionHeader title={t("landing.community.title")} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              id: "news",
              title: t("landing.community.newsTitle"),
              body: t("landing.community.placeholderLink"),
              image: "/assets/landing/news.png",
              imageAlt: t("landing.community.newsImageAlt")
            },
            {
              id: "events",
              title: t("landing.community.eventsTitle"),
              body: t("landing.community.placeholderLink"),
              image: "/assets/landing/events.png",
              imageAlt: t("landing.community.eventsImageAlt")
            },
            {
              id: "tournaments",
              title: t("landing.community.communityTitle"),
              body: t("landing.community.placeholderLink"),
              image: "/assets/landing/community.png",
              imageAlt: t("landing.community.communityImageAlt")
            }
          ].map((item) => (
            <CommunityTeaserCard
              key={item.id}
              title={item.title}
              body={item.body}
              href="#"
              linkLabel={t("common.learnMore")}
              backgroundImage={item.image}
              imageAlt={item.imageAlt}
            />
          ))}
        </div>
      </Section>

      <Section className="rounded-3xl border border-white/10 bg-gradient-to-br from-base-800 to-base-900 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{t("landing.cta.title")}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <CTAButton href="/catalog" label={t("landing.cta.primaryCta")} />
            <CTAButton href="#" label={t("landing.cta.secondaryCta")} variant="outline" />
          </div>
        </div>
      </Section>
    </div>
  );
}
