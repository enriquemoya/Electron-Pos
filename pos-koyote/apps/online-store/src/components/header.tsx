import { getTranslations } from "next-intl/server";

import { Link } from "@/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { Search } from "@/components/navigation/search";
import { Cart } from "@/components/navigation/cart";
import { LocaleSwitcher } from "@/components/navigation/locale-switcher";
import { secondaryLinks } from "@/components/navigation/nav-data";
import { MobileNavToggle } from "@/components/navigation/mobile-nav-shell";

export async function Header() {
  const t = await getTranslations();
  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-white/5 bg-base-900/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-[0.15em] text-white">
          {t("navigation.brand.name")}
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <MainNav />
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition hover:text-white"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Search variant="desktop" />
          <Cart />
          <LocaleSwitcher />
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Cart />
          <LocaleSwitcher />
          <MobileNavToggle />
        </div>
      </div>
    </header>
  );
}
