import Image from "next/image";
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
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4">
        <div className="flex min-h-[88px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Image
              src="/assets/hero/store-logo.png"
              alt={t("navigation.brand.name")}
              width={88}
              height={88}
              className="h-[2.1875rem] w-[2.1875rem] rounded-full border border-white/10 bg-base-900 lg:h-[5.5rem] lg:w-[5.5rem]"
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
      </div>
    </header>
  );
}
