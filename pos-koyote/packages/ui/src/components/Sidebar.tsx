"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  href: string;
  label: string;
};

type SidebarProps = {
  appName: string;
  items: SidebarItem[];
  eyebrow: string;
  activeBadge: string;
  inactiveBadge: string;
  footerText: string;
};

export function Sidebar({ appName, items, eyebrow, activeBadge, inactiveBadge, footerText }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-white/10 bg-base-900 px-6 py-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">
          {eyebrow}
        </span>
        <span className="text-2xl font-semibold text-white">{appName}</span>
      </div>
      <nav className="mt-10 flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition ${
                isActive
                  ? "bg-accent-500/20 text-accent-500"
                  : "bg-white/5 text-zinc-200 hover:bg-white/10"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                {isActive ? activeBadge : inactiveBadge}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
        {footerText}
      </div>
    </aside>
  );
}
