"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { SimpleDropdown } from "@/components/navigation/simple-dropdown";
import { Link } from "@/navigation";

export type NavigationGroup = {
  id: string;
  label: string;
  items: Array<{ href: string; label: string }>;
  sections?: Array<{
    id: string;
    title: string;
    href?: string;
    items: Array<{ href: string; label: string }>;
  }>;
};

type MainNavProps = {
  groups: NavigationGroup[];
  miscLink: { href: string; label: string };
};

export function MainNav({ groups, miscLink }: MainNavProps) {
  const t = useTranslations();
  const [openId, setOpenId] = useState<string | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);

  const openMenu = (id: string) => {
    setOpenId(id);
  };

  const closeMenu = (id: string) => {
    if (lockedId === id) {
      return;
    }
    setOpenId((current) => (current === id ? null : current));
  };

  const toggleMenu = (id: string) => {
    setLockedId((current) => {
      if (current === id) {
        setOpenId(null);
        return null;
      }
      setOpenId(id);
      return id;
    });
  };

  return (
    <div className="flex items-center gap-2">
      <nav role="menubar" className="flex items-center gap-2">
        {groups.map((group) => {
          const isOpen = openId === group.id;
          return (
            <div
              key={group.id}
              className="relative"
              onMouseEnter={() => openMenu(group.id)}
              onMouseLeave={() => closeMenu(group.id)}
            >
              <button
                type="button"
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  isOpen ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                }`}
                onClick={() => toggleMenu(group.id)}
              >
                {group.label}
              </button>
              <SimpleDropdown
                isOpen={isOpen}
                items={group.items}
                sections={group.sections}
                onClose={() => closeMenu(group.id)}
              />
            </div>
          );
        })}
      </nav>
      <Link
        href={miscLink.href}
        className="rounded-full px-4 py-2 text-sm text-white/70 transition hover:text-white"
      >
        {miscLink.label}
      </Link>
      <span className="sr-only">{t("navigation.menu.status")}</span>
    </div>
  );
}
