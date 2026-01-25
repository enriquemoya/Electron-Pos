"use client";

import { Link } from "@/navigation";

type MenuLinkProps = {
  href: string;
  label: string;
  description?: string;
};

export function MenuLink({ href, label, description }: MenuLinkProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
    >
      <span className="font-medium text-white">{label}</span>
      {description ? <span className="text-xs text-white/50">{description}</span> : null}
    </Link>
  );
}
