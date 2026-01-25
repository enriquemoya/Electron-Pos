"use client";

import { useTranslations } from "next-intl";
import { MegaMenuPanel } from "@/components/navigation/mega-menu-panel";
import { navItems } from "@/components/navigation/nav-data";
import { NavItem } from "@/components/navigation/nav-item";
import { useNavState } from "@/components/navigation/use-nav-state";

export function MainNav() {
  const t = useTranslations();
  const { navRef, openId, lockedId, openMenu, closeMenu, toggleLock } = useNavState();
  const activeItem = navItems.find((item) => item.id === openId && item.type === "mega");
  const megaSections =
    activeItem?.panel && "sections" in activeItem.panel
      ? activeItem.panel.sections.map((section) => ({
          title: t(section.titleKey),
          items: section.items.map((link) => ({
            href: link.href,
            label: t(link.labelKey),
            description: link.descriptionKey ? t(link.descriptionKey) : undefined
          }))
        }))
      : [];

  return (
    <div ref={navRef} className="relative">
      <nav role="menubar" className="flex items-center gap-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            isLocked={lockedId === item.id}
            onOpen={openMenu}
            onClose={closeMenu}
            onToggleLock={toggleLock}
          />
        ))}
      </nav>
      <MegaMenuPanel
        isOpen={Boolean(activeItem)}
        sections={megaSections}
        onClose={() => {
          if (activeItem) {
            closeMenu(activeItem.id);
          }
        }}
      />
      <span className="sr-only">{t("navigation.menu.status")}</span>
    </div>
  );
}
