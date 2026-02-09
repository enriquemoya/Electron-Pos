"use client";

import { MenuLink } from "@/components/navigation/menu-link";

type MenuItem = {
  href: string;
  label: string;
  description?: string;
};

type MenuSectionProps = {
  title: string;
  items: MenuItem[];
};

export function MenuSection({ title, items }: MenuSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{title}</p>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <MenuLink key={`${item.href}-${item.label}`} {...item} />
        ))}
      </div>
    </div>
  );
}
