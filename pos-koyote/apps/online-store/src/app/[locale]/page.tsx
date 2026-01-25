import { getTranslations } from "next-intl/server";

import { ProductCard } from "@/components/product-card";
import { CTAButton } from "@/components/landing/cta-button";
import { GameCard } from "@/components/landing/game-card";
import { Section } from "@/components/landing/section";
import { SectionHeader } from "@/components/landing/section-header";
import { fetchCatalog, type InventoryState } from "@/lib/api";
import { Link } from "@/navigation";

export default async function HomePage() {
  const t = await getTranslations();
  let products = [] as Awaited<ReturnType<typeof fetchCatalog>>["items"];
  let error = "";

  try {
    const data = await fetchCatalog({ page: 1, pageSize: 6 });
    products = data.items;
  } catch {
    error = t("landing.featured.error");
  }

  const inventoryLabelFor = (state: InventoryState | null | undefined) => {
    switch (state) {
      case "AVAILABLE":
        return t("availability.available");
      case "LOW_STOCK":
        return t("availability.low");
      case "SOLD_OUT":
        return t("availability.soldOut");
      default:
        return t("availability.pending");
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <Section className="rounded-3xl border border-white/10 bg-base-800/80 p-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr] md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t("landing.hero.tagline")}</p>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{t("landing.hero.headline")}</h1>
            <p className="mt-3 text-sm text-white/60">{t("landing.hero.body")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton href="/catalog" label={t("landing.hero.primaryCta")} />
              <CTAButton href="/catalog?category=pokemon" label={t("landing.hero.secondaryCta")} variant="outline" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-base-700/60 p-6 text-sm text-white/70">
            <p className="uppercase tracking-[0.2em] text-white/50">{t("landing.hero.noteTitle")}</p>
            <p className="mt-3">{t("landing.hero.noteBody")}</p>
          </div>
        </div>
      </Section>

      <Section className="flex flex-col gap-6">
        <SectionHeader
          title={t("landing.featured.title")}
          subtitle={t("landing.featured.subtitle")}
          actionLabel={t("landing.featured.viewAll")}
          actionHref="/catalog"
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {!error && products.length === 0 ? (
          <p className="text-sm text-white/60">{t("landing.featured.empty")}</p>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              inventoryLabel={inventoryLabelFor(product.state)}
              viewLabel={t("product.view")}
            />
          ))}
        </div>
      </Section>

      <Section className="flex flex-col gap-6">
        <SectionHeader title={t("landing.highlights.title")} subtitle={t("landing.highlights.subtitle")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: "pokemon",
              title: t("navigation.items.pokemon"),
              description: t("landing.highlights.pokemon"),
              href: "/catalog?category=pokemon"
            },
            {
              id: "one-piece",
              title: t("navigation.items.onePiece"),
              description: t("landing.highlights.onePiece"),
              href: "/catalog?category=one%20piece"
            },
            {
              id: "yugioh",
              title: t("navigation.items.yugioh"),
              description: t("landing.highlights.yugioh"),
              href: "/catalog?category=yugioh"
            },
            {
              id: "others",
              title: t("navigation.items.others"),
              description: t("landing.highlights.others"),
              href: "/catalog"
            }
          ].map((item) => (
            <GameCard
              key={item.id}
              title={item.title}
              description={item.description}
              href={item.href}
              ctaLabel={t("landing.highlights.cta")}
            />
          ))}
        </div>
      </Section>

      <Section className="rounded-3xl border border-white/10 bg-base-800/60 p-8">
        <SectionHeader title={t("landing.community.title")} subtitle={t("landing.community.subtitle")} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              id: "news",
              title: t("landing.community.news.title"),
              body: t("landing.community.news.body")
            },
            {
              id: "events",
              title: t("landing.community.events.title"),
              body: t("landing.community.events.body")
            },
            {
              id: "tournaments",
              title: t("landing.community.tournaments.title"),
              body: t("landing.community.tournaments.body")
            }
          ].map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-base-900/60 p-5">
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/60">{item.body}</p>
              <Link href="#" className="mt-4 inline-flex text-xs text-accent-500">
                {t("landing.community.cta")}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section className="rounded-3xl border border-white/10 bg-gradient-to-br from-base-800 to-base-900 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">{t("landing.cta.title")}</h2>
            <p className="text-sm text-white/60">{t("landing.cta.body")}</p>
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
