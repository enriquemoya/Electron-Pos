import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { Link } from "@/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { Search } from "@/components/navigation/search";
import { Cart } from "@/components/navigation/cart";
import { AccountMenu } from "@/components/navigation/account-menu";
import { LocaleSwitcher } from "@/components/navigation/locale-switcher";
import { MobileNavToggle } from "@/components/navigation/mobile-nav-shell";
import { fetchCategoriesByGame, fetchTaxonomyBundle, taxonomyLabel } from "@/lib/taxonomies";

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations();
  const token = cookies().get("auth_access")?.value;
  const secret = process.env.JWT_SECRET;
  let role: string | null = null;
  if (token && secret) {
    try {
      const payload = jwt.verify(token, secret) as { role?: string };
      role = payload.role ?? null;
    } catch {
      role = null;
    }
  }
  const canAccessAdmin = role === "ADMIN" || role === "EMPLOYEE";
  const adminHref = role === "EMPLOYEE" ? "/admin/orders" : "/admin/home";
  const taxonomy = await fetchTaxonomyBundle();
  const categoriesByGame = await fetchCategoriesByGame(taxonomy.games);

  const categories = taxonomy.categories
    .map((item) => ({
      ...item,
      label: taxonomyLabel(item, locale)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const categoryById = new Map(categories.map((category) => [category.id, category] as const));
  const expansions = taxonomy.expansions
    .map((item) => ({
      ...item,
      label: taxonomyLabel(item, locale)
    }));
  const gameGroups = taxonomy.games
    .map((game) => {
      const gameLabel = taxonomyLabel(game, locale);
      const gameCategories = (categoriesByGame.get(game.id) ?? [])
        .map((category) => categoryById.get(category.id))
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .sort((a, b) => a.label.localeCompare(b.label));

      const expansionsForGame = expansions
        .filter((expansion) => expansion.parentId === game.id)
        .sort((a, b) => {
          const dateA = a.releaseDate ? new Date(`${a.releaseDate}T00:00:00.000Z`).getTime() : 0;
          const dateB = b.releaseDate ? new Date(`${b.releaseDate}T00:00:00.000Z`).getTime() : 0;
          if (dateA !== dateB) {
            return dateB - dateA;
          }
          return a.label.localeCompare(b.label);
        })
        .slice(0, 5);

      const expansionSections = expansionsForGame.map((expansion) => {
        const expansionCategories = gameCategories
          .filter((category) => category.parentId === expansion.id)
          .map((category) => ({
            href: `/catalog/${game.slug}/${category.slug}/${expansion.slug}`,
            label: category.label
          }));
        return {
          id: `exp-${expansion.id}`,
          title: expansion.label,
          href: `/catalog/${game.slug}/${expansion.slug}`,
          items: expansionCategories
        };
      });

      const gameOnlyCategoryItems = gameCategories
        .filter((category) => category.parentId === game.id)
        .map((category) => ({
          href: `/catalog/${game.slug}/${category.slug}`,
          label: category.label
        }));

      const sections: Array<{
        id: string;
        title: string;
        href?: string;
        items: Array<{ href: string; label: string }>;
      }> = [
        ...expansionSections,
        ...(gameOnlyCategoryItems.length > 0
          ? [
              {
                id: `other-${game.id}`,
                title: t("navigation.items.others"),
                items: gameOnlyCategoryItems
              }
            ]
          : [])
      ];

      const flatItems = sections.flatMap((section) => [
        ...(section.href ? [{ href: section.href, label: section.title }] : []),
        ...section.items
      ]);
      return {
        id: `game-${game.id}`,
        label: gameLabel,
        items: flatItems,
        sections
      };
    })
    .filter((group) => group.sections.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryUsageBySlug = new Map<string, { count: number; category: (typeof categories)[number] }>();
  categoriesByGame.forEach((gameCategories) => {
    const uniqueSlugs = new Set<string>();
    gameCategories.forEach((item) => {
      uniqueSlugs.add(item.slug);
    });
    uniqueSlugs.forEach((slug) => {
      const candidate = categories.find((category) => category.slug === slug);
      if (!candidate) {
        return;
      }
      const current = categoryUsageBySlug.get(slug);
      if (!current) {
        categoryUsageBySlug.set(slug, { count: 1, category: candidate });
        return;
      }
      categoryUsageBySlug.set(slug, { count: current.count + 1, category: current.category });
    });
  });

  const sharedCategories = Array.from(categoryUsageBySlug.values())
    .filter((item) => item.count > 1)
    .map((item) => item.category)
    .sort((a, b) => a.label.localeCompare(b.label));

  const navGroups = [
    ...gameGroups,
    ...(sharedCategories.length
      ? [
          {
            id: "global-categories",
            label: t("navigation.items.categories"),
            items: sharedCategories.map((category) => ({
              href: `/catalog/${category.slug}`,
              label: category.label
            }))
          }
        ]
      : [])
  ];

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-white/5 bg-base-900/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4">
        <div className="flex min-h-[88px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Image
              src="/assets/logo.webp"
              alt={t("navigation.brand.name")}
              width={100}
              height={90}
              className="h-[2.25rem] w-[2.5rem] rounded-full border border-white/10 bg-base-900 lg:h-[4.5rem] lg:w-[5rem]"
              priority
            />
            <span className="text-lg font-semibold tracking-[0.15em] lg:hidden">
              {t("navigation.brand.short")}
            </span>
            <span className="hidden text-lg font-semibold tracking-[0.15em] lg:inline">
              {t("navigation.brand.name")}
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            <MainNav
              groups={navGroups}
              miscLink={{ href: "/catalog/misc", label: t("navigation.items.misc") }}
            />
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Search variant="desktop" />
            <AccountMenu
              profileHref="/account/profile"
              ordersHref="/account/orders"
              adminHref={adminHref}
              profileLabel={t("navigation.account.menu.profile")}
              ordersLabel={t("navigation.account.menu.orders")}
              adminLabel={t("navigation.account.menu.admin")}
              logoutLabel={t("navigation.account.menu.logout")}
              menuLabel={t("navigation.account.label")}
              signInLabel={t("navigation.account.menu.signIn")}
              signInHref="/auth/login"
              logoutHref="/auth/logout"
              isAuthenticated={Boolean(token)}
              isAdmin={canAccessAdmin}
            />
            <Cart />
            <LocaleSwitcher />
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <AccountMenu
              profileHref="/account/profile"
              ordersHref="/account/orders"
              adminHref={adminHref}
              profileLabel={t("navigation.account.menu.profile")}
              ordersLabel={t("navigation.account.menu.orders")}
              adminLabel={t("navigation.account.menu.admin")}
              logoutLabel={t("navigation.account.menu.logout")}
              menuLabel={t("navigation.account.label")}
              signInLabel={t("navigation.account.menu.signIn")}
              signInHref="/auth/login"
              logoutHref="/auth/logout"
              isAuthenticated={Boolean(token)}
              isAdmin={canAccessAdmin}
            />
            <Cart />
            <LocaleSwitcher />
            <MobileNavToggle
              groups={navGroups}
              miscLink={{ href: "/catalog/misc", label: t("navigation.items.misc") }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
