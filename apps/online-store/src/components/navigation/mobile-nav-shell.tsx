"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/navigation/mobile-nav";
import type { NavigationGroup } from "@/components/navigation/main-nav";

type MobileNavToggleProps = {
  groups: NavigationGroup[];
  miscLink: { href: string; label: string };
};

export function MobileNavToggle({ groups, miscLink }: MobileNavToggleProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-xs text-white/70"
        aria-label={t("navigation.mobile.menu")}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      <MobileNav
        isOpen={open}
        onClose={() => setOpen(false)}
        groups={groups}
        miscLink={miscLink}
      />
    </>
  );
}
